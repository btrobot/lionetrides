# DSL 表达能力审查报告

**审查角色**：编译器专家  
**审查目标**：评估 DSL 是否能够完整表达 Dockerfile 的所有能力  
**审查日期**：2024-01-07

---

## 一、Dockerfile 完整能力清单

### 1.1 基础指令（17 个）

| 指令 | 用途 | DSL 支持 |
|------|------|---------|
| `FROM` | 基础镜像选择 | ✅ 部分（runtime 块） |
| `WORKDIR` | 工作目录 | ❌ 缺失 |
| `COPY` | 文件复制 | ✅ 部分（build 块） |
| `RUN` | 命令执行 | ✅ 部分（build 块） |
| `ENV` | 环境变量 | ❌ 缺失 |
| `EXPOSE` | 端口暴露 | ✅ 支持（deploy.port） |
| `CMD` | 默认命令 | ❌ 缺失 |
| `ENTRYPOINT` | 入口点 | ❌ 缺失 |
| `ARG` | 构建参数 | ❌ 缺失 |
| `LABEL` | 元数据标签 | ✅ 支持（labels 块） |
| `USER` | 用户切换 | ✅ 部分（security.non_root） |
| `VOLUME` | 卷声明 | ❌ 缺失 |
| `HEALTHCHECK` | 健康检查 | ✅ 部分（deploy.health_check） |
| `SHELL` | 默认 Shell | ❌ 缺失 |
| `ONBUILD` | 构建触发器 | ❌ 缺失 |
| `STOPSIGNAL` | 停止信号 | ❌ 缺失 |
| `ADD` | 文件添加（支持 URL） | ❌ 缺失 |

### 1.2 高级特性

| 特性 | 用途 | DSL 支持 |
|------|------|---------|
| 多阶段构建 | 优化镜像大小 | ✅ 支持（自动） |
| 层缓存优化 | 加速构建 | ❌ 缺失 |
| 构建密钥 | 安全传递敏感信息 | ❌ 缺失 |
| 缓存挂载 | 加速依赖安装 | ❌ 缺失 |
| 自定义 COPY 选项 | --chown, --chmod | ❌ 缺失 |
| 自定义 RUN 选项 | --mount, --security | ❌ 缺失 |
| 网络配置 | 网络策略 | ❌ 缺失 |
| 资源限制 | CPU/内存限制 | ❌ 缺失 |
| 健康检查定制 | interval, timeout, retries | ❌ 缺失 |

---

## 二、DSL 当前能力评估

### 2.1 已支持的能力

```c
app "lionetrides" {
  version: "1.0.0"
  description: "LionetRides B2B 官网"
  
  stack {
    framework: nextjs@14
    runtime: node@24
  }
  
  build {
    package_manager: pnpm
    command: "pnpm run build"
    output_dir: "dist"
  }
  
  deploy {
    port: 3000
    health_check: "/api/v1/products"
  }
  
  security {
    non_root: true
  }
  
  labels {
    title: "LionetRides"
  }
}
```

**支持度评分**：30%（仅覆盖基础场景）

### 2.2 缺失的关键能力

#### 优先级 1：必须支持（影响基本功能）

| 能力 | 重要性 | 影响 |
|------|--------|------|
| 环境变量（ENV） | 🔴 高 | 无法配置运行时环境变量 |
| 构建参数（ARG） | 🔴 高 | 无法传递构建时参数 |
| 工作目录（WORKDIR） | 🔴 高 | 无法自定义工作目录 |
| 默认命令（CMD） | 🔴 高 | 无法自定义启动命令 |

#### 优先级 2：应该支持（影响高级功能）

| 能力 | 重要性 | 影响 |
|------|--------|------|
| 卷声明（VOLUME） | 🟡 中 | 无法声明持久化存储 |
| 入口点（ENTRYPOINT） | 🟡 中 | 无法自定义容器入口 |
| 健康检查定制 | 🟡 中 | 无法定制检查参数 |
| 用户切换（USER） | 🟡 中 | 无法精细控制用户权限 |

#### 优先级 3：可选支持（影响优化）

| 能力 | 重要性 | 影响 |
|------|--------|------|
| 构建密钥 | 🟢 低 | 无法安全传递密钥 |
| 缓存挂载 | 🟢 低 | 无法优化构建速度 |
| 网络配置 | 🟢 低 | 无法配置网络策略 |
| 资源限制 | 🟢 低 | 无法限制资源使用 |

---

## 三、DSL 扩展方案

### 3.1 优先级 1 扩展（必须）

```c
app "lionetrides" {
  // ... 现有配置 ...
  
  // 新增：环境变量
  env {
    NODE_ENV: "production"
    DATABASE_URL: "${secrets.database_url}"
    API_KEY: "${secrets.api_key}"
  }
  
  // 新增：构建参数
  args {
    BUILD_DATE: "${timestamp}"
    GIT_COMMIT: "${git.commit}"
    VERSION: "1.0.0"
  }
  
  // 新增：工作目录
  workdir: "/app"
  
  // 新增：默认命令
  cmd: ["node", "dist/server.js"]
}
```

### 3.2 优先级 2 扩展（应该）

