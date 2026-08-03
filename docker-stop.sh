#!/bin/bash
# ============================================================
# Docker 停止脚本 — LionetRides
# 用法: ./docker-stop.sh [--remove]
# ============================================================
set -e

# ─── 配置 ───
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
REMOVE=false
for arg in "$@"; do
  case $arg in
    --remove) REMOVE=true ;;
    -h|--help)
      echo "用法: ./docker-stop.sh [选项]"
      echo ""
      echo "选项:"
      echo "  --remove   停止并移除容器"
      echo "  -h, --help 显示帮助"
      exit 0
      ;;
    *)          echo "未知参数: $arg"; exit 1 ;;
  esac
done

echo ""
echo "=========================================="
echo "  Docker 停止 — LionetRides"
echo "=========================================="
echo ""

# 检查容器是否存在
if ! sudo docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  warn "容器 $CONTAINER_NAME 不存在"
  exit 0
fi

# 停止容器
log "停止容器 $CONTAINER_NAME..."
sudo docker stop "$CONTAINER_NAME"
ok "容器已停止"

# 移除容器（如果指定）
if [ "$REMOVE" = true ]; then
  sudo docker rm "$CONTAINER_NAME"
  ok "容器已移除"
fi

echo ""
echo "  查看日志: sudo docker logs $CONTAINER_NAME"
echo "  启动容器: ./docker-run.sh"
echo ""
