#!/bin/bash
# 执行数据库种子数据（首次部署时自动运行）
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-lionetrides-container}"
ENV_FILE="${ENV_FILE:-/data/lionetrides/.env.local}"

echo "=== 检查是否需要种子数据 ==="

# 检查容器是否存在
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "❌ 容器 ${CONTAINER_NAME} 不存在"
  exit 1
fi

# 检查是否已有数据（categories 表有数据则跳过）
CATEGORIES_COUNT=$(docker exec "${CONTAINER_NAME}" sh -c "
  node -e \"
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE
    });
    pool.query('SELECT COUNT(*) FROM categories')
      .then(r => { console.log(r.rows[0].count); pool.end(); })
      .catch(e => { console.error(e.message); pool.end(); process.exit(1); });
  \"
" 2>/dev/null || echo "0")

if [ "${CATEGORIES_COUNT}" != "0" ]; then
  echo "⊘ 已有数据（categories: ${CATEGORIES_COUNT} 条），跳过种子"
  exit 0
fi

echo "▶ 执行种子数据..."

# 复制 seed 脚本到容器
docker cp /data/lionetrides/scripts/seed-data.ts "${CONTAINER_NAME}:/tmp/seed-data.ts" 2>/dev/null || {
  # 如果本地没有 seed 脚本，尝试从镜像中获取
  echo "⚠ 本地无 seed-data.ts，跳过种子"
  exit 0
}

# 执行 seed
docker exec "${CONTAINER_NAME}" sh -c "
  cd /tmp && \
  npm install -g tsx 2>/dev/null || true && \
  tsx seed-data.ts
" 2>&1 || {
  echo "⚠ 种子执行失败（非致命，可稍后手动执行）"
  exit 0
}

echo "✓ 种子数据执行完成"
