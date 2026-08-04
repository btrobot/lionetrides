#!/bin/bash
# CI 脚本本地测试（简化版）
# 用法: bash scripts/ci/test.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="/tmp/ci-test-$$"
PASS=0
FAIL=0

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试辅助函数
pass() {
  echo -e "  ${GREEN}✓${NC} $1"
  ((PASS++))
}

fail() {
  echo -e "  ${RED}✗${NC} $1"
  ((FAIL++))
}

# 清理
cleanup() {
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

# 准备测试环境
setup() {
  rm -rf "$TEST_DIR"
  mkdir -p "$TEST_DIR"
}

# 初始化
setup

echo "========================================"
echo "CI 脚本本地测试"
echo "========================================"
echo ""

# ========================================
# 测试 1: health-check.sh
# ========================================
echo -e "${YELLOW}[1/4] health-check.sh${NC}"

echo "  场景: 端口无服务，超时后失败"
if APP_PORT=19999 TIMEOUT=2 INTERVAL=1 bash "$SCRIPT_DIR/health-check.sh" 2>&1 | grep -q "健康检查失败"; then
  pass "超时后输出失败信息"
else
  fail "未输出失败信息"
fi

echo ""

# ========================================
# 测试 2: init-database.sh
# ========================================
echo -e "${YELLOW}[2/4] init-database.sh${NC}"

# 创建 mock env 文件
MOCK_ENV="$TEST_DIR/.env.local"
cat > "$MOCK_ENV" << 'EOF'
PGHOST=localhost
PGPORT=5432
PGUSER=testuser
PGPASSWORD=testpass
PGDATABASE=testdb
EOF

echo "  场景: 读取环境变量"
output=$(ENV_FILE="$MOCK_ENV" bash -x "$SCRIPT_DIR/init-database.sh" 2>&1 || true)
if echo "$output" | grep -q "testuser"; then
  pass "正确读取 PGUSER"
else
  fail "未读取 PGUSER"
fi

echo "  场景: 缺少 ENV_FILE"
output=$(unset ENV_FILE; bash "$SCRIPT_DIR/init-database.sh" 2>&1 || true)
if echo "$output" | grep -q "不存在"; then
  pass "提示缺少 ENV_FILE"
else
  fail "未提示缺少 ENV_FILE"
fi

echo ""

# ========================================
# 测试 3: run-migrations.sh
# ========================================
echo -e "${YELLOW}[3/4] run-migrations.sh${NC}"

if command -v docker &> /dev/null; then
  echo "  场景: 容器不存在"
  output=$(CONTAINER_NAME="nonexistent-container-$$" bash "$SCRIPT_DIR/run-migrations.sh" 2>&1 || true)
  if echo "$output" | grep -qE "不存在|No such|Error"; then
    pass "提示容器不存在或错误"
  else
    fail "未提示容器不存在"
  fi
else
  echo -e "  ${YELLOW}⊘${NC} 跳过（无 Docker 环境）"
fi

echo ""

# ========================================
# 测试 4: rollback.sh
# ========================================
echo -e "${YELLOW}[4/4] rollback.sh${NC}"

echo "  场景: 缺少 OLD_IMAGE"
output=$(CONTAINER_NAME="test" OLD_IMAGE="" APP_PORT=19999 ENV_FILE="$MOCK_ENV" bash "$SCRIPT_DIR/rollback.sh" 2>&1 || true)
if echo "$output" | grep -q "OLD_IMAGE"; then
  pass "提示缺少 OLD_IMAGE"
else
  fail "未提示缺少 OLD_IMAGE"
fi

echo ""

# ========================================
# 回归测试：历史 Bug 防护
# ========================================
echo -e "${YELLOW}[回归测试] 历史 Bug 防护${NC}"

# Bug 1: Shell 语法错误 [ -d x && ... ]
# 根因：[ 不支持 &&，应该用两个 [ 或 test
echo "  场景: shell 语法检查（[ 不支持 &&）"
if bash -n "$SCRIPT_DIR/run-migrations.sh" 2>&1; then
  pass "run-migrations.sh 语法正确"
else
  fail "run-migrations.sh 语法错误"
fi

# Bug 2: 路径不一致 /app/drizzle vs /app/migrations/drizzle
echo "  场景: 迁移路径一致性"
# 检查是否引用了错误路径 /app/drizzle（应该是 /app/migrations/drizzle）
if grep -q '/app/drizzle' "$SCRIPT_DIR/run-migrations.sh" && ! grep -q '/app/migrations/drizzle' "$SCRIPT_DIR/run-migrations.sh"; then
  fail "引用了错误路径 /app/drizzle（应为 /app/migrations/drizzle）"
elif grep -q '/app/migrations/drizzle' "$SCRIPT_DIR/run-migrations.sh"; then
  pass "迁移路径正确"
else
  echo -e "  ${YELLOW}⚠${NC} 未找到迁移路径引用"
fi

# Bug 3: 变量未定义（如 REGISTRY）
echo "  场景: 变量定义检查"
# 检查 run-migrations.sh 是否引用了未定义的变量
if grep -q '\${REGISTRY}' "$SCRIPT_DIR/run-migrations.sh" 2>/dev/null; then
  fail "引用了未定义变量 \${REGISTRY}"
else
  pass "无未定义变量引用"
fi

# Bug 4: set -euo pipefail 与未绑定变量
echo "  场景: set -u 安全性"
# 脚本应该显式检查必需变量，而不是依赖默认值
if grep -q 'set -euo pipefail' "$SCRIPT_DIR/run-migrations.sh"; then
  # 检查是否有 : - 默认值语法（可能掩盖未定义变量）
  if grep -q '\${[A-Z_]*:-' "$SCRIPT_DIR/run-migrations.sh"; then
    echo -e "  ${YELLOW}⚠${NC} 使用默认值语法，注意可能掩盖未定义变量"
  else
    pass "无默认值掩盖"
  fi
fi

echo ""

# ========================================
# 测试总结
# ========================================
echo "========================================"
echo "测试总结"
echo "========================================"
echo -e "通过: ${GREEN}$PASS${NC}"
echo -e "失败: ${RED}$FAIL${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}所有测试通过!${NC}"
  exit 0
else
  echo -e "${RED}有测试失败${NC}"
  exit 1
fi
