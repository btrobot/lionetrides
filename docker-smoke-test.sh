#!/bin/bash
set -euo pipefail

# ============================================
# Lionet Rides — Docker Smoke Test
# 验证容器健康 + 页面可达 + API 响应 + 日志检查
# ============================================

CONTAINER_NAME="lionetrides-container"
APP_PORT="${APP_PORT:-5000}"
BASE_URL="http://localhost:${APP_PORT}"
PASS=0
FAIL=0

# ─── 颜色 ───
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}PASS${NC} $1"; ((PASS++)); }
fail() { echo -e "  ${RED}FAIL${NC} $1"; ((FAIL++)); }
info() { echo -e "${YELLOW}[smoke]${NC} $1" >&2; }

# ─── 1. 容器状态 ───
info "检查容器状态..."
if docker ps --format '{{.Names}} {{.Status}}' | grep "${CONTAINER_NAME}" | grep -q "Up"; then
  pass "容器运行中"
else
  fail "容器未运行"
  exit 1
fi

# ─── 2. 健康检查 ──
info "检查健康状态..."
HEALTH=$(docker inspect --format '{{.State.Health.Status}}' "${CONTAINER_NAME}" 2>/dev/null || echo "unknown")
if [ "${HEALTH}" = "healthy" ]; then
  pass "健康检查通过 (healthy)"
else
  fail "健康检查未通过 (${HEALTH})"
fi

# ─── 3. 首页可达 ───
info "检查首页..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BASE_URL}/en" || echo "000")
if [ "${HTTP_CODE}" = "200" ]; then
  pass "首页 /en (HTTP ${HTTP_CODE})"
else
  fail "首页 /en (HTTP ${HTTP_CODE})"
fi

# ─── 4. API 响应 ───
info "检查 API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BASE_URL}/api/v1/products?limit=1" || echo "000")
if [ "${HTTP_CODE}" = "200" ]; then
  pass "API /api/v1/products (HTTP ${HTTP_CODE})"
else
  fail "API /api/v1/products (HTTP ${HTTP_CODE})"
fi

# ─── 5. Sitemap ──
info "检查 Sitemap..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BASE_URL}/sitemap.xml" || echo "000")
if [ "${HTTP_CODE}" = "200" ]; then
  pass "Sitemap (HTTP ${HTTP_CODE})"
else
  fail "Sitemap (HTTP ${HTTP_CODE})"
fi

# ─── 6. 日志错误检查 ───
info "检查容器日志..."
ERROR_COUNT=$(docker logs "${CONTAINER_NAME}" 2>&1 | grep -ciE "error|exception|fatal" || echo "0")
if [ "${ERROR_COUNT}" -eq 0 ]; then
  pass "日志无错误"
else
  fail "日志发现 ${ERROR_COUNT} 条错误"
fi

# ─── 汇总 ───
echo ""
echo "========================================" >&2
echo "Smoke Test 结果: ${PASS} 通过, ${FAIL} 失败" >&2
echo "========================================" >&2

if [ "${FAIL}" -gt 0 ]; then
  exit 1
fi
