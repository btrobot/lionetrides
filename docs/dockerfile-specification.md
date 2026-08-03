# Dockerfile 编写规范

> **核心理念**：Dockerfile 是程序，不是脚本。它应该有规范、有测试、有质量保证。

---

## 一、基本结构规范

### 1.1 必须包含的元数据

```dockerfile
# 项目信息
ARG PROJECT_NAME="项目名称"
ARG PROJECT_VERSION="1.0.0"

# OCI 标准标签（必须）
LABEL org.opencontainers.image.title="${PROJECT_NAME}"
LABEL org.opencontainers.image.description="项目描述"
LABEL org.opencontainers.image.version="${PROJECT_VERSION}"
LABEL org.opencontainers.image.authors="作者"
LABEL org.opencontainers.image.source="源码仓库"
LABEL org.opencontainers.image.vendor="公司/组织"
LABEL org.opencontainers.image.licenses="许可证"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
```

**为什么**：OCI 标签是容器镜像的标准元数据，便于追踪和管理。

### 1.2 基础镜像选择

```dockerfile
# ✅ 正确：使用 slim 版本，减小镜像体积
FROM node:24-bookworm-slim AS deps

# ❌ 错误：使用完整版本，体积过大
FROM node:24 AS deps
```

**规范**：
- 优先使用 `-slim` 或 `-alpine` 版本
- 固定主版本号（如 `node:24`），避免使用 `latest`
- 记录选择理由（注释）

---

## 二、多阶段构建规范

### 2.1 标准三阶段结构

```dockerfile
# 阶段 1: 依赖安装
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 阶段 2: 构建
FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 阶段 3: 运行
FROM node:24-bookworm-slim AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/index.js"]
```

**规范**：
- **必须**使用多阶段构建（至少 2 阶段）
- 每个阶段有明确的职责
- 最终阶段只包含运行必需的文件

### 2.2 阶段命名规范

```dockerfile
# ✅ 正确：语义化命名
FROM node:24 AS deps      # 依赖安装
FROM node:24 AS builder   # 构建
FROM node:24 AS runner    # 运行

# ❌ 错误：无意义命名
FROM node:24 AS stage1
FROM node:24 AS build
```

---

## 三、国内特殊环境规范

### 3.1 镜像源自动检测

**问题**：国内访问 npm/Debian 官方源慢，但硬编码国内镜像在国外环境也慢。

**解决方案**：自动检测 + 手动覆盖

```dockerfile
# 构建参数
ARG DEPLOY_REGION=auto  # auto | cn | global

# 复制检测脚本
COPY scripts/detect-mirror.sh /tmp/detect-mirror.sh

# 运行检测（自动或手动指定）
RUN if [ "${DEPLOY_REGION}" = "cn" ] || [ "${DEPLOY_REGION}" = "global" ]; then \
      bash /tmp/detect-mirror.sh --force-${DEPLOY_REGION}; \
    else \
      bash /tmp/detect-mirror.sh; \
    fi
```

**检测脚本职责**：
1. 检测网络环境（国内/国际）
2. 配置 npm 镜像源
3. 配置 apt 镜像源
4. 配置 corepack 镜像源
5. 支持缓存和清除缓存

**规范**：
- **必须**支持自动检测
- **必须**支持手动覆盖（`--force-cn` / `--force-global`）
- **必须**支持缓存清除（`--clear-cache`）
- 日志输出到 stderr，返回值输出到 stdout

### 3.2 镜像源配置清单

| 工具 | 国内镜像 | 国际源 |
|------|---------|--------|
| npm | `https://mirrors.cloud.tencent.com/npm` | `https://registry.npmjs.org` |
| apt | `https://mirrors.ustc.edu.cn/debian` | `http://deb.debian.org/debian` |
| corepack | `https://mirrors.cloud.tencent.com/npm` | `https://registry.npmjs.org` |

---

## 四、安全规范

### 4.1 非 root 运行

```dockerfile
# ✅ 正确：切换到非 root 用户
USER node
CMD ["node", "dist/index.js"]

# ❌ 错误：以 root 运行
CMD ["node", "dist/index.js"]
```

**规范**：
- **必须**以非 root 用户运行应用
- 如果需要在 entrypoint 中执行特权操作（如启动数据库），在 entrypoint 内部切换用户
- 文件权限使用 `--chown` 而非 `chmod 777`

### 4.2 密码和密钥管理

```dockerfile
# ✅ 正确：使用环境变量，提供默认值说明
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5433/mydb
# 注意：生产环境必须通过 --env-file 覆盖此默认值

# ❌ 错误：硬编码密码
ENV DATABASE_URL=postgresql://postgres:mypassword@localhost:5433/mydb
```

**规范**：
- **禁止**在 Dockerfile 中硬编码真实密码
- 可以提供默认值，但**必须**有注释说明生产环境需要覆盖
- 敏感信息通过 `--env-file` 或 Docker secrets 传入

### 4.3 最小权限原则

```dockerfile
# ✅ 正确：精确控制权限
COPY --chown=node:node . .
RUN chmod 755 entrypoint.sh

# ❌ 错误：过度授权
RUN chmod -R 777 /app
```

