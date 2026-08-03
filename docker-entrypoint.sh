#!/bin/bash
set -euo pipefail

# ============================================
# 自动生成的启动脚本
# 生成时间: 2026-08-03T09:45:59.518Z
# ============================================

# 启动 PostgreSQL
echo "Starting PostgreSQL..."
PG_VER=$(ls /etc/postgresql/ | head -1)
su - postgres -c "pg_ctlcluster ${PG_VER} main start"

# 等待 PostgreSQL 就绪
echo "Waiting for PostgreSQL..."
for i in {1..30}; do
  if su - postgres -c "pg_isready -p ${PGPORT:-5433}" >/dev/null 2>&1; then
    echo "PostgreSQL is ready"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 1
done

# 初始化数据库
echo "Initializing database..."
su - postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres';\"" 2>/dev/null || true
su - postgres -c "createdb lionetrides" 2>/dev/null || echo "Database already exists"

# 启动应用（非 root 用户）
echo "Starting application..."
exec su -s /bin/bash node -c "exec node dist/server.js"
