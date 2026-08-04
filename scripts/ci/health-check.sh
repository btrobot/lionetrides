#!/bin/bash
# 健康检查脚本
# 等待服务就绪，超时则失败
#
# 环境变量：
#   APP_PORT  - 应用端口（默认：5000）
#   TIMEOUT   - 超时秒数（默认：120）
#   INTERVAL  - 检查间隔秒数（默认：5）
#
# 用法：
#   APP_PORT=5000 TIMEOUT=120 ./scripts/ci/health-check.sh

set -euo pipefail

APP_PORT="${APP_PORT:-5000}"
TIMEOUT="${TIMEOUT:-120}"
INTERVAL="${INTERVAL:-5}"

MAX_ATTEMPTS=$((TIMEOUT / INTERVAL))

echo "等待服务就绪（超时：${TIMEOUT}s）..."

for i in $(seq 1 "$MAX_ATTEMPTS"); do
  if curl -sf "http://localhost:${APP_PORT}/api/health" > /dev/null 2>&1; then
    echo "健康检查通过 (${i}/${MAX_ATTEMPTS})"
    exit 0
  fi
  
  if [ "$i" -eq "$MAX_ATTEMPTS" ]; then
    echo "健康检查失败（超时 ${TIMEOUT}s）"
    exit 1
  fi
  
  echo "等待... (${i}/${MAX_ATTEMPTS})"
  sleep "$INTERVAL"
done