---

## 五、性能规范

### 5.1 层缓存优化

```dockerfile
# ✅ 正确：先复制不常变化的文件
COPY package*.json ./
RUN npm ci

# 再复制经常变化的文件
COPY . .
```

**规范**：
- 不常变化的文件（package.json）放在前面
- 经常变化的文件（源码）放在后面
- 利用 Docker 层缓存加速构建

### 5.2 大目录处理

**问题**：`COPY node_modules` 会复制数万个小文件，导致构建超时。

**解决方案**：使用 tar 归档

```dockerfile
# 阶段 1: 打包
RUN tar cf /tmp/node_modules.tar node_modules

# 阶段 2: 复制和解压
COPY --from=deps /tmp/node_modules.tar /tmp/
RUN tar xf /tmp/node_modules.tar -C /app --no-same-owner && \
    rm /tmp/node_modules.tar
```

**规范**：
- 超过 1000 个文件的目录**必须**使用 tar 归档
- 使用 `--no-same-owner` 避免权限问题
- 及时清理临时文件

### 5.3 镜像体积优化

```dockerfile
# ✅ 正确：清理缓存
RUN apt-get update && \
    apt-get install -y --no-install-recommends package && \
    rm -rf /var/lib/apt/lists/*

# ❌ 错误：不清理缓存
RUN apt-get update && apt-get install -y package
```

**规范**：
- 安装系统包后**必须**清理 apt 缓存
- 使用 `--no-install-recommends` 减少不必要的依赖
- 合并 RUN 指令减少层数

---

## 六、健康检查规范

### 6.1 必须配置 HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

**规范**：
- **必须**配置 HEALTHCHECK
- 间隔：30s - 60s
- 超时：5s - 15s
- 启动期：30s - 120s（根据应用启动时间）
- 重试次数：3 - 5

### 6.2 健康检查端点

```javascript
// ✅ 正确：专门的健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ❌ 错误：使用业务端点
app.get('/', (req, res) => {
  res.send('Hello World');
});
```

**规范**：
- 健康检查端点应该轻量级
- 可以检查数据库连接等关键依赖
- 返回 JSON 格式的状态信息

---

## 七、端口配置规范

### 7.1 端口一致性

```dockerfile
# Dockerfile
ENV PORT=3000
EXPOSE 3000

# docker-entrypoint.sh
# 使用环境变量
exec node dist/server.js --port ${PORT}

# docker-run.sh
# 默认端口
PORT="${PORT:-3000}"
docker run -p ${PORT}:${PORT} ...
```

**规范**：
- Dockerfile、entrypoint、run 脚本的端口**必须**一致
- 使用环境变量配置端口，不要硬编码
- 文档中明确说明端口配置

### 7.2 数据库端口

```dockerfile
# Dockerfile
ENV PGPORT=5433

# docker-entrypoint.sh
# 检查端口
su - postgres -c "pg_isready -p ${PGPORT:-5433}"

# 配置 PostgreSQL
sed -i "s/^#port = 5432/port = ${PGPORT:-5433}/" postgresql.conf
```

**规范**：
- 数据库端口配置**必须**集中管理
- 所有相关脚本使用相同的端口
- 避免多处配置导致不一致

---

## 八、错误处理规范

### 8.1 禁止静默吞错

```bash
# ✅ 正确：明确处理错误
if ! command -v psql &> /dev/null; then
  echo "Error: psql not found" >&2
  exit 1
fi

# ❌ 错误：静默吞错
command -v psql || true
```

**规范**：
- **禁止**使用 `|| true` 静默吞错
- 错误必须明确处理或上报
- 使用 `set -euo pipefail` 严格模式

### 8.2 数据库初始化错误处理

```bash
# ✅ 正确：处理数据库已存在的情况
createdb mydb 2>/dev/null || echo "Database already exists"

# ❌ 错误：不处理错误
createdb mydb
```

---

## 九、参数解析规范

### 9.1 使用 while 循环

```bash
# ✅ 正确：使用 while 循环
while [ $# -gt 0 ]; do
  case $1 in
    --region=*)    DEPLOY_REGION="${1#*=}"; shift ;;
    --region)      DEPLOY_REGION="$2"; shift 2 ;;
    *)             echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# ❌ 错误：使用 for 循环（shift 无效）
for arg in "$@"; do
  case $arg in
    --region) DEPLOY_REGION="$2"; shift ;;  # shift 无效！
  esac
done
```

**规范**：
- **必须**使用 `while` 循环解析参数
- 支持 `--option=value` 和 `--option value` 两种格式
- 未知参数必须报错退出

---

## 十、日志规范

### 10.1 输出到正确的流

```bash
# ✅ 正确：日志到 stderr，返回值到 stdout
info() { echo "[INFO] $*" >&2; }
ok() { echo "[OK] $*" >&2; }

detect_region() {
  info "Detecting region..."
  echo "cn"  # 只有返回值到 stdout
}

# ❌ 错误：日志到 stdout
info() { echo "[INFO] $*"; }  # 会污染返回值
```

