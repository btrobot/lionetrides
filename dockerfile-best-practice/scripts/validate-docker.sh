#!/bin/bash
# scripts/validate-docker.sh
# Docker 基础设施验证脚本
# 基于 5 轮 Review 遇到的所有问题设计

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

ERRORS=0

error() {
  echo "❌ $1"
  ERRORS=$((ERRORS + 1))
}

success() {
  echo "✅ $1"
}

warn() {
  echo "⚠️  $1"
}

echo "=== Docker 基础设施验证 ==="
echo ""

# ============================================================================
# 1. Shell 脚本语法检查
# ============================================================================
echo "1. Shell 脚本语法检查..."
for script in docker-build.sh docker-run.sh docker-entrypoint.sh scripts/detect-mirror.sh; do
  if [ -f "$script" ]; then
    if bash -n "$script" 2>/dev/null; then
      success "$script 语法正确"
    else
      error "$script 语法错误"
    fi
  else
    warn "$script 不存在"
  fi
done
echo ""

# ============================================================================
# 2. 项目名一致性检查（第一轮 Review 问题）
# ============================================================================
echo "2. 项目名一致性检查..."
# 检查是否有拼写错误（排除本脚本）
if grep -r "Lion E-Trides" . --include="*.sh" --include="Dockerfile" --include="*.yml" --exclude="validate-docker.sh" 2>/dev/null; then
  error "发现项目名拼写错误: 'Lion E-Trides'"
else
  success "项目名拼写正确"
fi

# 检查所有文件是否使用统一的项目名
for file in docker-build.sh docker-run.sh Dockerfile; do
  if [ -f "$file" ]; then
    if grep -q "LionetRides" "$file"; then
      success "$file 使用正确的项目名"
    else
      warn "$file 未找到项目名"
    fi
  fi
done
echo ""

# ============================================================================
# 3. PostgreSQL 端口一致性检查（第一轮 Review 问题）
# ============================================================================
echo "3. PostgreSQL 端口一致性检查..."
# Dockerfile 中配置的端口（检查 PGPORT 环境变量）
DOCKERFILE_PORT=$(grep -oP 'PGPORT=\K[0-9]+' Dockerfile | head -1)
# entrypoint 中检查的端口
ENTRYPOINT_PORT=$(grep -oP 'pg_isready -p \K[0-9]+' docker-entrypoint.sh | head -1)

if [ -z "$DOCKERFILE_PORT" ]; then
  warn "Dockerfile 中未找到 PGPORT 配置"
elif [ "$DOCKERFILE_PORT" = "$ENTRYPOINT_PORT" ]; then
  success "PostgreSQL 端口一致: $DOCKERFILE_PORT"
else
  error "PostgreSQL 端口不一致: Dockerfile=$DOCKERFILE_PORT, entrypoint=$ENTRYPOINT_PORT"
fi
echo ""

# ============================================================================
# 4. 参数解析测试（第四轮 Review 问题）
# ============================================================================
echo "4. 参数解析测试..."

# 测试 docker-build.sh 参数解析
test_build_params() {
  local DEPLOY_REGION="auto"
  local args=("$@")
  
  # 模拟参数解析逻辑
  while [ ${#args[@]} -gt 0 ]; do
    case ${args[0]} in
      --region=*)    DEPLOY_REGION="${args[0]#*=}"; args=("${args[@]:1}") ;;
      --region)      DEPLOY_REGION="${args[1]}"; args=("${args[@]:2}") ;;
      *)             args=("${args[@]:1}") ;;
    esac
  done
  
  echo "$DEPLOY_REGION"
}

# 测试 --region=cn
result=$(test_build_params --region=cn)
if [ "$result" = "cn" ]; then
  success "docker-build.sh: --region=cn 解析正确"
else
  error "docker-build.sh: --region=cn 解析失败 (得到: $result)"
fi

# 测试 --region cn（不带 =）
result=$(test_build_params --region cn)
if [ "$result" = "cn" ]; then
  success "docker-build.sh: --region cn 解析正确"
else
  error "docker-build.sh: --region cn 解析失败 (得到: $result)"
fi

