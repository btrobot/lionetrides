#!/bin/bash
# ============================================================
# Docker 数据库初始化脚本 — Lion E-Trides
# 用法: ./docker-seed.sh
# ============================================================
set -e

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

echo ""
echo "=========================================="
echo "  数据库初始化 — Lion E-Trides"
echo "=========================================="
echo ""

# 检查容器是否运行
if ! sudo docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  fail "容器 $CONTAINER_NAME 未运行，请先执行 ./docker-run.sh"
fi

# 推送 schema
log "推送数据库 schema..."
sudo docker exec "$CONTAINER_NAME" npx drizzle-kit push --force 2>&1 || warn "Schema 推送可能有警告"

# 运行 seed
log "运行数据种子..."
sudo docker exec "$CONTAINER_NAME" npx tsx scripts/seed-data.ts 2>&1

# 运行 admin seed
log "创建管理员账户..."
sudo docker exec "$CONTAINER_NAME" npx tsx scripts/seed-admin.ts 2>&1

echo ""
ok "数据库初始化完成！"
echo ""
