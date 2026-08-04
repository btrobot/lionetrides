#!/bin/bash
# ─── 本地预推送验证 ───
# 在 push 前运行，验证 Dockerfile + 构建 + 容器启动
# 用法: ./scripts/pre-push-check.sh [--skip-build] [--skip-run]
set -euo pipefail

SKIP_BUILD=false
SKIP_RUN=false

for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
    --skip-run)   SKIP_RUN=true ;;
    --help)
      echo "用法: $0 [--skip-build] [--skip-run]"
      echo "  --skip-build  跳过 Docker 构建（只做静态检查）"
      echo "  --skip-run    跳过容器运行测试（只做构建）"
      exit 0
      ;;
  esac
done

PROJECT_NAME="lionetrides"
PASS=0
FAIL=0
IMAGE_TAG="${PROJECT_NAME}:pre-push-test"

pass() { echo "  ✓ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }

echo "========================================"
echo "  本地预推送验证"
echo "========================================"

# ─── L1: Dockerfile 静态检查 ───
echo ""
echo "── L1: Dockerfile 静态检查 ──"

if command -v hadolint &>/dev/null; then
  if hadolint Dockerfile 2>/dev/null; then
    pass "hadolint 通过"
  else
    fail "hadolint 发现问题（见上方输出）"
  fi
else
  echo "  ⊘ hadolint 未安装，跳过（brew install hadolint）"
fi

# 检查关键文件是否存在
for f in Dockerfile docker-entrypoint.sh migrate.js .dockerignore; do
  if [ -f "$f" ]; then
    pass "文件存在: $f"
  else
    fail "文件缺失: $f"
  fi
done

# 检查 Dockerfile 指令合法性
if grep -q "^FROM" Dockerfile; then
  pass "Dockerfile 包含 FROM 指令"
else
  fail "Dockerfile 缺少 FROM 指令"
fi

if grep -q "HEALTHCHECK" Dockerfile; then
  pass "Dockerfile 包含 HEALTHCHECK"
else
  fail "Dockerfile 缺少 HEALTHCHECK"
fi

# 检查 entrypoint 可执行权限
if [ -x docker-entrypoint.sh ]; then
  pass "docker-entrypoint.sh 有执行权限"
else
  fail "docker-entrypoint.sh 缺少执行权限 (chmod +x)"
fi

# 检查 migrate.js 语法
if node --check migrate.js 2>/dev/null; then
  pass "migrate.js 语法正确"
else
  fail "migrate.js 语法错误"
fi

# 检查迁移 SQL 文件
SQL_COUNT=$(find drizzle/ -name "*.sql" 2>/dev/null | wc -l | tr -d ' ')
if [ "$SQL_COUNT" -gt 0 ]; then
  pass "找到 ${SQL_COUNT} 个迁移 SQL 文件"
else
  echo "  ⊘ 无迁移 SQL 文件（首次部署时会自动生成）"
fi

if [ "$SKIP_BUILD" = true ]; then
  echo ""
  echo "========================================"
  echo "  结果: ${PASS} 通过, ${FAIL} 失败（已跳过构建）"
  echo "========================================"
  [ "$FAIL" -eq 0 ] && exit 0 || exit 1
fi

# ─── L2: Docker 构建 ───
echo ""
echo "── L2: Docker 构建 ──"

GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if docker build \
  --build-arg PROJECT_NAME="${PROJECT_NAME}" \
  --build-arg PROJECT_VERSION="pre-push" \
  --build-arg BUILD_DATE="${BUILD_DATE}" \
  --build-arg GIT_COMMIT="${GIT_COMMIT}" \
  --build-arg DEPLOY_REGION="test" \
  -t "${IMAGE_TAG}" \
  . 2>&1; then
  pass "Docker 构建成功"
else
  fail "Docker 构建失败"
  echo ""
  echo "========================================"
  echo "  结果: ${PASS} 通过, ${FAIL} 失败"
  echo "========================================"
  exit 1
fi

# 检查镜像大小
IMAGE_SIZE=$(docker image inspect "${IMAGE_TAG}" --format='{{.Size}}' 2>/dev/null)
IMAGE_SIZE_MB=$((IMAGE_SIZE / 1024 / 1024))
pass "镜像大小: ${IMAGE_SIZE_MB}MB"

# 检查关键文件是否在镜像中
echo ""
echo "── L2.5: 镜像内容检查 ──"

for f in server.js .next/standalone/server.js migrate.js docker-entrypoint.sh; do
  if docker run --rm --entrypoint ls "${IMAGE_TAG}" "/app/$f" &>/dev/null; then
    pass "镜像包含: $f"
  else
    # 也检查根目录
    if docker run --rm --entrypoint ls "${IMAGE_TAG}" "/$f" &>/dev/null; then
      pass "镜像包含: /$f"
    else
      fail "镜像缺失: $f"
    fi
  fi
done

# 检查 node 版本
NODE_VER=$(docker run --rm --entrypoint node "${IMAGE_TAG}" --version 2>/dev/null)
pass "Node.js 版本: ${NODE_VER}"

if [ "$SKIP_RUN" = true ]; then
  # 清理测试镜像
  docker rmi "${IMAGE_TAG}" &>/dev/null || true
  echo ""
  echo "========================================"
  echo "  结果: ${PASS} 通过, ${FAIL} 失败（已跳过运行）"
  echo "========================================"
  [ "$FAIL" -eq 0 ] && exit 0 || exit 1
fi

# ─── L3: 容器启动 + 健康检查 ───
echo ""
echo "── L3: 容器启动测试 ──"

CONTAINER_NAME="${PROJECT_NAME}-pre-push-test"

# 清理旧容器
docker rm -f "${CONTAINER_NAME}" &>/dev/null || true

# 启动容器（不需要数据库连接，只验证服务能启动）
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p 5001:5000 \
  -e PGHOST=127.0.0.1 \
  -e PGPORT=5432 \
  -e PGUSER=test \
  -e PGPASSWORD=test \
  -e PGDATABASE=test \
  -e DATABASE_URL="postgresql://test:test@127.0.0.1:5432/test" \
  "${IMAGE_TAG}" 2>/dev/null

echo "  等待服务启动..."

MAX_WAIT=30
WAITED=0
HEALTHY=false

while [ $WAITED -lt $MAX_WAIT ]; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:5001/api/health 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    HEALTHY=true
    break
  fi
  sleep 2
  WAITED=$((WAITED + 2))
  echo "  ... ${WAITED}s (HTTP ${STATUS})"
done

if [ "$HEALTHY" = true ]; then
  pass "健康检查通过 (${WAITED}s)"
else
  fail "健康检查超时 (${MAX_WAIT}s)"
  echo "  容器日志:"
  docker logs "${CONTAINER_NAME}" 2>&1 | tail -10 | sed 's/^/    /'
fi

# 测试首页
if [ "$HEALTHY" = true ]; then
  PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:5001/en 2>/dev/null || echo "000")
  if [ "$PAGE_STATUS" = "200" ]; then
    pass "首页 /en 返回 200"
  else
    fail "首页 /en 返回 ${PAGE_STATUS}"
  fi
fi

# 清理
docker rm -f "${CONTAINER_NAME}" &>/dev/null || true
docker rmi "${IMAGE_TAG}" &>/dev/null || true

echo ""
echo "========================================"
echo "  结果: ${PASS} 通过, ${FAIL} 失败"
echo "========================================"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
