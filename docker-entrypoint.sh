#!/bin/bash
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/lionetrides}"
export DATABASE_URL

echo "🚀 Starting PostgreSQL..."
su - postgres -c "pg_ctlcluster 15 main start"

# 等待 PostgreSQL 就绪
POSTGRES_READY=false
for i in $(seq 1 30); do
  if su - postgres -c "pg_isready -p 5433" > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready on port 5433"
    POSTGRES_READY=true
    break
  fi
  echo "Waiting for PostgreSQL... ($i/30)"
  sleep 1
done

if [ "$POSTGRES_READY" != true ]; then
  echo "❌ PostgreSQL did not become ready on port 5433" >&2
  exit 1
fi

# 初始化数据库
echo "📦 Pushing schema..."
pnpm exec drizzle-kit push --force
if [ "$(psql "$DATABASE_URL" -tAc "SELECT to_regclass('public.users') IS NOT NULL AND to_regclass('public.products') IS NOT NULL")" != "t" ]; then
  echo "❌ Schema verification failed: required tables are missing" >&2
  exit 1
fi
echo "✅ Schema verified"

echo "🌱 Seeding data..."
pnpm exec tsx scripts/seed-data.ts

echo "👤 Creating admin..."
pnpm exec tsx scripts/seed-admin.ts

echo "🌐 Starting application..."
exec node dist/server.js