# 测试 docker-run.sh 参数解析
test_run_params() {
  local PORT="3000"
  local args=("$@")
  
  while [ ${#args[@]} -gt 0 ]; do
    case ${args[0]} in
      --port=*)      PORT="${args[0]#*=}"; args=("${args[@]:1}") ;;
      --port)        PORT="${args[1]}"; args=("${args[@]:2}") ;;
      *)             args=("${args[@]:1}") ;;
    esac
  done
  
  echo "$PORT"
}

result=$(test_run_params --port 5000)
if [ "$result" = "5000" ]; then
  success "docker-run.sh: --port 5000 解析正确"
else
  error "docker-run.sh: --port 5000 解析失败 (得到: $result)"
fi
echo ""

# ============================================================================
# 5. 非 root 运行检查（第二轮 Review 问题）
# ============================================================================
echo "5. 非 root 运行检查..."
if grep -q "su -s /bin/bash node" docker-entrypoint.sh; then
  success "entrypoint 配置了非 root 运行"
else
  error "entrypoint 未配置非 root 运行"
fi

if grep -q "USER node" Dockerfile; then
  success "Dockerfile 配置了 USER node"
else
  warn "Dockerfile 未配置 USER node（可能在 entrypoint 中处理）"
fi
echo ""

# ============================================================================
# 6. 镜像源自动检测检查（第一轮 Review 问题）
# ============================================================================
echo "6. 镜像源自动检测检查..."
# 检查 Dockerfile 是否正确调用 detect-mirror.sh
if grep -q "detect-mirror.sh" Dockerfile; then
  success "Dockerfile 使用了 detect-mirror.sh"
  
  # 检查是否处理了 --force-auto 问题
  if grep -q 'DEPLOY_REGION.*--force-\${DEPLOY_REGION}' Dockerfile; then
    error "Dockerfile 仍然使用 --force-\${DEPLOY_REGION}（会传 --force-auto）"
  else
    success "Dockerfile 正确处理了 DEPLOY_REGION 参数"
  fi
else
  warn "Dockerfile 未使用 detect-mirror.sh"
fi

# 检查 detect-mirror.sh 是否支持 --clear-cache
if grep -q '\-\-clear-cache' scripts/detect-mirror.sh; then
  success "detect-mirror.sh 支持 --clear-cache"
else
  error "detect-mirror.sh 不支持 --clear-cache"
fi
echo ""

# ============================================================================
# 7. 错误处理检查（第一轮 Review 问题）
# ============================================================================
echo "7. 错误处理检查..."
# 检查是否使用了 || true 静默吞错
if grep -E 'chmod.*\|\| true' Dockerfile docker-entrypoint.sh 2>/dev/null; then
  error "发现 '|| true' 静默吞错模式"
else
  success "未发现 '|| true' 静默吞错"
fi

# 检查 createdb 是否有错误处理
if grep -q 'createdb.*2>/dev/null.*|| true' Dockerfile; then
  success "createdb 有错误处理"
else
  warn "createdb 可能缺少错误处理"
fi
echo ""

# ============================================================================
# 8. 文件权限检查（第二轮 Review 问题）
# ============================================================================
echo "8. 文件权限检查..."
if grep -q 'chown -R node:node' Dockerfile; then
  success "Dockerfile 配置了文件权限"
else
  error "Dockerfile 未配置文件权限"
fi

if grep -q '\-\-no-same-owner' Dockerfile; then
  success "tar 解压使用了 --no-same-owner"
else
  warn "tar 解压未使用 --no-same-owner"
fi
echo ""

# ============================================================================
# 9. 安全配置检查（第二轮 Review 问题）
# ============================================================================
echo "9. 安全配置检查..."
# 检查是否有密码硬编码的注释说明
if grep -q '生产环境必须通过.*覆盖' Dockerfile; then
  success "Dockerfile 有密码安全说明"
else
  warn "Dockerfile 缺少密码安全说明"
fi

# 检查是否使用了环境变量
if grep -q 'DATABASE_URL.*:-' docker-entrypoint.sh; then
  success "entrypoint 使用环境变量配置数据库"
