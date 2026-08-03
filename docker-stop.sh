#!/bin/bash
set -euo pipefail

# ============================================
# Lionet Rides — Docker Stop Script
# 用法: ./docker-stop.sh [--remove]
# ============================================

CONTAINER_NAME="lionetrides-container"
REMOVE=false

# ─── 参数解析 ───
while [ $# -gt 0 ]; do
  case $1 in
    --remove)  REMOVE=true; shift ;;
    --help)
      echo "用法: $0 [--remove]"
      echo "  --remove  删除容器（默认仅停止）"
      exit 0
      ;;
    *)
      echo "未知参数: $1" >&2
      exit 1
      ;;
  esac
done

# ─── 检查容器是否存在 ───
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "容器 ${CONTAINER_NAME} 不存在" >&2
  exit 0
fi

# ─── 停止 ───
echo "停止容器 ${CONTAINER_NAME}..." >&2
docker stop "${CONTAINER_NAME}"

if [ "${REMOVE}" = true ]; then
  echo "删除容器 ${CONTAINER_NAME}..." >&2
  docker rm "${CONTAINER_NAME}"
fi

echo "完成" >&2
