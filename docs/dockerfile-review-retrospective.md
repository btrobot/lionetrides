# Dockerfile Review 复盘总结

> 本文档记录了 LionetRides 项目 Dockerfile 及相关脚本的五轮 Review 过程，包括遇到的问题、做出的决策、做得好的地方以及踩到的坑。

## 一、背景

LionetRides 是一个 B2B 游乐设施制造企业官网项目，使用 Next.js 16 + TypeScript + PostgreSQL 技术栈。项目需要支持两种部署模式：

- **Mode A（手动）**：在中国服务器上直接构建 Docker 镜像
- **Mode B（自动）**：在 GitHub Actions 中构建镜像，推送到 ghcr.io，服务器拉取运行

由于两种模式的网络环境不同（国内 vs 国际），Dockerfile 需要支持镜像源自动检测，同时遵循 GitHub CI/CD 最佳实践。

## 二、遇到的问题

### 2.1 第一轮 Review

| # | 问题 | 影响 | 根因 |
|---|------|------|------|
| 1 | 项目名拼写错误 "Lion E-Trides" | 元数据错误 | 复制粘贴错误 |
| 2 | `COREPACK_REGISTRY` 硬编码腾讯云镜像 | Mode B 构建时多一次跨境请求 | 未考虑双模式场景 |
| 3 | PostgreSQL 端口不一致（Dockerfile 初始化 5432，entrypoint 检查 5433） | 容器启动可能卡死 | 配置未同步 |
| 4 | `chmod ... \|\| true` 静默吞错 | 生产环境可能 404 | 错误处理不当 |
| 5 | tar 解压后需要额外 `chown` 层 | 构建时间增加 | 未使用 `--no-same-owner` |

### 2.2 第二轮 Review

| # | 问题 | 影响 | 根因 |
|---|------|------|------|
| 6 | 容器以 root 运行 | 安全风险 | 未添加 `USER` 指令 |
| 7 | 密码硬编码无说明 | 生产环境密码泄露风险 | 缺少文档说明 |
| 8 | 文件权限不正确 | 非 root 用户无法访问 | 未设置正确的属主 |

### 2.3 第三轮 Review

| # | 问题 | 影响 | 根因 |
|---|------|------|------|
| 9 | docker-build.sh/docker-run.sh 项目名拼写错误 | 脚本输出不一致 | 复制粘贴错误 |

### 2.4 第四轮 Review

| # | 问题 | 影响 | 根因 |
|---|------|------|------|
| 10 | **参数解析 bug**：`for` 循环中 `shift` 无效 | `--region cn` 语法失败 | Shell 脚本基础不牢 |

**详细说明**：

```bash
# 错误写法（bug）
for arg in "$@"; do
  case $arg in
    --region) DEPLOY_REGION="$2"; shift ;;  # shift 无效！
  esac
done

# 正确写法
while [ $# -gt 0 ]; do
  case $1 in
    --region)   DEPLOY_REGION="$2"; shift 2 ;;  # 正确跳过两个参数
    --region=*) DEPLOY_REGION="${1#*=}"; shift ;;
  esac
done
```

**原因**：`for` 循环在开始时已经捕获了所有参数，`shift` 只影响位置参数 `$1`、`$2` 等，不影响 `for` 循环的迭代。

### 2.5 第五轮 Review

| # | 问题 | 影响 | 根因 |
|---|------|------|------|
| 11 | `--force-auto` 无效参数 | detect-mirror.sh 无法识别 | 参数传递逻辑错误 |
| 12 | `npx tsup` 与项目包管理器不一致 | 可能使用错误的包管理器 | 未统一命令风格 |
| 13 | `createdb` 数据库已存在时报错 | 构建失败 | 缺少错误处理 |
| 14 | 宿主机 `node_modules` 检查冗余 | 不必要的 `pnpm install` | 未理解 Docker 构建流程 |
| 15 | `psql` 依赖 TCP 密码认证 | 可能连接失败 | 未考虑认证方式 |
| 16 | 第二个 sed 命令冗余 | 代码冗余 | 未仔细分析逻辑 |

## 三、做出的决策

### 3.1 架构决策

