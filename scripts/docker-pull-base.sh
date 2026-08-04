#!/bin/bash
# 预拉取基础镜像（国内优化版）
# 解决 Docker Hub 被墙的问题

set -euo pipefail

# 配置
DOCKER_HUB_MIRROR="${DOCKER_HUB_MIRROR:-docker.nju.edu.cn}"
PRIVATE_REGISTRY="${PRIVATE_REGISTRY:-}"  # 可选：私有仓库

# 需要的基础镜像
BASE_IMAGES=(
    "node:24-bookworm-slim"
    "node:24-bookworm"
)

echo "=== 预拉取基础镜像 ==="

pull_with_mirror() {
    local image=$1
    local mirror=$2
    
    echo ""
    echo "拉取: $image"
    
    # 方案1：直接拉取（如果镜像源已配置）
    if docker pull "$image" 2>/dev/null; then
        echo "  ✓ 直接拉取成功"
        return 0
    fi
    
    # 方案2：通过镜像源拉取
    if [ -n "$mirror" ]; then
        local mirror_image="${mirror}/${image}"
        echo "  尝试镜像源: $mirror_image"
        if docker pull "$mirror_image" 2>/dev/null; then
            docker tag "$mirror_image" "$image"
            echo "  ✓ 镜像源拉取成功"
            return 0
        fi
    fi
    
    # 方案3：通过代理拉取
    if [ -n "${HTTPS_PROXY:-}" ] || [ -n "${HTTP_PROXY:-}" ]; then
        echo "  尝试通过代理拉取..."
        # Docker daemon 需要配置代理
        if docker pull "$image" 2>/dev/null; then
            echo "  ✓ 代理拉取成功"
            return 0
        fi
    fi
    
    echo "  ❌ 拉取失败"
    return 1
}

# 拉取所有基础镜像
FAILED=0
for image in "${BASE_IMAGES[@]}"; do
    if ! pull_with_mirror "$image" "$DOCKER_HUB_MIRROR"; then
        FAILED=$((FAILED + 1))
    fi
done

# 推送到私有仓库（如果配置）
if [ -n "$PRIVATE_REGISTRY" ] && [ $FAILED -eq 0 ]; then
    echo ""
    echo "=== 推送到私有仓库 ==="
    for image in "${BASE_IMAGES[@]}"; do
        local_tag="${PRIVATE_REGISTRY}/${image}"
        docker tag "$image" "$local_tag"
        if docker push "$local_tag" 2>/dev/null; then
            echo "  ✓ $local_tag"
        else
            echo "  ❌ 推送失败: $local_tag"
        fi
    done
fi

# 显示结果
echo ""
echo "=== 本地基础镜像 ==="
docker images | grep -E "node|debian|ubuntu" | head -10

echo ""
if [ $FAILED -eq 0 ]; then
    echo "✓ 所有镜像拉取成功"
else
    echo "❌ $FAILED 个镜像拉取失败"
    exit 1
fi
