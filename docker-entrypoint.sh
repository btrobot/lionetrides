#!/bin/bash
set -euo pipefail

# ============================================
# Lionet Rides — Docker Entrypoint
# 启动 Next.js standalone 应用（数据库独立部署）
# ============================================

# ─── 检查数据库环境变量 ───
if [ -z "${PGHOST:-}" ]; then
  echo "WARNING: PGHOST not set. Database features may not work." >&2
  echo "Expected: PGHOST=db.example.com PGPORT=5432 PGUSER=ridex PGPASSWORD=*** PGDATABASE=ridex_db" >&2
fi

if [ -n "${PGHOST:-}" ]; then
  echo "Database: ${PGUSER:-ridex}@${PGHOST}:${PGPORT:-5432}/${PGDATABASE:-ridex_db}"
fi

# ─── 数据库迁移 & Seed ───
if [ -n "${PGHOST:-}" ] && [ -f /app/migrations/migrate.js ]; then
  echo "Running database migrations..."
  node /app/migrations/migrate.js || echo "WARNING: Migration failed (tables may already exist)"

  if [ -f /app/migrations/seed.js ]; then
    echo "Running database seed..."
    node /app/migrations/seed.js || echo "WARNING: Seed failed (data may already exist)"
  fi
fi

# ─── 启动 Next.js standalone 服务器 ───
echo "Starting Next.js standalone server on port ${PORT:-5000}..."
exec node server.js