```c
app "lionetrides" {
  // ... 现有配置 ...
  
  // 新增：卷声明
  volumes {
    "/app/data": {
      description: "应用数据"
    }
    "/app/logs": {
      description: "应用日志"
    }
  }
  
  // 新增：入口点
  entrypoint: ["/docker-entrypoint.sh"]
  
  // 新增：健康检查定制
  deploy {
    health_check: {
      path: "/api/v1/products"
      interval: "30s"
      timeout: "10s"
      retries: 3
      start_period: "40s"
    }
  }
  
  // 新增：用户切换
  security {
    non_root: true
    user: "node"
    group: "node"
  }
}
```

### 3.3 优先级 3 扩展（可选）

```c
app "lionetrides" {
  // ... 现有配置 ...
  
  // 新增：构建密钥
  secrets {
    npm_token: {
      env: "NPM_TOKEN"
    }
    ssh_key: {
      file: "~/.ssh/id_rsa"
    }
  }
  
  // 新增：缓存挂载
  cache {
    pnpm_store: {
      target: "/root/.local/share/pnpm/store"
    }
    next_cache: {
      target: "/app/.next/cache"
    }
  }
  
  // 新增：网络配置
  network {
    ingress: ["80", "443", "3000"]
    egress: ["database:5432", "cache:6379"]
  }
  
  // 新增：资源限制
  resources {
    cpu: "500m"
    memory: "512Mi"
    cpu_limit: "1000m"
    memory_limit: "1Gi"
  }
}
```

---

## 四、DSL 表达能力对比

### 4.1 当前 vs 目标

| 维度 | 当前 | 目标 | 差距 |
|------|------|------|------|
| **基础指令覆盖** | 30% | 100% | -70% |
| **高级特性覆盖** | 10% | 80% | -70% |
| **声明式表达** | 高 | 高 | 0% |
| **易用性** | 高 | 高 | 0% |
| **可扩展性** | 中 | 高 | -1 |

### 4.2 与竞品对比

| DSL | 基础指令 | 高级特性 | 声明式 | 易用性 |
|-----|---------|---------|--------|--------|
| **我们的 DSL** | 30% | 10% | ✅ 高 | ✅ 高 |
| **Buildpacks** | 80% | 60% | ✅ 高 | ✅ 高 |
| **Nixpacks** | 70% | 50% | ✅ 高 | ✅ 高 |
| **Docker Compose** | 90% | 80% | ✅ 高 | ✅ 高 |

---

## 五、实施建议

### 5.1 分阶段实施

#### 阶段 1：基础能力补全（1-2 周）

**目标**：覆盖 80% 的 Dockerfile 能力

**任务**：
1. 实现 `env` 块（环境变量）
2. 实现 `args` 块（构建参数）
3. 实现 `workdir` 属性（工作目录）
4. 实现 `cmd` 属性（默认命令）
5. 实现 `volumes` 块（卷声明）
6. 实现 `entrypoint` 属性（入口点）

**验收标准**：
- 能够生成与手写 Dockerfile 等效的配置
- 通过所有现有测试

#### 阶段 2：高级特性支持（1-2 周）

**目标**：覆盖 95% 的 Dockerfile 能力

**任务**：
1. 实现健康检查定制
2. 实现用户切换精细控制
3. 实现构建密钥支持
4. 实现缓存挂载支持
5. 实现网络配置
6. 实现资源限制

**验收标准**：
- 支持所有常见的 Dockerfile 场景
- 性能优化场景可用

#### 阶段 3：优化与增强（持续）

**目标**：超越 Dockerfile

**任务**：
1. 智能层缓存优化
2. 自动安全加固
3. 多架构构建支持
4. 构建性能分析
5. 依赖漏洞扫描

**验收标准**：
- 生成的配置优于手写 Dockerfile
- 提供额外的价值

### 5.2 优先级排序

```
P0（必须）: env, args, workdir, cmd
P1（应该）: volumes, entrypoint, health_check 定制, user 精细控制
P2（可选）: secrets, cache, network, resources
P3（未来）: 智能优化, 安全加固, 多架构
```

---

## 六、结论

### 6.1 当前状态

**DSL 表达能力不足**，仅覆盖 30% 的 Dockerfile 能力。

**主要缺失**：
- 环境变量（ENV）
- 构建参数（ARG）
- 工作目录（WORKDIR）
- 默认命令（CMD）
- 卷声明（VOLUME）
- 入口点（ENTRYPOINT）

### 6.2 改进建议

**短期（1-2 周）**：
- 实现 P0 和 P1 能力
- 覆盖 80% 的 Dockerfile 场景

**中期（1-2 月）**：
- 实现 P2 能力
- 覆盖 95% 的 Dockerfile 场景

**长期（持续）**：
- 实现 P3 能力
- 超越 Dockerfile

### 6.3 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| DSL 表达能力不足 | 高 | 高 | 快速迭代补全能力 |
| 向后兼容性问题 | 中 | 中 | 版本化管理 |
| 性能问题 | 低 | 低 | 性能测试 |

---

## 七、下一步行动

1. **立即开始阶段 1**：实现 P0 能力（env, args, workdir, cmd）
2. **制定测试计划**：确保每个新能力都有测试覆盖
3. **更新文档**：同步更新 DSL 规范文档
4. **用户反馈**：收集实际使用中的需求

---

**审查结论**：DSL 设计理念优秀，但表达能力不足。需要快速补全基础能力，才能达到实用水平。

**审查人**：编译器专家  
**审查日期**：2024-01-07
