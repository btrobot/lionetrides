# Docker 验证检查清单

> 基于 5 轮 Review 发现的所有问题设计，交付前必须全部通过。

## 1. Shell 脚本语法检查

```bash
for script in docker-build.sh docker-run.sh docker-entrypoint.sh scripts/detect-mirror.sh; do
  if [ -f "$script" ]; then
    bash -n "$script" && echo "OK: $script" || echo "FAIL: $script"
  fi
done
```

## 2. 项目名一致性

- 检查所有文件中项目名拼写是否统一
- Dockerfile LABEL、构建脚本、运行脚本、docker-compose 中的名称必须一致

## 3. 端口一致性

- Dockerfile `ENV PGPORT` / `ENV PORT`
- entrypoint 中 `pg_isready -p` 的端口
- run 脚本中 `-p` 映射的端口
- 三处必须一致

## 4. 参数解析测试

测试以下参数组合：
- `--region=cn` → 解析为 "cn"
- `--region cn` → 解析为 "cn"（两个参数）
- `--region=global` → 解析为 "global"
- 未知参数 → 报错退出

## 5. 非 root 运行

- Dockerfile 中有 `USER node` 或在 entrypoint 中 `su -s /bin/bash node`
- 文件属主使用 `--chown=node:node`

## 6. 镜像源检测

- Dockerfile 正确调用 detect-mirror.sh
- 不存在 `--force-${DEPLOY_REGION}`（会传 --force-auto）
- detect-mirror.sh 支持 `--clear-cache`
- detect-mirror.sh 日志输出到 stderr

## 7. 错误处理

- 不存在 `|| true` 静默吞错（除了"已存在"场景）
- 使用 `set -euo pipefail`
- 数据库初始化有 "already exists" 处理

## 8. HEALTHCHECK

- Dockerfile 中配置了 HEALTHCHECK
- 间隔/超时/启动期/重试次数在合理范围

## 9. OCI LABEL

- 包含 title、description、version、created、revision

## 10. 安全

- 无硬编码密码（或有注释说明默认值需覆盖）
- 无 `chmod 777`
- 无 `--privileged`

## 11. 性能

- 多阶段构建（至少 2 阶段）
- 层缓存优化（package.json 先于源码）
- apt 缓存清理（`rm -rf /var/lib/apt/lists/*`）
- `--no-install-recommends`

## 12. .dockerignore

- 排除 node_modules、.next、.git、.env*

## 13. tar 归档

- 大目录（node_modules）使用 tar 归档
- 解压使用 `--no-same-owner`
- 及时清理临时 tar 文件

## 验证脚本模板

```bash
#!/bin/bash
set -euo pipefail

ERRORS=0
error() { echo "FAIL: $1"; ERRORS=$((ERRORS + 1)); }
success() { echo "OK: $1"; }

# ... 逐项检查 ...

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "All checks passed!"
  exit 0
else
  echo "$ERRORS check(s) failed!"
  exit 1
fi
```
