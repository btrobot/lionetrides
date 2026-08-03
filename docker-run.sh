#!/bin/bash
# ============================================================
# Docker 运行脚本 — LionetRides
# 用法: ./docker-run.sh [--env-file .env] [--port 5000]
# ============================================================
set -e

# ─── 配置 ───
IMAGE_NAME="lionetrides"
IMAGE_TAG="latest"
CONTAINER_NAME="lionetrides-container"
DEFAULT_PORT=5000
NETWORK_NAME="auto-ingress_gateway-net"

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
ENV_FILE=""
PORT="$DEFAULT_PORT"
DETACH=true
SKIP_SMOKE=false
for arg in "$@"; do
  case $arg in
    --env-file=*) ENV_FILE="${arg#*=}" ;;
    --env-file)   ENV_FILE="$2"; shift ;;
    --port=*)     PORT="${arg#*=}" ;;
    --port)       PORT="$2"; shift ;;
    --foreground) DETACH=false ;;
    --skip-smoke) SKIP_SMOKE=true ;;
    -h|--help)
      echo "用法: ./docker-run.sh [选项]"
      echo ""
      echo "选项:"
      echo "  --env-file=FILE  指定环境变量文件（默认: .env）"
      echo "  --port=PORT      指定端口（默认: 5000）"
      echo "  --foreground     前台运行（不使用 -d）"
      echo "  --skip-smoke     跳过部署后 Smoke 测试"
      echo "  -h, --help       显示帮助"
      exit 0
      ;;
    *)              echo "未知参数: $arg"; exit 1 ;;
  esac
done

cd "$(dirname "$0")"

echo ""
echo "=========================================="
echo "  Docker 运行 — LionetRides"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# ============================================================
# 预检
# ============================================================
log "预检..."

# 检查镜像是否存在
if ! sudo docker images "${IMAGE_NAME}:${IMAGE_TAG}" --format '{{.Repository}}' | grep -q "${IMAGE_NAME}"; then
  fail "镜像 ${IMAGE_NAME}:${IMAGE_TAG} 不存在，请先运行 ./docker-build.sh"
fi
ok "镜像存在"

# 检查环境变量文件
if [ -z "$ENV_FILE" ]; then
  if [ -f ".env.local" ]; then
    ENV_FILE=".env.local"
  elif [ -f ".env" ]; then
    ENV_FILE=".env"
  fi
fi

if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
  ok "使用环境变量文件: $ENV_FILE"
  ENV_ARGS="--env-file $ENV_FILE"
else
  warn "未找到环境变量文件，请确保通过 -e 传入必要的环境变量"
  ENV_ARGS=""
fi

# 检查网络是否存在
if ! sudo docker network ls --format '{{.Name}}' | grep -q "^${NETWORK_NAME}$"; then
  warn "网络 $NETWORK_NAME 不存在，将使用默认网络"
  NETWORK_ARGS=""
else
  ok "使用网络: $NETWORK_NAME"
  NETWORK_ARGS="--network $NETWORK_NAME"
fi

echo ""

# ============================================================
# 停止旧容器
# ============================================================
log "检查旧容器..."

if sudo docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  sudo docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
  ok "旧容器已停止并移除"
fi

echo ""

# ============================================================
# 启动容器
# ============================================================
log "启动容器..."

DOCKER_RUN_ARGS=""
if [ "$DETACH" = true ]; then
  DOCKER_RUN_ARGS="-d"
fi

# 运行容器
sudo docker run $DOCKER_RUN_ARGS \
  --name "$CONTAINER_NAME" \
  -p "${PORT}:5000" \
  --restart unless-stopped \
  $NETWORK_ARGS \
  $ENV_ARGS \
  "${IMAGE_NAME}:${IMAGE_TAG}"

if [ "$DETACH" = true ]; then
  echo ""
  ok "容器已启动"
  echo ""
  echo "  容器名: $CONTAINER_NAME"
  echo "  端口:   $PORT"
  echo ""
  echo "  查看日志: sudo docker logs -f $CONTAINER_NAME"
  echo "  访问应用: http://localhost:$PORT"
  echo "  停止容器: ./docker-stop.sh"
  echo ""

  # ─── Smoke 测试 ───
  if [ "$SKIP_SMOKE" = false ]; then
    echo ""
    echo "=========================================="
    echo "  Smoke 测试"
    echo "=========================================="
    echo ""
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    bash "$SCRIPT_DIR/docker-smoke-test.sh" --url="http://localhost:$PORT"
    SMOKE_EXIT=$?
    echo ""
    if [ $SMOKE_EXIT -eq 0 ]; then
      ok "Smoke 测试全部通过！"
    else
      warn "Smoke 测试未完全通过，但容器已启动。请查看日志排查。"
      warn "   sudo docker logs $CONTAINER_NAME --tail 50"
    fi
  fi
else
  echo ""
  ok "容器在前台运行中..."
  echo "  按 Ctrl+C 停止"
  echo ""
fi
