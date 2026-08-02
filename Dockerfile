# ============================================================
# Lion E-Trides — Next.js 16 + PostgreSQL 一体化 Dockerfile
# ============================================================
FROM node:24-bookworm-slim

# 国内镜像源加速
RUN sed -i 's|deb.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|security.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list.d/debian.sources

ENV COREPACK_REGISTRY=https://mirrors.cloud.tencent.com/npm
RUN npm config set registry https://mirrors.cloud.tencent.com/npm && \
    corepack enable && \
    corepack prepare pnpm@9.15.0 --activate

# 安装 PostgreSQL + 必要工具
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends \
      postgresql postgresql-client \
      curl tini && \
    rm -rf /var/lib/apt/lists/*

# 初始化 PostgreSQL
RUN su - postgres -c "pg_ctlcluster 15 main start" && \
    sleep 1 && \
    su - postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres';\"" && \
    su - postgres -c "createdb lionetrides" && \
    su - postgres -c "pg_ctlcluster 15 main stop"

WORKDIR /app

# 复制所有文件
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lionetrides

# 构建 Next.js
RUN pnpm next build && \
    pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

# 清理缓存减小镜像
RUN rm -rf .next/cache node_modules/.cache

# 设置目录权限
RUN mkdir -p .next/dev && chmod -R 777 .next && \
    chmod +x docker-entrypoint.sh

EXPOSE 5000

ENV NODE_ENV=production
ENV COZE_PROJECT_ENV=PROD
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lionetrides

ENTRYPOINT ["tini", "--"]
CMD ["./docker-entrypoint.sh"]
