# ============================================================
# Lion E-Trides — Next.js 16 + PostgreSQL 多阶段构建
# 优化目标：最小化最终镜像体积，分离构建环境与运行环境
# ============================================================

# ─── Stage 1: 依赖安装 ────────────────────────────────────
FROM node:24-bookworm-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prefer-offline

# ─── Stage 2: 构建 ────────────────────────────────────────
FROM node:24-bookworm-slim AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm next build
RUN pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify
RUN rm -rf .next/cache node_modules/.cache

# ─── Stage 3: 运行时 ──────────────────────────────────────
FROM node:24-bookworm-slim AS runner

# 国内镜像源加速
RUN sed -i 's|deb.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|security.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list.d/debian.sources

# 安装 PostgreSQL + 运行时工具
# 不使用 --no-install-recommends 确保 tini 等工具完整安装
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends \
      postgresql postgresql-client \
      curl tini && \
    rm -rf /var/lib/apt/lists/*

# 初始化 PostgreSQL 数据库（预创建用户和数据库）
RUN su - postgres -c "pg_ctlcluster 15 main start" && \
    sleep 1 && \
    su - postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres';\"" && \
    su - postgres -c "createdb lionetrides" && \
    su - postgres -c "pg_ctlcluster 15 main stop"

# 启用 pnpm（运行时需要 pnpm exec 执行迁移和种子脚本）
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# ─── 从构建阶段复制产物（仅运行时需要的内容） ────────────
COPY --from=builder /app/.next          ./.next
COPY --from=builder /app/dist           ./dist
COPY --from=builder /app/public         ./public
COPY --from=builder /app/package.json   ./package.json
COPY --from=builder /app/node_modules   ./node_modules
COPY --from=builder /app/scripts        ./scripts
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# 环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lionetrides

# 权限设置
RUN chmod -R 777 .next && \
    chmod +x docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["tini", "--"]
CMD ["./docker-entrypoint.sh"]