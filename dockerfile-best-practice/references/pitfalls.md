# 已知坑点与解决方案

> 来源：LionetRides 项目 5 轮 Docker Review 实战总结

## 坑 1：Shell 参数解析 — for 循环中 shift 无效

**现象**：`--region cn` 语法失败，报 "未知参数: cn"

**原因**：`for arg in "$@"` 在循环开始时已捕获所有参数列表，`shift` 只修改位置参数 `$1/$2`，不影响 `for` 的迭代变量。

**解决**：
```bash
# 错误
for arg in "$@"; do
  case $arg in
    --region) DEPLOY_REGION="$2"; shift ;;  # shift 无效！
  esac
done

# 正确
while [ $# -gt 0 ]; do
  case $1 in
    --region=*)  DEPLOY_REGION="${1#*=}"; shift ;;
    --region)    DEPLOY_REGION="$2"; shift 2 ;;
  esac
done
```

## 坑 2：函数日志输出到 stdout 污染变量

**现象**：`region=$(detect_region)` 得到多行文本而非纯 "cn"/"global"

**原因**：函数内的 `info()` / `ok()` 用 `echo` 输出到 stdout，被 `$()` 捕获。

**解决**：
```bash
# 错误
info() { echo "[INFO] $1"; }
detect_region() { info "detecting..."; echo "cn"; }

# 正确
info() { echo "[INFO] $1" >&2; }  # 日志到 stderr
detect_region() { info "detecting..."; echo "cn"; }  # 只有返回值到 stdout
```

## 坑 3：缓存文件残留导致检测结果错误

**现象**：修复了日志输出 bug 后，脚本仍返回错误结果

**原因**：`/tmp/.mirror_detected` 缓存了 bug 版本的错误结果，脚本读缓存跳过检测。

**解决**：
- 缓存机制必须提供清除方式（`--clear-cache`）
- 缓存文件应包含版本标识，版本变更时自动失效

## 坑 4：配置项多处定义不一致

**现象**：容器启动卡死在等待 PostgreSQL 就绪

**原因**：Dockerfile 初始化 PG 用默认端口 5432，entrypoint 检查端口 5433。

**解决**：
- 配置项只在一处定义（Dockerfile ENV），其他地方引用环境变量
- 验证脚本中增加一致性检查

## 坑 5：`|| true` 静默吞错

**现象**：文件不存在时构建继续，但运行时 404

**原因**：`chmod ... || true` 忽略了所有错误，包括真正的错误。

**解决**：
```bash
# 错误
RUN chmod +x entrypoint.sh || true

# 正确
RUN if [ -f entrypoint.sh ]; then chmod +x entrypoint.sh; fi
```

唯一允许的 `|| true` 场景：明确的"已存在"错误（如 `createdb mydb 2>/dev/null || echo "already exists"`）。

## 坑 6：tar 解压后文件属主是 root

**现象**：非 root 用户无法访问解压后的文件

**原因**：tar 解压默认保留归档中的属主信息（root）。

**解决**：
```dockerfile
RUN tar xf /tmp/node_modules.tar -C /app --no-same-owner
```

## 坑 7：export 不跨 RUN 持久化

**现象**：`COREPACK_REGISTRY` 设置后，下一个 RUN 命令看不到

**原因**：Dockerfile 每个 RUN 指令都是一个新的 shell，`export` 只影响当前 shell。

**解决**：
```dockerfile
# 错误
RUN export COREPACK_REGISTRY=https://mirror.example.com
RUN pnpm install  # 看不到上面的环境变量

# 正确：使用 ENV 或合并到同一 RUN
ENV COREPACK_REGISTRY=https://mirror.example.com
RUN pnpm install

# 或
RUN export COREPACK_REGISTRY=https://mirror.example.com && pnpm install
```

## 坑 8：--force-auto 无效参数

**现象**：`detect-mirror.sh --force-auto` 报错

**原因**：Dockerfile 中 `--force-${DEPLOY_REGION}` 当 `DEPLOY_REGION=auto` 时展开为 `--force-auto`，但脚本只支持 `--force-cn` 和 `--force-global`。

**解决**：
```dockerfile
# 错误
RUN bash /tmp/detect-mirror.sh --force-${DEPLOY_REGION}

# 正确
RUN if [ "${DEPLOY_REGION}" = "cn" ] || [ "${DEPLOY_REGION}" = "global" ]; then \
      bash /tmp/detect-mirror.sh --force-${DEPLOY_REGION}; \
    else \
      bash /tmp/detect-mirror.sh; \
    fi
```

## 坑 9：PostgreSQL 使用 TCP 密码认证

**现象**：entrypoint 中 `psql` 连接失败

**原因**：默认配置下 PostgreSQL 需要密码认证，但容器内未设置密码。

**解决**：使用 Unix socket + peer 认证：
```bash
# 正确：通过 su 切换用户，使用 peer 认证
su - postgres -c "psql -c \"SELECT 1;\""

# 错误：TCP 连接需要密码
psql -h localhost -U postgres -c "SELECT 1;"
```

## 坑 10：写完不验证就推送

**现象**：CI/CD workflow 有语法错误，GitHub Actions 执行失败

**教训**：
- Shell 脚本：`bash -n script.sh` 语法检查
- YAML 文件：`yamllint` 验证
- Dockerfile：`docker build --check`（如有）
- 推送前必须运行验证脚本
