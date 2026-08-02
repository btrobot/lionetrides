# Docker 部署指南

本文档介绍如何使用 Docker 构建和部署 Lion E-Trides 项目。

## 前置要求

- Docker 已安装并运行
- pnpm 已安装
- 已配置环境变量（DATABASE_URL 等）

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 构建镜像

```bash
./docker-build.sh
```

常用选项：
- `--clean` — 构建前清理 Docker 缓存
- `--no-cache` — 不使用缓存（完全重新构建）
- `--push` — 构建后推送到镜像仓库

### 3. 运行容器

```bash
./docker-run.sh
```

常用选项：
- `--env-file=.env.local` — 指定环境变量文件
- `--port=3000` — 指定端口（默认 3000）
- `--foreground` — 前台运行（调试用）

### 4. 停止容器

```bash
./docker-stop.sh
```

## 环境变量

创建 `.env.local` 文件，包含以下必要变量：

```bash
# 数据库连接（Neon PostgreSQL）
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Next.js
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

## 常用命令

```bash
# 查看容器日志
sudo docker logs -f lionetrides-container

# 进入容器
sudo docker exec -it lionetrides-container bash

# 查看运行中的容器
sudo docker ps

# 查看所有容器
sudo docker ps -a

# 清理未使用的镜像
sudo docker image prune -f
```

## 生产部署建议

### 使用 Docker Compose（推荐）

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: lionetrides-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    environment:
      - NODE_ENV=production
```

运行：
```bash
docker-compose up -d
```

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 故障排除

### 构建失败

1. 检查磁盘空间：`df -h`
2. 清理 Docker 缓存：`./docker-build.sh --clean`
3. 完全重新构建：`./docker-build.sh --no-cache`

### 容器无法启动

1. 检查日志：`sudo docker logs lionetrides-container`
2. 确认环境变量：检查 `.env.local` 文件
3. 检查端口占用：`sudo lsof -i :3000`

### 数据库连接失败

1. 确认 DATABASE_URL 格式正确
2. 检查数据库服务是否运行
3. 检查网络连接和防火墙设置
