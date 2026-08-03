#!/bin/bash
# ============================================================
# Docker 部署 Smoke 测试 — Lion E-Trides
# 用法: ./docker-smoke-test.sh [--host http://localhost:5000]
# ============================================================
# 不使用 set -e，各步骤独立判错

# ─── 颜色 ───
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
PASS=0
FAIL=0
WARN=0

log()   { echo -e "${BLUE}[INFO]${NC} $1"; }
pass()  { echo -e "  ${GREEN}[PASS]${NC} $1"; ((PASS++)); }
fail()  { echo -e "  ${RED}[FAIL]${NC} $1"; ((FAIL++)); }
warn()  { echo -e "  ${YELLOW}[WARN]${NC} $1"; ((WARN++)); }

# ─── 参数解析 ───
HOST="http://localhost:5000"
case "${1:-}" in
  --url=*|--host=*) HOST="${1#*=}" ;;
  --url|--host) HOST="${2:-$HOST}" ;;
  "") ;;
  *) HOST="$1" ;;
esac
CONTAINER_NAME="lionetrides-container"
TIMEOUT=10

# ─── 等待服务就绪（最多 90 秒） ───
log "等待服务就绪（最多 90 秒）..."
for i in $(seq 1 30); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$HOST" 2>/dev/null || echo "000")
  if [ "$CODE" != "000" ]; then
    pass "服务已就绪（第 $((i*3)) 秒，HTTP $CODE）"
    break
  fi
  if [ "$i" -eq 30 ]; then
    fail "服务未就绪（等待 90 秒超时）"
  fi
  sleep 3
done

echo ""
echo "=========================================="
echo "  Docker Smoke Test — Lion E-Trides"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "  目标: $HOST"
echo "=========================================="
echo ""

# ============================================================
# 1. 容器状态检查
# ============================================================
log "检查容器状态..."

if sudo docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
  pass "容器 $CONTAINER_NAME 正在运行"
else
  warn "容器 $CONTAINER_NAME 未运行（可能在非 Docker 环境运行）"
fi

echo ""

# ============================================================
# 2. HTTP 服务可用性
# ============================================================
log "检查 HTTP 服务可用性..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$HOST" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ]; then
  pass "根路径返回 $HTTP_CODE"
else
  fail "根路径返回 $HTTP_CODE（期望 200/301/302/307）"
fi

echo ""

# ============================================================
# 3. 关键页面可达性
# ============================================================
log "检查关键页面可达性..."

PAGES=(
  "/"
  "/zh"
  "/zh/products"
  "/zh/categories"
  "/zh/brands"
  "/zh/news"
  "/zh/about"
  "/zh/auth/login"
  "/zh/auth/register"
)

for page in "${PAGES[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$HOST$page" 2>/dev/null || echo "000")
  if [ "$CODE" = "200" ]; then
    pass "$page → $CODE"
  elif [ "$CODE" = "301" ] || [ "$CODE" = "302" ] || [ "$CODE" = "307" ] || [ "$CODE" = "308" ]; then
    warn "$page → $CODE（重定向，可能正常）"
  else
    fail "$page → $CODE"
  fi
done

echo ""

# ============================================================
# 4. API 接口可用性
# ============================================================
log "检查 API 接口可用性..."

# 4a. 公开 API
API_ROUTES=(
  "/api/v1/products?limit=1"
  "/api/v1/categories"
  "/api/v1/brands"
  "/api/v1/news?limit=1"
  "/api/v1/certifications"
  "/api/v1/partners"
)

for route in "${API_ROUTES[@]}"; do
  BODY=$(curl -s --max-time "$TIMEOUT" "$HOST$route" 2>/dev/null)
  CODE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")
  if [ "$CODE" = "True" ]; then
    pass "GET $route → success=true"
  else
    fail "GET $route → success=$CODE"
  fi
done

# 4b. 登录接口
LOGIN_BODY=$(curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"action":"login","email":"admin@ridex.com","password":"Admin123!"}' \
  --max-time "$TIMEOUT" "$HOST/api/v1/auth" 2>/dev/null)
LOGIN_OK=$(echo "$LOGIN_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success', False))" 2>/dev/null || echo "false")
if [ "$LOGIN_OK" = "True" ]; then
  pass "POST /api/v1/auth/login → 登录成功"
  TOKEN=$(echo "$LOGIN_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

  # 4c. 需要认证的 API
  AUTH_ROUTES=(
    "/api/v1/inquiries?limit=1"
    "/api/v1/customers?limit=1"
    "/api/v1/reviews?limit=1"
  )
  for route in "${AUTH_ROUTES[@]}"; do
    BODY=$(curl -s -H "Authorization: Bearer $TOKEN" --max-time "$TIMEOUT" "$HOST$route" 2>/dev/null)
    CODE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")
    if [ "$CODE" = "True" ]; then
      pass "GET $route → success=true"
    else
      fail "GET $route → success=$CODE"
    fi
  done
else
  fail "POST /api/v1/auth/login → 登录失败"
fi

echo ""

# ============================================================
# 5. 静态资源可访问
# ============================================================
log "检查静态资源可访问性..."

# 检查 Next.js 构建产物是否可访问
NEXT_ASSETS=(
  "/_next/static/chunks"
  "/favicon.ico"
  "/api/v1/products?limit=1"
)

# 检查 favicon
FAVICON_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$HOST/favicon.ico" 2>/dev/null || echo "000")
if [ "$FAVICON_CODE" = "200" ]; then
  pass "/favicon.ico → $FAVICON_CODE"
else
  warn "/favicon.ico → $FAVICON_CODE（可能无 favicon）"
fi

echo ""

# ============================================================
# 6. 应用日志检查
# ============================================================
log "检查应用日志（错误）..."

# 检查最近的容器日志中是否有错误
if sudo docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
  ERROR_COUNT=$(sudo docker logs "$CONTAINER_NAME" --tail 100 2>/dev/null | grep -ciE "error|exception|traceback" || true)
  if [ "$ERROR_COUNT" -le 2 ]; then
    pass "Docker 日志中错误数: $ERROR_COUNT"
  else
    warn "Docker 日志中发现 $ERROR_COUNT 条错误，请检查: sudo docker logs $CONTAINER_NAME"
  fi
else
  warn "跳过日志检查（容器未运行）"
fi

echo ""

# ============================================================
# 结果汇总
# ============================================================
TOTAL=$((PASS + FAIL + WARN))
echo "=========================================="
echo "  Smoke Test 结果汇总"
echo "=========================================="
echo "  总检查项: $TOTAL"
echo -e "  ${GREEN}通过: $PASS${NC}"
echo -e "  ${RED}失败: $FAIL${NC}"
echo -e "  ${YELLOW}警告: $WARN${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}❌ Smoke Test 未通过 — $FAIL 项失败${NC}"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Smoke Test 通过，但有 $WARN 项警告${NC}"
  exit 0
else
  echo -e "${GREEN}✅ Smoke Test 全部通过${NC}"
  exit 0
fi
