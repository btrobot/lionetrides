#!/bin/bash
# 数据库迁移脚本
# 检查并执行数据库迁移
#
# 环境变量：
#   CONTAINER_NAME - 容器名称（默认：lionetrides-container）
#
# 用法：
#   CONTAINER_NAME=lionetrides-container ./scripts/ci/run-migrations.sh

set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-lionetrides-container}"

echo "检查数据库迁移..."

# 检查容器内是否有迁移文件
if docker exec "${CONTAINER_NAME}" sh -c '[ -d /app/migrations/drizzle ] && ls /app/migrations/drizzle/*.sql >/dev/null 2>&1'; then
  echo "发现迁移文件，执行迁移..."
  if docker exec "${CONTAINER_NAME}" node /app/migrations/migrate.js 2>&1; then
    echo "数据库迁移完成"
    exit 0
  else
    echo "数据库迁移失败"
    exit 1
  fi
else
  echo "无迁移文件，跳过"
  exit 0
fi