| 决策 | 理由 | 替代方案 |
|------|------|----------|
| 多阶段构建 (deps → builder → runner) | 减小最终镜像体积，分离依赖安装和构建 | 单阶段构建 |
| tar 归档 node_modules | 避免 COPY 数万小文件导致超时 | 直接 COPY node_modules |
| 镜像源自动检测 | 支持国内/国际两种环境 | 硬编码镜像源 |
| 非 root 运行 (node 用户) | 最小权限原则，提高安全性 | root 运行 |
| PostgreSQL 端口 5433 | 避免与宿主机 5432 冲突 | 使用默认 5432 |
| HEALTHCHECK 配置 | 容器健康检查，便于编排 | 无健康检查 |
| OCI LABEL 元数据 | 标准化镜像元数据 | 无元数据 |
| tini 信号处理 | 优雅关闭，正确处理 SIGTERM | 直接运行 node |
| 双模式部署 | 支持手动和自动两种部署方式 | 单一部署模式 |
| while 循环参数解析 | 正确处理 `shift` | for 循环 |

### 3.2 技术决策

| 决策 | 理由 | 替代方案 |
|------|------|----------|
| `--chown=node:node` 设置文件属主 | 确保非 root 用户可访问 | `chmod -R 777` |
| `--no-same-owner` 解压 tar | 避免额外 chown 层 | 解压后 chown |
| `su - postgres -c "psql ..."` | 使用 Unix socket，peer 认证 | TCP 连接 + 密码认证 |
| `pnpm exec tsup` | 与项目包管理器一致 | `npx tsup` |
| `createdb ... 2>/dev/null \|\| true` | 忽略数据库已存在错误 | 检查数据库是否存在 |

## 四、做得好的地方

### 4.1 架构设计

1. **多阶段构建**：有效减小最终镜像体积，分离关注点
2. **tar 归档 node_modules**：巧妙解决 COPY 超时问题，从 O(n) 优化为 O(1)
3. **镜像源自动检测**：`detect-mirror.sh` 脚本支持自动检测国内/国际环境，零配置
4. **双模式部署**：Mode A（服务器构建）和 Mode B（GitHub Actions 构建）共存，灵活适配不同场景
5. **非 root 运行**：应用进程以 `node` 用户运行，符合最小权限原则

### 4.2 最佳实践

1. **HEALTHCHECK**：每 30 秒检测 `/api/v1/products`，便于容器编排
2. **OCI LABEL**：完整的元数据标注，包括版本、构建时间、Git commit 等
3. **tini 信号处理**：正确处理 SIGTERM，优雅关闭应用
4. **.dockerignore**：排除不必要的文件，减小构建上下文
5. **注释说明**：关键配置都有注释说明，便于维护

### 4.3 Review 过程

1. **五轮 Review**：逐行扫描，不放过任何细节
2. **问题分类**：将问题分为严重、中等、细节三个级别
3. **验证测试**：每轮修复后都运行测试验证
4. **文档记录**：详细记录每轮修复的问题和决策

## 五、踩到的坑

### 5.1 Shell 脚本相关

#### 坑 1：`for` 循环中 `shift` 无效

**现象**：`--region cn` 语法失败，报 "未知参数: cn"

**原因**：`for arg in "$@"` 在循环开始时已经捕获了所有参数，`shift` 只影响位置参数 `$1`、`$2` 等，不影响 `for` 循环的迭代。

**解决**：改用 `while [ $# -gt 0 ]` 循环，`shift` 可以正确跳过参数。

**教训**：Shell 脚本的参数解析要用 `while` 循环，不要用 `for` 循环。

#### 坑 2：`info()` 输出到 stdout 污染变量

**现象**：`detect-mirror.sh` 检测为 "Global"，但实际是国内环境

**原因**：`info()` 和 `ok()` 函数用 `echo` 输出到 stdout，被 `region=$(detect_region)` 的 `$()` 捕获，导致 `region` 变量值为多行文本而非纯 "cn"/"global"。

**解决**：所有日志输出重定向到 stderr（`>&2`），只有 `echo "cn"` / `echo "global"` 保留 stdout。

**教训**：函数的日志输出应该到 stderr，只有返回值到 stdout。

#### 坑 3：缓存文件残留导致检测结果错误

**现象**：修复了 `info()` 输出问题后，脚本仍显示 "Global"

**原因**：`/tmp/.mirror_detected` 缓存了之前 bug 版本的错误检测结果 "global"，脚本读到缓存直接跳过实际检测。

**解决**：新增 `--clear-cache` 选项，删除缓存标记后重新检测。

**教训**：缓存机制要考虑缓存失效的场景，提供清除缓存的方式。

### 5.2 Docker 相关

#### 坑 4：PostgreSQL 端口不一致

**现象**：容器启动卡死在等待 PostgreSQL 就绪

