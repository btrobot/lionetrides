#!/bin/bash
# Docker 磁盘清理脚本（国内构建优化版）
# 安全清理 dangling 镜像，保护构建缓存

set -euo pipefail

echo "=== Docker 磁盘清理 ==="

# 显示当前磁盘使用
echo ""
echo "清理前："
docker system df

# 保护列表（不会被删除）
PROTECTED_IMAGES=(
    "node:24-bookworm-slim"
    "node:24-bookworm"
    "ghcr.nju.edu.cn/btrobot/lionetrides"
)

echo ""
echo "=== 保护的镜像 ==="
for img in "${PROTECTED_IMAGES[@]}"; do
    if docker image inspect "$img" >/dev/null 2>&1; then
        echo "  ✓ $img"
    fi
done

# 清理 dangling 镜像（无标签的中间镜像）
echo ""
echo "=== 清理 dangling 镜像 ==="
docker image prune -f

# 清理构建缓存（保留最近的）
echo ""
echo "=== 清理旧构建缓存 ==="
# BuildKit 缓存
docker builder prune --filter "until=72h" -f 2>/dev/null || true

# 清理停止的容器
echo ""
echo "=== 清理停止的容器 ==="
docker container prune -f

# 清理未使用的网络
echo ""
echo "=== 清理未使用的网络 ==="
docker network prune -f

# 清理后显示
echo ""
echo "清理后："
docker system df

echo ""
echo "=== 完成 ==="
