#!/bin/bash
set -euo pipefail

# ============================================
# Lionet Rides — Docker Build Script
# 用法: ./docker-build.sh [--region cn|global|auto] [--no-cache]
# ============================================

# ─── 默认值 ───
DEPLOY_REGION="auto"
NO_CACHE=""
PROJECT_NAME="lionetrides"
PROJECT_VERSION="1.0.0"

# ─── 参数解析（while 循环，禁止 for） ───
while [ $# -gt 0 ]; do
  case $1 in
    --region=*)  DEPLOY_REGION="${1#*=}"; shift ;;
    --region)    DEPLOY_REGION="$2"; shift 2 ;;
    --no-cache)  NO_CACHE="--no-cache"; shift ;;
    --help)
      echo "用法: $0 [--region cn|global|auto] [--no-cache]"
      echo "  --region    镜像源环境: cn(国内) / global(国际) / auto(自动检测)"
      echo "  --no-cache  禁用 Docker 缓存"
      exit 0
      ;;
    *)
      echo "未知参数: $1" >&2
      exit 1
      ;;
  esac
done

# ── 预检 ───
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Dockerfile 存在性
if [ ! -f Dockerfile ]; then
  echo "错误: Dockerfile 不存在" >&2
  exit 1
fi

# Docker 服务状态
if ! docker info >/dev/null 2>&1; then
  echo "错误: Docker 服务未运行" >&2
  exit 1
fi

# 磁盘空间（≥ 5GB）
AVAILABLE_GB=$(df -BG . | awk 'NR==2 {gsub("G",""); print $4}')
if [ "$AVAILABLE_GB" -lt 5 ]; then
  echo "错误: 磁盘空间不足 (${AVAILABLE_GB}GB < 5GB)" >&2
  exit 1
fi

# ─── 构建 ──
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "========================================" >&2
echo "Lionet Rides — Docker Build" >&2
echo "========================================" >&2
echo "Region:      ${DEPLOY_REGION}" >&2
echo "Version:     ${PROJECT_VERSION}" >&2
echo "Git Commit:  ${GIT_COMMIT}" >&2
echo "Build Date:  ${BUILD_DATE}" >&2
echo "No Cache:    ${NO_CACHE:-no}" >&2
echo "========================================" >&2

docker build \
  --build-arg PROJECT_NAME="${PROJECT_NAME}" \
  --build-arg PROJECT_VERSION="${PROJECT_VERSION}" \
  --build-arg BUILD_DATE="${BUILD_DATE}" \
  --build-arg GIT_COMMIT="${GIT_COMMIT}" \
  --build-arg DEPLOY_REGION="${DEPLOY_REGION}" \
  ${NO_CACHE} \
  -t "${PROJECT_NAME}:${PROJECT_VERSION}" \
  -t "${PROJECT_NAME}:latest" \
  .

echo "构建完成: ${PROJECT_NAME}:${PROJECT_VERSION}" >&2
