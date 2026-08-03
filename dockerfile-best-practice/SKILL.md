---
name: dockerfile-best-practice
description: 为 Node.js/Next.js 项目生成生产级 Docker 部署方案。当用户需要创建 Dockerfile、docker-compose、部署脚本、CI/CD 配置，或需要优化现有 Docker 构建时触发。覆盖多阶段构建、安全加固、镜像源适配（国内/国际）、健康检查、非 root 运行、Shell 脚本最佳实践。
---

# Dockerfile Best Practice

为 Node.js / Next.js 全栈项目提供生产级 Docker 部署方案。

## 何时使用

- 用户需要创建 Dockerfile（Node.js / Next.js / React 项目）
- 用户需要 docker-compose 编排（含数据库等服务）
- 用户需要 Docker 构建/运行/部署脚本
- 用户需要 CI/CD 中的 Docker 构建配置（GitHub Actions）
- 用户需要适配国内/国际不同网络环境的镜像源
- 用户需要优化现有 Dockerfile（安全、体积、缓存）
- 用户需要对 Docker 基础设施做验证测试

## 核心原则

> **Dockerfile 是程序，不是脚本。** 它应该有规范、有测试、有质量保证。

1. **多阶段构建**：deps → builder → runner，最终镜像只含运行必需文件
2. **安全第一**：非 root 运行、不硬编码密码、最小权限
3. **环境自适应**：镜像源自动检测，一套 Dockerfile 适配国内/国际
4. **可验证**：提供验证脚本，覆盖所有已知坑点
5. **Shell 脚本纪律**：while 循环解析参数、日志到 stderr、不静默吞错

## 操作步骤

### Step 1: 确定项目特征

先读取项目根目录的 `package.json`，确认：
- 框架类型（Next.js / Vite / Express / 其他）
- 包管理器（pnpm / npm / yarn）
- 是否有数据库（PostgreSQL / MongoDB / 其他）
- 构建命令（build script）
- 启动命令（start script）

### Step 2: 生成 Dockerfile

参照 `references/dockerfile-specification.md` 中的规范生成 Dockerfile。

**必须包含的要素**：
- [ ] OCI 标准 LABEL（title, version, created, revision）
- [ ] 多阶段构建（至少 deps + builder + runner）
- [ ] 基础镜像使用 `-slim` 版本
- [ ] 层缓存优化（package.json 先于源码 COPY）
- [ ] 大目录 tar 归档（node_modules 超 1000 文件时必须）
- [ ] HEALTHCHECK 配置
- [ ] 非 root 用户运行
- [ ] apt 缓存清理（`rm -rf /var/lib/apt/lists/*`）
- [ ] `--no-install-recommends` 减少依赖

**如果项目含数据库**（如 PostgreSQL 内嵌容器）：
- [ ] 端口一致性（Dockerfile / entrypoint / run 脚本统一）
- [ ] 数据库初始化在 entrypoint 中完成
- [ ] 使用 Unix socket peer 认证，避免 TCP 密码认证

### Step 3: 生成镜像源适配（如需国内部署）

如果项目需要在中国大陆部署，生成 `scripts/detect-mirror.sh`：

```
用法: detect-mirror.sh [--force-cn|--force-global|--clear-cache]
```

**关键规范**：
- 日志输出到 stderr（`>&2`），只有返回值到 stdout
- 支持缓存机制 + `--clear-cache` 清除
- 检测方式：`curl -s --max-time 3` 访问国内镜像 ping 端点
- 配置范围：npm registry、apt 源、corepack registry

在 Dockerfile 中调用：
```dockerfile
ARG DEPLOY_REGION=auto
COPY scripts/detect-mirror.sh /tmp/
RUN if [ "${DEPLOY_REGION}" = "cn" ] || [ "${DEPLOY_REGION}" = "global" ]; then \
      bash /tmp/detect-mirror.sh --force-${DEPLOY_REGION}; \
    else \
      bash /tmp/detect-mirror.sh; \
    fi
```

### Step 4: 生成 entrypoint 脚本

如果项目含数据库或需要启动前初始化：