**原因**：Dockerfile 初始化 PostgreSQL 使用默认端口 5432，但 entrypoint 检查端口 5433。

**解决**：在 Dockerfile 中修改 `postgresql.conf`，将端口改为 5433。

**教训**：配置项要在一个地方定义，其他地方引用，避免多处配置不一致。

#### 坑 5：`chmod ... || true` 静默吞错

**现象**：文件不存在时构建继续，但权限可能不对

**原因**：`|| true` 会忽略所有错误，包括真正的错误。

**解决**：改用 `if [ -f ... ]; then chmod ...; fi` 条件判断。

**教训**：不要用 `|| true` 静默吞错，要明确处理错误场景。

#### 坑 6：tar 解压后文件属主是 root

**现象**：非 root 用户无法访问文件

**原因**：tar 解压时保留原始属主（root），非 root 用户无法访问。

**解决**：使用 `--no-same-owner` 参数，解压后文件属主为当前用户。

**教训**：tar 解压要注意属主问题，使用 `--no-same-owner` 或后续 chown。

#### 坑 7：`export` 在 RUN 命令中不持久

**现象**：`COREPACK_REGISTRY` 设置后，下一个 RUN 命令看不到

**原因**：每个 RUN 命令都是一个新的 shell，`export` 只影响当前 shell。

**解决**：将 `export` 和使用它的命令放在同一个 RUN 命令中。

**教训**：Dockerfile 中每个 RUN 命令都是独立的 shell，环境变量不跨 RUN 持久化。

### 5.3 流程相关

#### 坑 8：写完不测试就推送

**现象**：推送的 workflow 文件有语法错误，GitHub Actions 执行失败

**原因**：没有验证 YAML 语法和 workflow 逻辑就推送。

**解决**：使用 `yamllint` 验证 YAML 语法，仔细检查 workflow 逻辑。

**教训**：推送前一定要验证，尤其是 CI/CD 配置文件。

#### 坑 9：多次 Review 才发现问题

**现象**：五轮 Review 才修复所有问题

**原因**：每轮 Review 只关注特定类型的问题，没有全面检查。

**解决**：每轮 Review 都全面检查，不放过任何细节。

**教训**：Review 要彻底，不要分多轮，一次性检查所有问题。

## 六、经验总结

### 6.1 Shell 脚本最佳实践

1. **参数解析用 `while` 循环**，不要用 `for` 循环
2. **日志输出到 stderr**，只有返回值到 stdout
3. **缓存机制要考虑失效场景**，提供清除缓存的方式
4. **不要用 `|| true` 静默吞错**，要明确处理错误
5. **使用 `set -euo pipefail`**，尽早发现错误

### 6.2 Docker 最佳实践

1. **多阶段构建**，减小最终镜像体积
2. **非 root 运行**，符合最小权限原则
3. **HEALTHCHECK**，便于容器编排
4. **OCI LABEL**，标准化元数据
5. **.dockerignore**，减小构建上下文
6. **配置项集中管理**，避免多处配置不一致
7. **每个 RUN 命令都是独立的 shell**，环境变量不跨 RUN 持久化

### 6.3 Review 最佳实践

1. **逐行扫描**，不放过任何细节
2. **问题分类**，区分严重、中等、细节
3. **验证测试**，每轮修复后都运行测试
4. **文档记录**，详细记录问题和决策
5. **一次性检查所有问题**，不要分多轮

## 七、最终成果

经过五轮 Review，Dockerfile 及相关脚本已达到生产就绪状态：

| 检查项 | 状态 |
|--------|------|
| Dockerfile 语法 | ✅ |
| 所有 shell 脚本语法 | ✅ |
| TypeScript 类型检查 | ✅ 零错误 |
| 单元测试 213 | ✅ 全部通过 |
| 项目名拼写 | ✅ 统一 "LionetRides" |
| PostgreSQL 端口 | ✅ 5433 一致 |
| 非 root 运行 | ✅ node 用户 |
| 镜像源自动检测 | ✅ 国内/国际自适应 |
| 参数解析 | ✅ while 循环 + shift |
| 双模式部署 | ✅ Mode A + Mode B |

## 八、参考资料

- [Docker 最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Shell 脚本参数解析](https://www.gnu.org/software/bash/manual/html_node/Shell-Parameter-Expansion.html)
- [GitHub Actions 工作流语法](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [OCI 镜像规范](https://github.com/opencontainers/image-spec)

---

**文档版本**：v1.0  
**最后更新**：2026-03-09  
**作者**：LionetRides Team
