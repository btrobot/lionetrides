# Dockerfile 编写规范

> 核心理念：Dockerfile 是程序，不是脚本。

## 一、元数据（OCI 标准 LABEL）

```dockerfile
ARG PROJECT_NAME="项目名称"
ARG PROJECT_VERSION="1.0.0"
ARG BUILD_DATE
ARG GIT_COMMIT

LABEL org.opencontainers.image.title="${PROJECT_NAME}"
LABEL org.opencontainers.image.description="项目描述"
LABEL org.opencontainers.image.version="${PROJECT_VERSION}"
LABEL org.opencontainers.image.authors="作者"
LABEL org.opencontainers.image.source="源码仓库URL"
LABEL org.opencontainers.image.vendor="公司/组织"
LABEL org.opencontainers.image.licenses="许可证"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
```

## 二、基础镜像

- 优先使用 `-slim` 版本（体积小）
- 固定主版本号（如 `node:24-bookworm-slim`），禁止 `latest`
- 记录选择理由（注释）

## 三、多阶段构建

### 标准三阶段

```dockerfile
# 阶段 1: 依赖安装
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile

# 阶段 2: 构建
FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# 阶段 3: 运行
FROM node:24-bookworm-slim AS runner
WORKDIR /app
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package*.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 阶段命名

- `deps` — 依赖安装
- `builder` — 构建
- `runner` — 运行环境

### 大目录 tar 归档

超过 1000 个文件的目录（如 node_modules）必须 tar 归档：

```dockerfile
# deps 阶段
RUN tar cf /tmp/node_modules.tar node_modules

# builder/runner 阶段
COPY --from=deps /tmp/node_modules.tar /tmp/
RUN tar xf /tmp/node_modules.tar -C /app --no-same-owner && \
    rm /tmp/node_modules.tar
```

**关键**：`--no-same-owner` 避免解压后文件属主为 root。

## 四、安全

### 非 root 运行

```dockerfile
# 方式 1：直接使用 node 用户（Node 镜像内置）
USER node
CMD ["node", "dist/server.js"]

# 方式 2：entrypoint 中切换（需要特权操作时）
# entrypoint 最后：
exec su -s /bin/bash node -c "exec node dist/server.js"
```

### 文件权限

```dockerfile
# 正确：使用 --chown
COPY --from=builder --chown=node:node /app/dist ./dist

# 错误：chmod 777
RUN chmod -R 777 /app
```

### 密码管理

```dockerfile
# 正确：提供默认值 + 注释说明
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5433/mydb
# 注意：生产环境必须通过 --env-file 覆盖

# 错误：硬编码真实密码
ENV DATABASE_URL=postgresql://postgres:realpassword@localhost:5433/mydb
```

## 五、性能

### 层缓存优化

```dockerfile
# 不常变化的先复制
COPY package*.json ./
RUN pnpm install --frozen-lockfile

# 经常变化的后复制
COPY . .
```

### 镜像体积

```dockerfile
# 安装后清理缓存
RUN apt-get update && \
    apt-get install -y --no-install-recommends package && \
    rm -rf /var/lib/apt/lists/*
```

- 使用 `--no-install-recommends`
- 合并 RUN 指令减少层数
- 及时清理临时文件

## 六、健康检查

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

- 间隔：30s-60s
- 超时：5s-15s
- 启动期：30s-120s
- 重试：3-5 次
- 健康检查端点应轻量级，可检查数据库连接

## 七、端口一致性

Dockerfile、entrypoint、run 脚本的端口必须一致，使用环境变量配置：

```dockerfile
# Dockerfile
ENV PORT=3000
EXPOSE 3000
ENV PGPORT=5433
```

```bash
# entrypoint
su - postgres -c "pg_isready -p ${PGPORT:-5433}"
```

```bash
# run script
PORT="${PORT:-3000}"
docker run -p ${PORT}:${PORT} ...
```

## 八、镜像源适配

### 构建参数

```dockerfile
ARG DEPLOY_REGION=auto  # auto | cn | global
```

### 自动检测调用

```dockerfile
COPY scripts/detect-mirror.sh /tmp/
RUN if [ "${DEPLOY_REGION}" = "cn" ] || [ "${DEPLOY_REGION}" = "global" ]; then \
      bash /tmp/detect-mirror.sh --force-${DEPLOY_REGION}; \
    else \
      bash /tmp/detect-mirror.sh; \
    fi
```

**注意**：不要直接 `--force-${DEPLOY_REGION}`，因为 `auto` 不是有效参数。

### 镜像源清单

| 工具 | 国内 | 国际 |
|------|------|------|
| npm/pnpm | `mirrors.cloud.tencent.com/npm` | `registry.npmjs.org` |
| apt | `mirrors.ustc.edu.cn` | `deb.debian.org` |
| corepack | 同 npm | 同 npm |

## 九、.dockerignore

```
node_modules
.next
.git
.github
*.md
.env*
Dockerfile*
docker-compose*
docker-*.sh
scripts/detect-mirror.sh
__pycache__
.DS_Store
```