**关键规范**：
- `set -euo pipefail` 严格模式
- 数据库启动后轮询等待就绪（`pg_isready` / `mongosh --eval`）
- 数据库已存在时优雅处理（`2>/dev/null || echo "already exists"`）
- 最后用 `exec su -s /bin/bash node -c "exec ..."` 切换到非 root 用户
- 禁止 `|| true` 静默吞错（除了明确的"已存在"场景）

### Step 5: 生成构建/运行脚本

**docker-build.sh** 和 **docker-run.sh** 必须遵循：

**参数解析**（CRITICAL）：
```bash
# 必须用 while 循环，禁止 for 循环
while [ $# -gt 0 ]; do
  case $1 in
    --option=*)  VALUE="${1#*=}"; shift ;;
    --option)    VALUE="$2"; shift 2 ;;
    *)           echo "未知参数: $1" >&2; exit 1 ;;
  esac
done
```

**原因**：`for arg in "$@"` 在循环开始时已捕获所有参数，`shift` 只影响位置参数 `$1/$2`，不影响 `for` 迭代。

**构建脚本预检**：
- 磁盘空间检查（≥ 5GB）
- Docker 服务状态检查
- Dockerfile / .dockerignore 存在性检查

**运行脚本预检**：
- 镜像存在性检查
- 环境变量文件查找（.env.local → .env → 手动传入）
- 网络存在性检查
- 部署后 Smoke 测试

### Step 6: 生成 docker-compose（如需要）

参照 `references/docker-compose-specification.md`。

### Step 7: 生成 .dockerignore

```
node_modules
.next
.git
.github
*.md
.env*
Dockerfile*
docker-compose*
docker-*.sh
```

### Step 8: 生成验证脚本

参照 `references/validation-checklist.md`，生成 `scripts/validate-docker.sh`，覆盖：
- Shell 脚本语法检查
- 项目名一致性
- 端口一致性
- 参数解析正确性
- 非 root 运行配置
- 镜像源检测逻辑
- 错误处理模式
- HEALTHCHECK 配置
- OCI LABEL 完整性

### Step 9: 生成 CI/CD 配置（如需要）

GitHub Actions 双模式：
- **Mode A**（服务器构建）：SSH 到服务器，`docker build` + `docker run`
- **Mode B**（GHA 构建）：GitHub Actions 构建 → push 到 ghcr.io → 服务器 pull + run

## 已知坑点（必读）

详见 `references/pitfalls.md`。以下是最常见的 5 个：

1. **Shell 参数解析用 while 不用 for** — `for` 循环中 `shift` 无效
2. **日志输出到 stderr** — stdout 被 `$()` 捕获会污染变量
3. **缓存要提供清除机制** — 残留缓存导致检测结果错误
4. **配置项单一定义** — 多处配置（端口/路径）不一致是高频 bug
5. **`export` 不跨 RUN 持久化** — 每个 Dockerfile RUN 是独立 shell
6. **tar 解压用 `--no-same-owner`** — 否则文件属主是 root
7. **禁止 `|| true` 静默吞错** — 用 `if [ -f ... ]` 条件判断替代

## 资源索引

- `references/dockerfile-specification.md`: Dockerfile 编写规范（多阶段构建、安全、性能、健康检查、端口、错误处理、参数解析、日志）— 生成 Dockerfile 时必读
- `references/pitfalls.md`: 已知坑点与解决方案（7 大类 16 个坑）— Review 时必读
- `references/validation-checklist.md`: 验证检查清单（13+ 项检查）— 生成验证脚本时必读
- `references/docker-compose-specification.md`: docker-compose 编排规范 — 生成 compose 文件时必读
- `references/ci-cd-patterns.md`: CI/CD 双模式部署模板（GitHub Actions）— 生成 workflow 时必读
- `scripts/detect-mirror.sh`: 镜像源自动检测脚本模板 — 需要国内/国际适配时直接复制
- `scripts/validate-docker.sh`: 验证脚本模板 — 交付前运行，确保无遗漏
- `assets/Dockerfile.template`: Dockerfile 模板（Next.js + PostgreSQL）— 基础模板
- `assets/docker-entrypoint.template`: entrypoint 脚本模板 — 含数据库的项目使用
- `assets/.dockerignore.template`: .dockerignore 模板
