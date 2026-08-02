#!/bin/bash

echo "🚀 Starting PostgreSQL..."
su - postgres -c "pg_ctlcluster 15 main start"

# 等待 PostgreSQL 就绪
for i in $(seq 1 30); do
  if su - postgres -c "pg_isready -p 5433" > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready on port 5433"
    break
  fi
  echo "Waiting for PostgreSQL... ($i/30)"
  sleep 1
done

# 初始化数据库
echo "📦 Pushing schema..."
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lionetrides npx drizzle-kit push --force 2>/dev/null || true

echo "🌱 Seeding data..."
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lionetrides npx tsx scripts/seed-data.ts 2>/dev/null || true

echo "👤 Creating admin..."
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lionetrides npx tsx scripts/seed-admin.ts 2>/dev/null || true

echo "🌐 Starting application..."
exec node dist/server.js
