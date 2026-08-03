#!/bin/bash
# ============================================================
# Docker 构建脚本 — Lion E-Trides
# 用法: ./docker-build.sh [--clean] [--no-cache] [--push]
# ============================================================
set -e

# ─── 配置 ───
IMAGE_NAME="lionetrides"
IMAGE_TAG="latest"
CONTAINER_NAME="lionetrides-container"

# ─── 颜色 ───
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

# ─── 参数解析 ───
CLEAN=false
NO_CACHE=false
DEPLOY_REGION="auto"
for arg in "$@"; do
  case $arg in
    --clean)       CLEAN=true ;;
    --no-cache)    NO_CACHE=true ;;
    --region=*)    DEPLOY_REGION="${arg#*=}" ;;
    --region)      DEPLOY_REGION="$2"; shift ;;
    -h|--help)
      echo "用法: ./docker-build.sh [选项]"
      echo ""
      echo "选项:"
      echo "  --clean        构建前清理 Docker 缓存和悬空镜像"
      echo "  --no-cache     不使用 Docker 缓存（完全重新构建）"
      echo "  --region=auto  自动检测镜像源（默认）"
      echo "  --region=cn    强制使用国内镜像源"
      echo "  --region=global 强制使用官方源"
      echo "  -h, --help     显示帮助"
      exit 0
      ;;
    *)           echo "未知参数: $arg"; exit 1 ;;
  esac
done

cd "$(dirname "$0")"

echo ""
echo "=========================================="
echo "  Docker 构建 — Lion E-Trides"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# ============================================================
# 阶段 1：预检
# ============================================================
log "阶段 1/3：预检..."

# 1.1 磁盘空间
DISK_AVAIL=$(df / --output=avail -BM | tail -1 | tr -d ' M')
if [ "$DISK_AVAIL" -lt 5120 ]; then
  warn "磁盘剩余 ${DISK_AVAIL}MB < 5GB，建议先清理"
  if [ "$CLEAN" = true ]; then
    log "执行清理..."
    sudo docker system prune -af --volumes 2>/dev/null || true
    pnpm store prune 2>/dev/null || true
    DISK_AVAIL=$(df / --output=avail -BM | tail -1 | tr -d ' M')
    ok "清理完成，剩余 ${DISK_AVAIL}MB"
  else
    warn "加 --clean 参数可自动清理"
  fi
else
  ok "磁盘空间充足: ${DISK_AVAIL}MB"
fi

# 1.2 Docker 服务
if ! sudo docker info >/dev/null 2>&1; then
  fail "Docker 服务未运行，执行: sudo systemctl start docker"
fi
ok "Docker 服务运行中"

# 1.3 Dockerfile 存在
if [ ! -f "Dockerfile" ]; then
  fail "Dockerfile 不存在"
fi
ok "Dockerfile 存在"

# 1.4 .dockerignore 存在
if [ ! -f ".dockerignore" ]; then
  warn ".dockerignore 不存在，构建上下文可能很大"
else
  ok ".dockerignore 存在"
fi

# 1.5 node_modules 存在（需要从宿主机复制）
if [ ! -d "node_modules" ]; then
  log "node_modules 不存在，执行 pnpm install..."
  pnpm install
fi
ok "node_modules 存在"

echo ""

# ============================================================
# 阶段 2：构建
# ============================================================
log "阶段 2/3：构建镜像..."

BUILD_ARGS=""
if [ "$NO_CACHE" = true ]; then
  BUILD_ARGS="--no-cache"
  log "使用 --no-cache（忽略缓存）"
fi

# 计算构建上下文大小
CONTEXT_SIZE=$(du -sh . --exclude=.git --exclude=.next 2>/dev/null | cut -f1)
log "构建上下文: $CONTEXT_SIZE"

# 构建
BUILD_START=$SECONDS
log "构建参数: DEPLOY_REGION=${DEPLOY_REGION}"
sudo docker build --network=host \
  --build-arg "DEPLOY_REGION=${DEPLOY_REGION}" \
  --build-arg "BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  $BUILD_ARGS -t "${IMAGE_NAME}:${IMAGE_TAG}" . 2>&1
BUILD_ELAPSED=$((SECONDS - BUILD_START))

echo ""
ok "构建完成！耗时: ${BUILD_ELAPSED}s"

# 镜像大小
IMAGE_SIZE=$(sudo docker images "${IMAGE_NAME}:${IMAGE_TAG}" --format "{{.Size}}" 2>/dev/null)
log "镜像大小: $IMAGE_SIZE"

echo ""

# ============================================================
# 阶段 3：验证
# ============================================================
log "阶段 3/3：验证..."

# 检查镜像是否成功创建
if sudo docker images "${IMAGE_NAME}:${IMAGE_TAG}" --format '{{.Repository}}' | grep -q "${IMAGE_NAME}"; then
  ok "镜像创建成功"
else
  fail "镜像创建失败"
fi

echo ""
echo "=========================================="
echo "  构建完成"
echo "=========================================="
echo ""
echo "  镜像: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "  大小: $IMAGE_SIZE"
echo "  耗时: ${BUILD_ELAPSED}s"
echo ""
echo "  运行: ./docker-run.sh"
echo "  日志: sudo docker logs -f ${CONTAINER_NAME}"
echo "  访问: http://localhost:3000"
echo ""
