# ============================================================
# LionetRides — Next.js 16 + PostgreSQL 多阶段构建
# 优化目标：最小化最终镜像体积，分离构建环境与运行环境
# 遵循 GitHub CI/CD 最佳实践：
#   - 多阶段构建
#   - 非 root 运行（应用进程）
#   - HEALTHCHECK 健康检查
#   - LABEL 元数据标注
#   - 镜像源自动适配国内/国际环境
#   - 最小化 Attack Surface
# ============================================================
# 构建参数
#   DEPLOY_REGION=auto   自动检测（默认）
#   DEPLOY_REGION=cn     强制国内镜像
#   DEPLOY_REGION=global 强制官方源
# 用法:
#   国内 (Mode A): docker build -t lionetrides .
#   国外 (Mode B): docker build --build-arg DEPLOY_REGION=global -t lionetrides .
# ============================================================
ARG DEPLOY_REGION=auto

# ─── Stage 1: 依赖安装 ────────────────────────────────────
FROM node:24-bookworm-slim AS deps

ARG DEPLOY_REGION

# 镜像源自动检测脚本（配置 npm registry + apt sources，持久化写入）
COPY scripts/detect-mirror.sh /tmp/detect-mirror.sh
# 运行检测脚本：cn/global 强制指定，auto 自动检测
RUN if [ "${DEPLOY_REGION}" = "cn" ] || [ "${DEPLOY_REGION}" = "global" ]; then \
      bash /tmp/detect-mirror.sh --force-${DEPLOY_REGION}; \
    else \
      bash /tmp/detect-mirror.sh; \
    fi

