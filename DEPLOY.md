# Lion E-Trides 部署指南

## 当前架构

```
用户 → Caddy (auto-ingress) → lionetrides-container:5000
```

- **Caddy**: 自动 HTTPS，反向代理
- **lionetrides-container**: Next.js 应用

## 快速部署

### 1. 构建镜像

```bash
./docker-build.sh
```

### 2. 启动容器

```bash
./docker-run.sh
```

容器会自动连接到 `auto-ingress_gateway-net` 网络。

### 3. 更新 Caddy 配置

```bash
# 更新 Caddyfile 指向新容器
sudo sed -i 's/reverse_proxy joyforge:5000/reverse_proxy lionetrides-container:5000/' /etc/auto-ingress/Caddyfile

# 重启 Caddy
sudo docker restart auto-ingress-gateway
```

### 4. 验证

```bash
# 检查容器状态
sudo docker ps --filter "name=lionetrides"

# 测试访问
curl -I https://lionetrides.com
```

## 环境变量

创建 `.env.local` 文件：

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://lionetrides.com
```

然后运行：

```bash
./docker-run.sh --env-file .env.local
```

## 常用命令

| 命令 | 说明 |
|---|---|
| `./docker-build.sh` | 构建镜像 |
| `./docker-run.sh` | 启动容器 |
| `./docker-stop.sh` | 停止容器 |
| `./docker-stop.sh --remove` | 停止并删除容器 |
| `sudo docker logs -f lionetrides-container` | 查看日志 |
| `sudo docker exec -it lionetrides-container bash` | 进入容器 |

## 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
./docker-build.sh --no-cache

# 3. 重启容器
./docker-stop.sh --remove
./docker-run.sh
```

## 故障排除

### 容器无法启动

```bash
# 查看日志
sudo docker logs lionetrides-container

# 检查端口占用
sudo lsof -i :5000
```

### Caddy 无法访问

```bash
# 检查 Caddy 日志
sudo docker logs auto-ingress-gateway

# 检查网络连接
sudo docker network inspect auto-ingress_gateway-net
```

### 数据库连接失败

```bash
# 检查环境变量
sudo docker exec lionetrides-container env | grep DATABASE_URL

# 测试数据库连接
sudo docker exec -it lionetrides-container psql $DATABASE_URL
```
