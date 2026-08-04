# ============================================
# Dockerfile — Lionet Rides B2B Website
# Next.js standalone output (数据库独立部署)
# ============================================

# ─── 构建参数 ───
ARG PROJECT_NAME="lionetrides"
ARG PROJECT_VERSION="1.0.0"
ARG BUILD_DATE
ARG GIT_COMMIT

# ============================================
# 阶段 1: 安装依赖
# ============================================
FROM node:24-bookworm-slim AS deps
WORKDIR /app

# 启用 corepack（pnpm 包管理器）
RUN corepack enable

# 层缓存优化：package.json 先于源码
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ============================================
# 阶段 2: 构建应用
# ============================================
FROM node:24-bookworm-slim AS builder
WORKDIR /app

# 启用 corepack
RUN corepack enable

# 解压依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源码并构建
COPY . .
RUN pnpm run build

# ============================================
# 阶段 3: 运行环境 (standalone)
# ============================================
FROM node:24-bookworm-slim AS runner

# 重新声明 ARG（每个阶段独立作用域）
ARG PROJECT_NAME
ARG PROJECT_VERSION
ARG BUILD_DATE
ARG GIT_COMMIT

# OCI 标准标签
LABEL org.opencontainers.image.title="${PROJECT_NAME}"
LABEL org.opencontainers.image.description="Lionet Rides B2B Amusement Equipment Website"
LABEL org.opencontainers.image.version="${PROJECT_VERSION}"
LABEL org.opencontainers.image.authors="Lionet Rides"
LABEL org.opencontainers.image.source="https://github.com/btrobot/lionetrides"
LABEL org.opencontainers.image.vendor="Lionet Rides"
LABEL org.opencontainers.image.licenses="Proprietary"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"

WORKDIR /app

# 安装运行时工具：curl（健康检查）、dumb-init（PID 1 信号转发）
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl dumb-init && \
    rm -rf /var/lib/apt/lists/*

# 环境变量
ENV NODE_ENV=production
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

# ─── 复制 Next.js standalone 产物 ───
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# ─── 数据库迁移工具（独立目录，避免污染 standalone node_modules）───
RUN mkdir -p /app/migrations/drizzle
COPY migrate.js /app/migrations/migrate.js
COPY migrations/seed.js /app/migrations/seed.js
RUN cd /app/migrations && npm init -y > /dev/null 2>&1 && npm install pg

# 复制迁移 SQL 文件
COPY --from=builder /app/drizzle/ /app/migrations/drizzle/

# 复制启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 健康检查（使用轻量 API，30s 间隔，60s 启动期）
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

EXPOSE 5000

# 使用 dumb-init 作为 PID 1（正确处理信号转发和僵尸进程）
ENTRYPOINT ["dumb-init", "--", "docker-entrypoint.sh"]
