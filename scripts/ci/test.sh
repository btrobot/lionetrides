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
