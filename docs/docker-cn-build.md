# Docker 国内构建指南

## 问题

国内构建 Docker 镜像面临以下挑战：
1. Docker Hub 被墙，拉取基础镜像失败或极慢
2. npm/pnpm 依赖下载慢
3. 构建缓存管理

## 解决方案

### 1. Docker 镜像源配置

编辑 `/etc/docker/daemon.json`：

```json
{
  "registry-mirrors": [
    "https://docker.nju.edu.cn",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB"
    }
  }
}
```

重启 Docker：
```bash
sudo systemctl restart docker
```

### 2. 预拉取基础镜像

```bash
# 使用预拉取脚本
bash scripts/docker-pull-base.sh

# 或手动拉取（通过镜像源）
docker pull docker.nju.edu.cn/library/node:24-bookworm-slim
docker tag docker.nju.edu.cn/library/node:24-bookworm-slim node:24-bookworm-slim
```

### 3. 使用国内优化版 Dockerfile

```bash
# 使用国内优化版 Dockerfile
docker build -f Dockerfile.cn -t lionetrides:latest .

# 指定自定义镜像源
docker build -f Dockerfile.cn \
  --build-arg NODE_IMAGE=registry.cn-hangzhou.aliyuncs.com/your-org/node:24-bookworm-slim \
  --build-arg NPM_REGISTRY=https://registry.npmmirror.com \
  -t lionetrides:latest .
```

### 4. 磁盘清理（保护构建缓存）

```bash
# 使用安全清理脚本
bash scripts/docker-cleanup.sh

# 或手动清理（保留基础镜像）
docker image prune -f                    # 只清理 dangling 镜像
docker builder prune --filter "until=72h" -f  # 清理 72 小时前的构建缓存
```

**不要使用**：
```bash
# ❌ 会删除所有未使用的镜像，包括基础镜像
docker system prune -a
```

### 5. 私有镜像仓库（推荐）

如果有阿里云/腾讯云容器镜像服务：

```bash
# 登录
docker login registry.cn-hangzhou.aliyuncs.com

# 推送基础镜像
docker tag node:24-bookworm-slim registry.cn-hangzhou.aliyuncs.com/your-org/node:24-bookworm-slim
docker push registry.cn-hangzhou.aliyuncs.com/your-org/node:24-bookworm-slim

# 修改 Dockerfile 使用私有镜像
FROM registry.cn-hangzhou.aliyuncs.com/your-org/node:24-bookworm-slim AS deps
```

### 6. 代理配置

如果镜像源不可用，配置代理：

```bash
# Docker daemon 代理
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf << EOF
[Service]
Environment="HTTP_PROXY=http://127.0.0.1:7890"
Environment="HTTPS_PROXY=http://127.0.0.1:7890"
Environment="NO_PROXY=localhost,127.0.0.1,docker-registry.somecorporation.com"
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 构建命令汇总

```bash
# 1. 预拉取基础镜像
bash scripts/docker-pull-base.sh

# 2. 构建镜像（使用国内优化版）
docker build -f Dockerfile.cn -t lionetrides:latest .

# 3. 测试运行
docker run --rm -p 5000:5000 lionetrides:latest

# 4. 清理磁盘（安全模式）
bash scripts/docker-cleanup.sh
```

## 常见问题

### Q: 拉取镜像超时
A: 配置镜像源或代理，见上文。

### Q: 构建缓存丢失
A: 使用 `--mount=type=cache` 挂载缓存目录，见 Dockerfile.cn。

### Q: 磁盘空间不足
A: 使用 `scripts/docker-cleanup.sh` 安全清理。

### Q: 如何在 CI/CD 中使用
A: 在 GitHub Actions 中，可以使用 `docker/login-action` 登录私有仓库，并缓存基础镜像。