# corepack 镜像源（根据 DEPLOY_REGION 自动选择）
# auto: 检测网络环境，国内用腾讯云，国外用官方
# cn: 强制腾讯云镜像
# global: 使用官方 registry（GitHub Actions 构建时推荐）
RUN if [ "${DEPLOY_REGION}" = "global" ]; then \
      echo "Using official npm registry for corepack"; \
    elif [ "${DEPLOY_REGION}" = "cn" ] || { [ "${DEPLOY_REGION}" = "auto" ] && curl -s --max-time 3 https://mirrors.cloud.tencent.com/npm/-/ping > /dev/null 2>&1; }; then \
      echo "Using Tencent mirror for corepack"; \
      export COREPACK_REGISTRY=https://mirrors.cloud.tencent.com/npm; \
    fi && \
    corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prefer-offline

# ─── Stage 2: 构建 ────────────────────────────────────────
FROM node:24-bookworm-slim AS builder

ARG DEPLOY_REGION

COPY scripts/detect-mirror.sh /tmp/detect-mirror.sh
RUN bash /tmp/detect-mirror.sh ${DEPLOY_REGION:+--force-${DEPLOY_REGION}}

# corepack 镜像源（根据 DEPLOY_REGION 自动选择）
RUN if [ "${DEPLOY_REGION}" = "global" ]; then \
      echo "Using official npm registry for corepack"; \
    elif [ "${DEPLOY_REGION}" = "cn" ] || { [ "${DEPLOY_REGION}" = "auto" ] && curl -s --max-time 3 https://mirrors.cloud.tencent.com/npm/-/ping > /dev/null 2>&1; }; then \
      echo "Using Tencent mirror for corepack"; \
      export COREPACK_REGISTRY=https://mirrors.cloud.tencent.com/npm; \
    fi && \
    corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build
RUN npx tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

# 保留完整 node_modules（种子脚本需要 tsx/drizzle-kit），仅清理缓存
RUN rm -rf .next/cache node_modules/.cache && \
    tar cf /tmp/node_modules.tar node_modules --dereference

# ─── Stage 3: 运行时 ──────────────────────────────────────
FROM node:24-bookworm-slim AS runner

ARG DEPLOY_REGION
ARG BUILD_DATE
ARG BUILD_VERSION
ARG GIT_COMMIT

# ─── LABEL 元数据（OCI 标准） ───────────────────────────────
LABEL org.opencontainers.image.title="LionetRides"
LABEL org.opencontainers.image.description="B2B 游乐设施制造企业官网"
LABEL org.opencontainers.image.url="https://lionetrides.com"
LABEL org.opencontainers.image.source="https://github.com/lionetrides/lionetrides"
LABEL org.opencontainers.image.version="${BUILD_VERSION:-latest}"
LABEL org.opencontainers.image.revision="${GIT_COMMIT:-unknown}"
LABEL org.opencontainers.image.created="${BUILD_DATE:-unknown}"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="LionetRides"
LABEL maintainer="dev@lionetrides.com"

# ─── 镜像源自动检测 ──────────────────────────────────────
COPY scripts/detect-mirror.sh /tmp/detect-mirror.sh
RUN bash /tmp/detect-mirror.sh ${DEPLOY_REGION:+--force-${DEPLOY_REGION}}

# ─── 安装运行时依赖 ──────────────────────────────────────
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends \
      postgresql postgresql-client \
      curl tini ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 自动检测 PostgreSQL 主版本并初始化（配置为端口 5433）
RUN PG_VER=$(pg_lsclusters -h 2>/dev/null | head -1 | awk '{print $1}') && \
    if [ -z "$PG_VER" ]; then \
      PG_VER=$(dpkg -l | grep 'postgresql-[0-9]' | head -1 | sed 's/.*postgresql-\([0-9]*\)[^0-9]*.*/\1/'); \
    fi && \
    if [ -z "$PG_VER" ]; then PG_VER=15; fi && \
    echo "Detected PostgreSQL version: $PG_VER" && \
    # 修改 PostgreSQL 配置为端口 5433
    PG_CONF="/etc/postgresql/${PG_VER}/main/postgresql.conf" && \
    if [ -f "$PG_CONF" ]; then \
      sed -i "s/^#port = 5432/port = 5433/" "$PG_CONF" && \
      sed -i "s/^port = 5432/port = 5433/" "$PG_CONF"; \
    fi && \
    su - postgres -c "pg_ctlcluster ${PG_VER} main start" && \
    sleep 1 && \
    su - postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres';\"" && \
    su - postgres -c "createdb lionetrides" && \
    su - postgres -c "pg_ctlcluster ${PG_VER} main stop"

# 启用 pnpm（运行时需要 pnpm exec 执行迁移和种子脚本）
# corepack 镜像源（根据 DEPLOY_REGION 自动选择）
RUN if [ "${DEPLOY_REGION}" = "global" ]; then \
      echo "Using official npm registry for corepack"; \
    elif [ "${DEPLOY_REGION}" = "cn" ] || { [ "${DEPLOY_REGION}" = "auto" ] && curl -s --max-time 3 https://mirrors.cloud.tencent.com/npm/-/ping > /dev/null 2>&1; }; then \
      echo "Using Tencent mirror for corepack"; \
      export COREPACK_REGISTRY=https://mirrors.cloud.tencent.com/npm; \
    fi && \
    corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# ─── 从构建阶段复制产物 ──────────────────────────────────
# 使用 --chown=node:node 确保文件归属非 root 用户
COPY --chown=node:node --from=builder /app/.next          ./.next
COPY --chown=node:node --from=builder /app/dist           ./dist
COPY --chown=node:node --from=builder /app/public         ./public
COPY --chown=node:node --from=builder /app/package.json   ./package.json
COPY --chown=node:node --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
# 复制 node_modules（tar 归档方式，避免 COPY 数万小文件超时）
COPY --from=builder /tmp/node_modules.tar /tmp/node_modules.tar
RUN tar xf /tmp/node_modules.tar -C /app --no-same-owner && rm /tmp/node_modules.tar
COPY --chown=node:node --from=builder /app/scripts        ./scripts
COPY --chown=node:node --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --chown=node:node --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --chown=node:node --from=builder /app/tsconfig.json  ./tsconfig.json
COPY --chown=node:node --from=builder /app/src/db        ./src/db

# ─── 权限设置（最小权限原则）─────────────────────────────
RUN chmod 755 docker-entrypoint.sh && \
    chmod -R 755 .next/static && \
    chown -R node:node /app && \
    if [ -f .next/build-manifest.json ]; then chmod 644 .next/build-manifest.json; fi && \
    if [ -f .next/server/app/index.html ]; then chmod 644 .next/server/app/index.html; fi

# 注意：容器以 root 运行（entrypoint 需要 root 启动 PostgreSQL）
# entrypoint 内部会切换到 node 用户运行 Next.js 应用

# ─── 环境变量 ────────────────────────────────────────────
# 注意：以下密码仅为默认值，生产环境必须通过 --env-file 或 -e 覆盖
# 例如：docker run --env-file /data/lionetrides/.env.production ...
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV COZE_PROJECT_ENV=PROD
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"
# 数据库连接（生产环境通过 .env.production 覆盖）
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lionetrides
ENV PGHOST=localhost
ENV PGPORT=5433
ENV PGUSER=postgres
ENV PGPASSWORD=postgres
ENV PGDATABASE=lionetrides

EXPOSE 5000

# ─── HEALTHCHECK 健康检查 ────────────────────────────────
# 容器启动后，每 30 秒检查一次 /api/v1/products 接口
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -sf --max-time 5 http://localhost:5000/api/v1/products?limit=1 > /dev/null || exit 1

# ─── 入口点 ──────────────────────────────────────────────
# tini 确保信号正确处理（SIGTERM → 优雅关闭）
ENTRYPOINT ["tini", "--"]
CMD ["./docker-entrypoint.sh"]