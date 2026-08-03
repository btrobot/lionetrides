# Docker 基础设施测试方案

## 一、核心理念

**Dockerfile 和相关脚本是程序，不是脚本。**

它们应该有：
- ✅ 单元测试
- ✅ 集成测试
- ✅ 回归测试
- ✅ CI/CD Gate
- ✅ 代码质量检查

## 二、测试架构

```
tests/
├── docker/
│   ├── unit/                    # 单元测试
│   │   ├── test-detect-mirror.bats
│   │   ├── test-docker-build.bats
│   │   └── test-docker-run.bats
│   ├── integration/             # 集成测试
│   │   ├── test-dockerfile-build.sh
│   │   └── test-docker-image.sh
│   ├── regression/              # 回归测试
│   │   └── test-regression.sh
│   └── fixtures/                # 测试数据
│       └── test-env.sh
├── scripts/
│   └── run-docker-tests.sh      # 测试入口脚本
└── .github/workflows/
    └── docker-tests.yml         # CI/CD 工作流
```

## 三、测试类型

### 3.1 单元测试 (Unit Tests)

使用 [bats](https://github.com/bats-core/bats-core) (Bash Automated Testing System) 测试 shell 脚本。

**测试内容：**
- `detect-mirror.sh`：参数解析、环境检测、缓存逻辑
- `docker-build.sh`：参数解析、构建逻辑
- `docker-run.sh`：参数解析、运行逻辑
- `docker-entrypoint.sh`：启动逻辑、用户切换

**示例：**
```bash
#!/usr/bin/env bats

@test "detect-mirror.sh: --force-cn 应该返回 cn" {
  run bash scripts/detect-mirror.sh --force-cn
  [ "$status" -eq 0 ]
  [[ "$output" =~ "国内 (China)" ]]
}

@test "detect-mirror.sh: --force-global 应该返回 global" {
  run bash scripts/detect-mirror.sh --force-global
  [ "$status" -eq 0 ]
  [[ "$output" =~ "全球 (Global)" ]]
}

@test "docker-build.sh: --region cn 应该设置 DEPLOY_REGION=cn" {
  # 模拟参数解析
  DEPLOY_REGION="auto"
  while [ $# -gt 0 ]; do
    case $1 in
      --region=*)    DEPLOY_REGION="${1#*=}"; shift ;;
      --region)      DEPLOY_REGION="$2"; shift 2 ;;
      *)             shift ;;
    esac
  done
  [ "$DEPLOY_REGION" = "cn" ]
}
```

### 3.2 集成测试 (Integration Tests)

测试 Docker 构建和镜像。

**测试内容：**
- Dockerfile 构建成功
- 镜像元数据正确（LABEL）
- 镜像体积合理
- 非 root 用户运行
- 端口暴露正确
- HEALTHCHECK 配置正确

**示例：**
```bash
#!/bin/bash
set -euo pipefail

echo "=== Docker 集成测试 ==="

# 1. 测试构建
echo "1. 测试 Docker 构建..."
docker build -t lionetrides:test .
echo "✅ 构建成功"

# 2. 测试元数据
echo "2. 测试镜像元数据..."
LABELS=$(docker inspect lionetrides:test --format='{{json .Config.Labels}}')
echo "$LABELS" | jq -e '.["org.opencontainers.image.title"]' > /dev/null
echo "✅ 元数据正确"

# 3. 测试非 root 运行
echo "3. 测试非 root 运行..."
USER=$(docker run --rm lionetrides:test whoami)
[ "$USER" = "node" ]
echo "✅ 非 root 运行"

# 4. 测试端口
echo "4. 测试端口暴露..."
PORTS=$(docker inspect lionetrides:test --format='{{json .Config.ExposedPorts}}')
echo "$PORTS" | jq -e '."5000/tcp"' > /dev/null
echo "✅ 端口正确"

# 5. 测试 HEALTHCHECK
echo "5. 测试 HEALTHCHECK..."
HEALTHCHECK=$(docker inspect lionetrides:test --format='{{json .Config.Healthcheck}}')
[ "$HEALTHCHECK" != "null" ]
echo "✅ HEALTHCHECK 配置正确"

echo "=== 所有集成测试通过 ==="
```

### 3.3 回归测试 (Regression Tests)

针对历史 bug 的测试，防止问题再次出现。

**测试内容：**
- 参数解析 bug（for 循环 shift 无效）
- PostgreSQL 端口不一致
- 镜像源自动检测
- 文件权限问题

**示例：**
```bash
#!/bin/bash
set -euo pipefail

echo "=== 回归测试 ==="

# 回归测试 1: 参数解析 bug
echo "1. 测试参数解析（--region cn 不带 =）..."
DEPLOY_REGION="auto"
while [ $# -gt 0 ]; do
  case $1 in
    --region=*)    DEPLOY_REGION="${1#*=}"; shift ;;
    --region)      DEPLOY_REGION="$2"; shift 2 ;;
    *)             shift ;;
  esac
done
[ "$DEPLOY_REGION" = "cn" ]
echo "✅ 参数解析正确"

# 回归测试 2: PostgreSQL 端口
echo "2. 测试 PostgreSQL 端口配置..."
PORT=$(grep "port = 5433" Dockerfile)
[ -n "$PORT" ]
echo "✅ PostgreSQL 端口正确"

# 回归测试 3: 镜像源自动检测
echo "3. 测试镜像源自动检测..."
bash scripts/detect-mirror.sh --clear-cache
[ -f /tmp/.mirror_detected ]
echo "✅ 镜像源检测正常"

echo "=== 所有回归测试通过 ==="
```

### 3.4 Dockerfile Lint

使用 [hadolint](https://github.com/hadolint/hadolint) 检查 Dockerfile。

**配置：**
```yaml
# .hadolint.yaml
ignored:
  - DL3008  # 允许 apt 不指定版本
  - DL3003  # 允许使用 cd
trustedRegistries:
  - docker.io
  - ghcr.io
```

**CI/CD 集成：**
```yaml
- name: Lint Dockerfile
  uses: hadolint/hadolint-action@v3.1.0
  with:
    dockerfile: Dockerfile
```

## 四、CI/CD Gate

### 4.1 GitHub Actions 工作流

```yaml
name: Docker Tests

on:
  push:
    paths:
      - 'Dockerfile'
      - 'docker-*.sh'
      - 'scripts/detect-mirror.sh'
      - 'tests/docker/**'
  pull_request:
    paths:
      - 'Dockerfile'
      - 'docker-*.sh'
      - 'scripts/detect-mirror.sh'
      - 'tests/docker/**'

jobs:
  lint:
    name: Dockerfile Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint Dockerfile
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install bats
        run: |
          sudo apt-get update
          sudo apt-get install -y bats
      - name: Run unit tests
        run: bats tests/docker/unit/

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run integration tests
        run: bash tests/docker/integration/test-docker-image.sh

  regression-tests:
    name: Regression Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run regression tests
        run: bash tests/docker/regression/test-regression.sh
```

### 4.2 本地测试脚本

```bash
#!/bin/bash
# tests/scripts/run-docker-tests.sh

set -euo pipefail

echo "=== Docker 基础设施测试 ==="

# 1. Lint
echo "1. Dockerfile Lint..."
if command -v hadolint &> /dev/null; then
  hadolint Dockerfile
  echo "✅ Lint 通过"
else
  echo "⚠️  hadolint 未安装，跳过"
fi

# 2. Shell 脚本语法检查
echo "2. Shell 脚本语法检查..."
bash -n docker-build.sh
bash -n docker-run.sh
bash -n docker-entrypoint.sh
bash -n scripts/detect-mirror.sh
echo "✅ 语法检查通过"

# 3. 单元测试
echo "3. 单元测试..."
if command -v bats &> /dev/null; then
  bats tests/docker/unit/
  echo "✅ 单元测试通过"
else
  echo "⚠️  bats 未安装，跳过"
fi

# 4. 集成测试
echo "4. 集成测试..."
bash tests/docker/integration/test-docker-image.sh
echo "✅ 集成测试通过"

# 5. 回归测试
echo "5. 回归测试..."
bash tests/docker/regression/test-regression.sh
echo "✅ 回归测试通过"

echo "=== 所有测试通过 ==="
```

## 五、实施计划

### Phase 1: 基础设施 (1-2 天)

1. 安装测试工具
   - `bats` (Bash Automated Testing System)
   - `hadolint` (Dockerfile linter)

2. 创建测试目录结构
   ```
   tests/docker/
   ├── unit/
   ├── integration/
   ├── regression/
   └── fixtures/
   ```

3. 编写本地测试脚本
   - `tests/scripts/run-docker-tests.sh`

### Phase 2: 单元测试 (2-3 天)

1. 编写 `detect-mirror.sh` 单元测试
   - 参数解析测试
   - 环境检测测试
   - 缓存逻辑测试

2. 编写 `docker-build.sh` 单元测试
   - 参数解析测试
   - 构建逻辑测试

3. 编写 `docker-run.sh` 单元测试
   - 参数解析测试
   - 运行逻辑测试

### Phase 3: 集成测试 (2-3 天)

1. 编写 Docker 构建测试
   - 构建成功测试
   - 镜像元数据测试

2. 编写镜像测试
   - 非 root 用户测试
   - 端口暴露测试
   - HEALTHCHECK 测试
   - 文件权限测试

### Phase 4: 回归测试 (1-2 天)

1. 编写历史 bug 回归测试
   - 参数解析 bug
   - PostgreSQL 端口不一致
   - 镜像源自动检测
   - 文件权限问题

### Phase 5: CI/CD 集成 (1-2 天)

1. 创建 GitHub Actions 工作流
   - Dockerfile Lint
   - 单元测试
   - 集成测试
   - 回归测试

2. 配置 Gate
   - 所有测试必须通过才能合并
   - 测试失败阻止合并

### Phase 6: 文档和培训 (1 天)

1. 编写测试文档
   - 如何运行测试
   - 如何添加新测试
   - 测试最佳实践

2. 团队培训
   - 测试理念
   - 测试工具使用
   - 测试维护

## 六、预期收益

1. **质量提升**：通过测试确保 Dockerfile 和脚本的正确性
2. **回归防护**：防止历史 bug 再次出现
3. **开发效率**：快速发现问题，减少调试时间
4. **团队协作**：统一的测试标准，便于协作
5. **持续改进**：通过测试覆盖率发现问题，持续改进

## 七、成本估算

| 阶段 | 工作量 | 说明 |
|------|--------|------|
| Phase 1 | 1-2 天 | 基础设施搭建 |
| Phase 2 | 2-3 天 | 单元测试 |
| Phase 3 | 2-3 天 | 集成测试 |
| Phase 4 | 1-2 天 | 回归测试 |
| Phase 5 | 1-2 天 | CI/CD 集成 |
| Phase 6 | 1 天 | 文档和培训 |
| **总计** | **8-13 天** | 一次性投入 |

**长期收益**：
- 减少 bug 修复时间
- 提高代码质量
- 降低维护成本
- 提升团队信心

## 八、下一步行动

1. **立即行动**：创建测试目录结构，编写第一个单元测试
2. **短期目标**：完成 Phase 1 和 Phase 2
3. **中期目标**：完成所有 Phase，建立完整的测试体系
4. **长期目标**：持续维护测试，不断提高覆盖率

---

**文档版本**：v1.0  
**最后更新**：2026-03-09  
**作者**：LionetRides Team
