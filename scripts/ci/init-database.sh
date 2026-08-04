#!/bin/bash
# 数据库初始化脚本
# 检查并创建数据库用户和数据库（如不存在）
#
# 环境变量：
#   ENV_FILE - .env.local 文件路径（默认：/data/lionetrides/.env.local）
#
# 用法：
#   ENV_FILE=/data/lionetrides/.env.local ./scripts/ci/init-database.sh

set -euo pipefail

ENV_FILE="${ENV_FILE:-/data/lionetrides/.env.local}"

if [ ! -f "$ENV_FILE" ]; then
  echo "错误：环境变量文件不存在：$ENV_FILE"
  exit 1
fi

# 从 .env.local 读取数据库配置
PGUSER=$(grep '^PGUSER=' "$ENV_FILE" | cut -d= -f2)
PGPASSWORD=$(grep '^PGPASSWORD=' "$ENV_FILE" | cut -d= -f2)
PGDATABASE=$(grep '^PGDATABASE=' "$ENV_FILE" | cut -d= -f2)

if [ -z "$PGUSER" ] || [ -z "$PGDATABASE" ]; then
  echo "错误：.env.local 中缺少 PGUSER 或 PGDATABASE"
  exit 1
fi

echo "检查数据库配置..."
echo "  用户：${PGUSER}"
echo "  数据库：${PGDATABASE}"

# 创建用户（如不存在）
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${PGUSER}'" | grep -q 1; then
  echo "创建数据库用户 ${PGUSER}..."
  sudo -u postgres psql -c "CREATE USER ${PGUSER} WITH PASSWORD '${PGPASSWORD}';"
else
  echo "数据库用户 ${PGUSER} 已存在"
fi

# 创建数据库（如不存在）
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${PGDATABASE}'" | grep -q 1; then
  echo "创建数据库 ${PGDATABASE}..."
  sudo -u postgres psql -c "CREATE DATABASE ${PGDATABASE} OWNER ${PGUSER};"
else
  echo "数据库 ${PGDATABASE} 已存在"
fi

echo "数据库初始化完成"