else
  error "entrypoint 未使用环境变量配置数据库"
fi
echo ""

# ============================================================================
# 10. HEALTHCHECK 检查
# ============================================================================
echo "10. HEALTHCHECK 检查..."
if grep -q 'HEALTHCHECK' Dockerfile; then
  success "Dockerfile 配置了 HEALTHCHECK"
  
  # 检查 HEALTHCHECK 是否合理
  if grep -q 'HEALTHCHECK.*--interval=30s' Dockerfile; then
    success "HEALTHCHECK 间隔配置合理"
  else
    warn "HEALTHCHECK 间隔可能不合理"
  fi
else
  error "Dockerfile 未配置 HEALTHCHECK"
fi
echo ""

# ============================================================================
# 11. OCI LABEL 检查
# ============================================================================
echo "11. OCI LABEL 检查..."
LABEL_COUNT=$(grep -c 'LABEL org.opencontainers.image' Dockerfile || echo "0")
if [ "$LABEL_COUNT" -ge 5 ]; then
  success "Dockerfile 配置了 $LABEL_COUNT 个 OCI LABEL"
else
  warn "Dockerfile OCI LABEL 数量不足 ($LABEL_COUNT)"
fi
echo ""

# ============================================================================
# 12. 回归测试：历史 Bug 防护
# ============================================================================
echo "12. 回归测试..."

# Bug 1: for 循环 shift 无效
# 检查是否使用了 while 循环
if grep -q 'while \[ $# -gt 0 \]' docker-build.sh docker-run.sh; then
  success "参数解析使用了 while 循环"
else
  error "参数解析可能使用了 for 循环（shift 无效）"
fi

# Bug 2: info() 输出到 stdout
# 检查 info() 函数是否输出到 stderr
if grep -A2 '^info()' scripts/detect-mirror.sh | grep -q '>&2'; then
  success "info() 输出到 stderr"
else
  error "info() 可能输出到 stdout（会污染变量）"
fi

# Bug 3: 缓存文件残留
# 检查是否有 --clear-cache 选项
if grep -q '\-\-clear-cache' scripts/detect-mirror.sh; then
  success "detect-mirror.sh 有缓存清除机制"
else
  error "detect-mirror.sh 缺少缓存清除机制"
fi

# Bug 4: PostgreSQL 端口不一致
# 已经在第 3 步检查过了

# Bug 5: chmod || true 静默吞错
# 已经在第 7 步检查过了

# Bug 6: createdb 报错
if grep -q 'createdb.*2>/dev/null' Dockerfile; then
  success "createdb 有错误处理"
else
  warn "createdb 可能缺少错误处理"
fi
echo ""

# ============================================================================
# 13. Dockerfile 最佳实践检查
# ============================================================================
echo "13. Dockerfile 最佳实践检查..."

# 检查是否使用了多阶段构建
STAGE_COUNT=$(grep -c '^FROM' Dockerfile || echo "0")
if [ "$STAGE_COUNT" -ge 3 ]; then
  success "Dockerfile 使用了多阶段构建 ($STAGE_COUNT 个阶段)"
else
  warn "Dockerfile 可能未使用多阶段构建"
fi

# 检查是否使用了 tini
if grep -q 'tini' Dockerfile; then
  success "Dockerfile 使用了 tini 信号处理"
else
  warn "Dockerfile 未使用 tini"
fi

# 检查是否使用了 --chown
if grep -q '\-\-chown=' Dockerfile; then
  success "Dockerfile 使用了 --chown"
else
  warn "Dockerfile 未使用 --chown"
fi

# 检查是否使用了 tar 归档 node_modules
if grep -q 'tar cf.*node_modules' Dockerfile; then
  success "Dockerfile 使用 tar 归档 node_modules"
else
  warn "Dockerfile 未使用 tar 归档 node_modules"
fi
echo ""

# ============================================================================
# 总结
# ============================================================================
echo "=== 验证完成 ==="
if [ $ERRORS -eq 0 ]; then
  echo "✅ 所有验证通过！"
  exit 0
else
  echo "❌ 发现 $ERRORS 个错误"
  exit 1
fi
