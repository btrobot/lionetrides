# ============================================================
# Lion E-Trides — Next.js 16 + PostgreSQL 多阶段构建
# 优化目标：最小化最终镜像体积，分离构建环境与运行环境
# ============================================================

# ─── Stage 1: 依赖安装 ────────────────────────────────────
FROM node:24-bookworm-slim AS deps

# 国内镜像源加速（npm/pnpm registry + Debian apt）
ENV COREPACK_REGISTRY=https://mirrors.cloud.tencent.com/npm
RUN npm config set registry https://mirrors.cloud.tencent.com/npm && \
    corepack enable && corepack prepare pnpm@9.15.0 --activate

RUN sed -i 's|deb.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|security.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list.d/debian.sources

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prefer-offline

# ─── Stage 2: 构建 ────────────────────────────────────────
FROM node:24-bookworm-slim AS builder

# 国内镜像源加速（构建阶段也需要）
ENV COREPACK_REGISTRY=https://mirrors.cloud.tencent.com/npm
RUN npm config set registry https://mirrors.cloud.tencent.com/npm && \
    corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm next build
RUN pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify
# 保留完整 node_modules（种子脚本需要 tsx/drizzle-kit），仅清理缓存
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

# 自动检测 PostgreSQL 主版本并初始化
RUN PG_VER=$(pg_lsclusters -h 2>/dev/null | head -1 | awk '{print $1}') && \
    if [ -z "$PG_VER" ]; then \
      PG_VER=$(dpkg -l | grep 'postgresql-[0-9]' | head -1 | sed 's/.*postgresql-\([0-9]*\)[^0-9]*.*/\1/'); \
    fi && \
    if [ -z "$PG_VER" ]; then PG_VER=15; fi && \
    echo "Detected PostgreSQL version: $PG_VER" && \
    su - postgres -c "pg_ctlcluster ${PG_VER} main start" && \
    sleep 1 && \
    su - postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres';\"" && \
    su - postgres -c "createdb lionetrides" && \
    su - postgres -c "pg_ctlcluster ${PG_VER} main stop"

# 启用 pnpm（运行时需要 pnpm exec 执行迁移和种子脚本）
ENV COREPACK_REGISTRY=https://mirrors.cloud.tencent.com/npm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# ─── 从构建阶段复制产物（仅运行时需要的内容） ────────────
COPY --from=builder /app/.next          ./.next
COPY --from=builder /app/dist           ./dist
COPY --from=builder /app/public         ./public
COPY --from=builder /app/package.json   ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
# 复制 node_modules（含 devDependencies，种子脚本需要 tsx/drizzle-kit）
COPY --from=builder /app/node_modules   ./node_modules
COPY --from=builder /app/scripts        ./scripts
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/tsconfig.json  ./tsconfig.json

# 环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV COZE_PROJECT_ENV=PROD
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lionetrides

# 权限设置
RUN chmod -R 777 .next && \
    chmod +x docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["tini", "--"]
CMD ["./docker-entrypoint.sh"]