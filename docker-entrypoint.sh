#!/bin/bash
set -euo pipefail

# ============================================
# Lionet Rides — Docker Entrypoint
# 启动 PostgreSQL → 初始化 → 非 root 运行应用
# ============================================

# ─── 启动 PostgreSQL ───
echo "Starting PostgreSQL..."
PG_VER=$(ls /etc/postgresql/ | head -1)
su - postgres -c "pg_ctlcluster ${PG_VER} main start"

# ─── 等待 PostgreSQL 就绪 ───
echo "Waiting for PostgreSQL (port ${PGPORT:-5433})..."
for i in $(seq 1 30); do
  if su - postgres -c "pg_isready -p ${PGPORT:-5433}" >/dev/null 2>&1; then
    echo "PostgreSQL is ready"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 1
done

# ─── 初始化数据库（幂等） ───
echo "Initializing database..."
su - postgres -c "createdb lionetrides" 2>/dev/null || echo "Database already exists"

# ─── 启动应用（非 root 用户） ───
echo "Starting application on port ${PORT:-5000}..."
exec su -s /bin/bash node -c "exec node dist/server.js"
