# ============================================
# Dockerfile — Lionet Rides B2B Website
# Next.js (应用容器，数据库独立部署)
# ============================================

# ─── 构建参数 ───
ARG PROJECT_NAME="lionetrides"
ARG PROJECT_VERSION="1.0.0"
ARG BUILD_DATE
ARG GIT_COMMIT
ARG DEPLOY_REGION=auto

# ============================================
# 阶段 1: 安装依赖
# ============================================
FROM node:24-bookworm-slim AS deps
WORKDIR /app

# 镜像源自动检测（国内/国际自适应）
COPY scripts/detect-mirror.sh /tmp/
RUN if [ "${DEPLOY_REGION}" = "cn" ] || [ "${DEPLOY_REGION}" = "global" ]; then \
      bash /tmp/detect-mirror.sh --force-${DEPLOY_REGION}; \
    else \
      bash /tmp/detect-mirror.sh; \
    fi

# 启用 corepack（pnpm 包管理器）
RUN corepack enable

# 层缓存优化：package.json 先于源码
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 归档 node_modules（避免 COPY 数万小文件超时）
RUN tar cf /tmp/node_modules.tar node_modules

# ============================================
# 阶段 2: 构建应用
# ============================================
FROM node:24-bookworm-slim AS builder
WORKDIR /app

# 启用 corepack
RUN corepack enable

# 解压依赖
COPY --from=deps /tmp/node_modules.tar /tmp/
RUN tar xf /tmp/node_modules.tar -C /app --no-same-owner && \
    rm /tmp/node_modules.tar

# 复制源码并构建
COPY . .
RUN pnpm run build

# 归档构建产物（dist/ 目录）
RUN tar cf /tmp/dist.tar dist

# ============================================
# 阶段 3: 运行环境
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

# 安装 curl（健康检查用）
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# 环境变量
ENV NODE_ENV=production
ENV PORT=5000

# 解压构建产物
COPY --from=builder /tmp/dist.tar /tmp/
RUN tar xf /tmp/dist.tar -C /app --no-same-owner && \
    rm /tmp/dist.tar

# 解压运行时依赖
COPY --from=deps /tmp/node_modules.tar /tmp/
RUN tar xf /tmp/node_modules.tar -C /app --no-same-owner && \
    rm /tmp/node_modules.tar

# 复制 package.json（运行时元数据）
COPY --from=builder /app/package.json ./

# 复制启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN if [ -f /usr/local/bin/docker-entrypoint.sh ]; then chmod +x /usr/local/bin/docker-entrypoint.sh; fi

# 健康检查（30s 间隔，60s 启动期）
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

EXPOSE 5000

ENTRYPOINT ["docker-entrypoint.sh"]
