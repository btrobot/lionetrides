#!/bin/bash
# 回滚脚本
# 停止当前容器，恢复旧镜像
#
# 环境变量：
#   CONTAINER_NAME - 容器名称（默认：lionetrides-container）
#   OLD_IMAGE      - 旧镜像 SHA 或名称（必填）
#   APP_PORT       - 应用端口（默认：5000）
#   ENV_FILE       - 环境变量文件（默认：/data/lionetrides/.env.local）
#   NETWORK        - Docker 网络（默认：auto-ingress_gateway-net）
#
# 用法：
#   CONTAINER_NAME=lionetrides-container OLD_IMAGE=sha256:xxx ./scripts/ci/rollback.sh

set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-lionetrides-container}"
APP_PORT="${APP_PORT:-5000}"
ENV_FILE="${ENV_FILE:-/data/lionetrides/.env.local}"
NETWORK="${NETWORK:-auto-ingress_gateway-net}"

if [ -z "${OLD_IMAGE:-}" ]; then
  echo "错误：OLD_IMAGE 未设置，无法回滚"
  exit 1
fi

echo "回滚到旧镜像：${OLD_IMAGE}"

# 停止并删除当前容器
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "停止容器 ${CONTAINER_NAME}..."
  docker stop "${CONTAINER_NAME}" 2>/dev/null || true
  docker rm "${CONTAINER_NAME}" 2>/dev/null || true
fi

# 启动旧容器
echo "启动旧容器..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  --network "${NETWORK}" \
  --restart unless-stopped \
  -p "${APP_PORT}:5000" \
  --env-file "${ENV_FILE}" \
  "${OLD_IMAGE}"

echo "回滚完成"
