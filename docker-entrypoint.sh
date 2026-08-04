#!/bin/bash
set -euo pipefail

# ============================================
# Lionet Rides — Docker Entrypoint
# 启动 Node.js 应用（数据库独立部署）
# ============================================

# ─── 检查数据库环境变量 ───
if [ -z "${PGHOST:-}" ]; then
  echo "ERROR: PGHOST environment variable is required" >&2
  echo "Example: PGHOST=db.example.com PGPORT=5432 PGUSER=ridex PGPASSWORD=secret PGDATABASE=ridex_db" >&2
  exit 1
fi

echo "Database: ${PGUSER:-ridex}@${PGHOST}:${PGPORT:-5432}/${PGDATABASE:-ridex_db}"

# ─── 启动应用（非 root 用户） ───
echo "Starting application on port ${PORT:-5000}..."
exec su -s /bin/bash node -c "exec node dist/server.js"
