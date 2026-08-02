# ============================================================
# Lion E-Trides — Next.js 16 Dockerfile
# ============================================================
FROM node:24-bookworm-slim

# 国内镜像源加速
RUN sed -i 's|deb.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|security.debian.org|mirrors.ustc.edu.cn|g' /etc/apt/sources.list.d/debian.sources

ENV COREPACK_REGISTRY=https://mirrors.cloud.tencent.com/npm
RUN npm config set registry https://mirrors.cloud.tencent.com/npm && \
    corepack enable && \
    corepack prepare pnpm@9.15.0 --activate

# 安装必要工具
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends curl tini && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制所有文件（node_modules 在 .dockerignore 中未排除）
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建 Next.js
RUN pnpm next build && \
    pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

# 清理缓存减小镜像
RUN rm -rf .next/cache node_modules/.cache

# 设置目录权限
RUN mkdir -p .next/dev && chmod -R 777 .next

EXPOSE 5000

ENV NODE_ENV=production
ENV COZE_PROJECT_ENV=PROD
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/server.js"]