**规范**：
- 日志信息输出到 **stderr**
- 函数返回值输出到 **stdout**
- 避免日志污染返回值

---

## 十一、文档规范

### 11.1 注释规范

```dockerfile
# ✅ 正确：解释为什么
# 使用 tar 归档避免 COPY 数万个小文件导致超时
RUN tar cf /tmp/node_modules.tar node_modules

# ❌ 错误：描述做了什么
# 创建 tar 文件
RUN tar cf /tmp/node_modules.tar node_modules
```

**规范**：
- 注释解释**为什么**，不是**做了什么**
- 关键决策必须有注释
- 特殊处理必须有说明

### 11.2 README 规范

每个 Docker 相关文件应该有 README 说明：
- 用途
- 使用方法
- 参数说明
- 注意事项

---

## 十二、测试规范

### 12.1 必须包含的测试

1. **语法检查**：`bash -n script.sh`
2. **参数解析测试**：验证各种参数格式
3. **配置一致性测试**：端口、路径等
4. **回归测试**：历史 bug 防护
5. **最佳实践检查**：多阶段、非 root、HEALTHCHECK 等

### 12.2 测试脚本

```bash
#!/bin/bash
# scripts/validate-docker.sh

set -euo pipefail

echo "=== Docker 基础设施验证 ==="

# 1. 语法检查
bash -n docker-build.sh
bash -n docker-run.sh

# 2. 配置一致性
grep -q "PORT=3000" Dockerfile
grep -q "PORT=3000" docker-entrypoint.sh

# 3. 最佳实践
grep -q "HEALTHCHECK" Dockerfile
grep -q "USER node" Dockerfile

echo "✅ 所有验证通过"
```

---

## 十三、Review 检查清单

每次修改 Dockerfile 后，必须检查：

- [ ] 多阶段构建是否合理
- [ ] 是否使用非 root 用户
- [ ] HEALTHCHECK 是否配置
- [ ] OCI LABEL 是否完整
- [ ] 端口配置是否一致
- [ ] 密码是否硬编码
- [ ] 是否有 `|| true` 静默吞错
- [ ] 参数解析是否使用 while 循环
- [ ] 日志是否输出到 stderr
- [ ] 是否有注释说明关键决策
- [ ] 是否运行验证脚本

---

## 十四、版本控制规范

### 14.1 .dockerignore

**必须包含**：
```
node_modules
.next
.git
.github
*.md
!README.md
tests
docs
.env*
```

**规范**：
- 排除不必要的文件
- 减小构建上下文
- 避免敏感信息泄露

### 14.2 版本标签

```bash
# 语义化版本
docker build -t myapp:1.2.3 .

# Git commit
docker build -t myapp:$(git rev-parse --short HEAD) .

# 最新
docker build -t myapp:latest .
```

---

## 十五、总结

### 核心原则

1. **Dockerfile 是程序**：应该有规范、测试、质量保证
2. **安全第一**：非 root、密码管理、最小权限
3. **性能优先**：层缓存、tar 归档、镜像体积
4. **可维护性**：注释、文档、测试
5. **环境适配**：自动检测、手动覆盖

### 必须遵守的规范

| 类别 | 规范 | 优先级 |
|------|------|--------|
| 安全 | 非 root 运行 | 🔴 必须 |
| 安全 | 密码不硬编码 | 🔴 必须 |
| 性能 | 多阶段构建 | 🔴 必须 |
| 性能 | tar 归档大目录 | 🟡 推荐 |
| 质量 | HEALTHCHECK | 🔴 必须 |
| 质量 | OCI LABEL | 🟡 推荐 |
| 质量 | 验证脚本 | 🔴 必须 |
| 环境 | 镜像源自动检测 | 🔴 必须（国内项目） |
| 文档 | 注释说明 | 🟡 推荐 |
| 测试 | 回归测试 | 🔴 必须 |

---

## 附录：常见错误

### 错误 1：参数解析使用 for 循环

```bash
# ❌ 错误
for arg in "$@"; do
  case $arg in
    --region) DEPLOY_REGION="$2"; shift ;;  # shift 无效
  esac
done

# ✅ 正确
while [ $# -gt 0 ]; do
  case $1 in
    --region) DEPLOY_REGION="$2"; shift 2 ;;
  esac
done
```

### 错误 2：日志污染返回值

```bash
# ❌ 错误
detect_region() {
  echo "Detecting..."  # 污染返回值
  echo "cn"
}

# ✅ 正确
detect_region() {
  echo "Detecting..." >&2  # 日志到 stderr
  echo "cn"  # 返回值到 stdout
}
```

### 错误 3：静默吞错

```bash
# ❌ 错误
createdb mydb || true

# ✅ 正确
createdb mydb 2>/dev/null || echo "Database already exists"
```

### 错误 4：端口不一致

```dockerfile
# Dockerfile
ENV PORT=3000

# docker-entrypoint.sh
exec node server.js --port 5000  # ❌ 不一致
```

---

**最后更新**：2026-03-08  
**维护者**：开发团队  
**版本**：1.0.0
