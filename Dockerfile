# ============================================
# 自动生成的 Dockerfile
# 生成时间: 2026-08-03T09:45:59.515Z
# 配置来源: deploy.yaml
# ============================================
# 请勿手动修改，修改 deploy.yaml 后重新生成

# 构建参数
ARG DEPLOY_REGION=auto
ARG BUILD_DATE=2026-08-03T09:45:59.517Z

# ============================================
# 阶段 1: 安装依赖
# ============================================
FROM node:24-bookworm-slim AS deps
WORKDIR /app

# 镜像源自动检测
COPY scripts/detect-mirror.sh /tmp/
RUN if [ "${DEPLOY_REGION}" = "cn" ] || [ "${DEPLOY_REGION}" = "global" ]; then \
      bash /tmp/detect-mirror.sh --force-${DEPLOY_REGION}; \
    else \
      bash /tmp/detect-mirror.sh; \
    fi

COPY package*.json ./
RUN corepack enable && pnpm install --frozen-lockfile

# ============================================
# 阶段 2: 构建应用
# ============================================
FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm run build

# ============================================
# 阶段 3: 运行环境
# ============================================
FROM node:24-bookworm-slim AS runner
ARG BUILD_DATE
WORKDIR /app

# 安装 PostgreSQL
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      postgresql-17 \
      postgresql-client-17 && \
    rm -rf /var/lib/apt/lists/*

ENV PGPORT=5433

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# 复制启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 环境变量
ENV NODE_ENV=production
ENV PORT=5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# OCI 标签
LABEL org.opencontainers.image.title="lionetrides"
LABEL org.opencontainers.image.description="Auto-generated from deploy.yaml"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

EXPOSE 5000

# 启动
ENTRYPOINT ["docker-entrypoint.sh"]
