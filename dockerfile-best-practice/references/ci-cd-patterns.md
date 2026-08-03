# CI/CD 双模式部署模板

## Mode A：服务器直接构建（手动部署）

适用场景：国内服务器，直接在服务器上 `docker build`。

```yaml
# .github/workflows/deploy.yml
name: Deploy (Mode A - Server Build)

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to server via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/project
            git pull origin main
            ./docker-build.sh --region cn
            ./docker-run.sh --env-file .env.local
```

## Mode B：GitHub Actions 构建 → 镜像推送（自动部署）

适用场景：在 GitHub Actions 中构建镜像，推送到 ghcr.io，服务器拉取运行。

```yaml
# .github/workflows/deploy-mode-b.yml
name: Deploy (Mode B - GHA Build + Push)

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          build-args: |
            DEPLOY_REGION=global
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            docker stop ${{ secrets.CONTAINER_NAME }} || true  # 容器可能不存在，忽略错误
            docker rm ${{ secrets.CONTAINER_NAME }} || true    # 同上
            docker run -d \
              --name ${{ secrets.CONTAINER_NAME }} \
              --env-file /path/to/.env.local \
              -p 5000:3000 \
              --restart unless-stopped \
              ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
```

## 关键差异

| 维度 | Mode A | Mode B |
|------|--------|--------|
| 构建位置 | 目标服务器 | GitHub Actions |
| 网络环境 | 国内 | 国际（GHA） |
| DEPLOY_REGION | cn | global |
| 镜像传输 | 无（本地构建） | ghcr.io 推送/拉取 |
| 构建缓存 | 服务器本地 | GHA Cache（~5GB） |
| 适用场景 | 手工部署、快速迭代 | 自动化 CI/CD |

## 注意事项

1. **Mode A** 的 `DEPLOY_REGION=cn`，因为服务器在国内
2. **Mode B** 的 `DEPLOY_REGION=global`，因为 GHA runner 在海外
3. **Mode B** 使用 GHA Cache 加速构建（`cache-from: type=gha`）
4. **Secrets 必须配置**：SERVER_HOST, SERVER_USER, SSH_PRIVATE_KEY, GITHUB_TOKEN, CONTAINER_NAME
5. **推送 workflow 文件前**：确保 GitHub token 有 `workflow` scope
