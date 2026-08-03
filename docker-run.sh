#!/bin/bash
set -euo pipefail

# ============================================
# Lionet Rides — Docker Run Script
# 用法: ./docker-run.sh [--port 5000] [--env-file .env]
# ============================================

# ─── 默认值 ───
APP_PORT=5000
PG_PORT=5433
CONTAINER_NAME="lionetrides-container"
IMAGE_NAME="lionetrides:latest"
ENV_FILE=""

# ─── 参数解析（while 循环） ──
while [ $# -gt 0 ]; do
  case $1 in
    --port=*)     APP_PORT="${1#*=}"; shift ;;
    --port)       APP_PORT="$2"; shift 2 ;;
    --env-file=*) ENV_FILE="${1#*=}"; shift ;;
    --env-file)   ENV_FILE="$2"; shift 2 ;;
    --help)
      echo "用法: $0 [--port 5000] [--env-file .env]"
      exit 0
      ;;
    *)
      echo "未知参数: $1" >&2
      exit 1
      ;;
  esac
done

# ─── 预检 ───
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 镜像存在性
if ! docker image inspect "${IMAGE_NAME}" >/dev/null 2>&1; then
  echo "错误: 镜像 ${IMAGE_NAME} 不存在，请先运行 ./docker-build.sh" >&2
  exit 1
fi

# 环境变量文件查找
if [ -n "${ENV_FILE}" ]; then
  if [ ! -f "${ENV_FILE}" ]; then
    echo "错误: 环境变量文件 ${ENV_FILE} 不存在" >&2
    exit 1
  fi
elif [ -f .env.local ]; then
  ENV_FILE=".env.local"
elif [ -f .env ]; then
  ENV_FILE=".env"
fi

# ─── 停止旧容器（如存在） ───
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "停止旧容器..." >&2
  docker stop "${CONTAINER_NAME}" >/dev/null 2>&1
  docker rm "${CONTAINER_NAME}" >/dev/null 2>&1
fi

# ── 启动 ───
echo "========================================" >&2
echo "Lionet Rides — Docker Run" >&2
echo "========================================" >&2
echo "Image:     ${IMAGE_NAME}" >&2
echo "Container: ${CONTAINER_NAME}" >&2
echo "App Port:  ${APP_PORT}" >&2
echo "PG Port:   ${PG_PORT}" >&2
echo "Env File:  ${ENV_FILE:-none}" >&2
echo "========================================" >&2

RUN_ARGS=(
  -d
  --name "${CONTAINER_NAME}"
  --restart unless-stopped
  -p "${APP_PORT}:5000"
  -p "127.0.0.1:${PG_PORT}:${PG_PORT}"
  -e "PORT=5000"
  -e "PGPORT=${PG_PORT}"
)

if [ -n "${ENV_FILE}" ]; then
  RUN_ARGS+=(--env-file "${ENV_FILE}")
fi

RUN_ARGS+=("${IMAGE_NAME}")

docker run "${RUN_ARGS[@]}"

echo "容器已启动: ${CONTAINER_NAME}" >&2
echo "访问地址: http://localhost:${APP_PORT}" >&2
