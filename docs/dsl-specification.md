# LionetRides Deployment DSL Specification

## 1. 设计原则

### 1.1 声明式，不是命令式
- 描述 **WHAT**（要什么），不是 **HOW**（怎么做）
- DSL 负责将意图转换为最优的 Dockerfile

### 1.2 框架感知
- 根据框架（Next.js、React、Vue 等）自动生成构建逻辑
- 用户只需声明框架，不需要写构建步骤

### 1.3 语义验证
- 编译时检查兼容性（如：Next.js 必须用 Node.js）
- 提前发现错误，不是运行时

### 1.4 自动优化
- 多阶段构建
- 层缓存优化
- 镜像体积最小化
- 安全最佳实践

---

## 2. 语法规范

### 2.1 基础语法

```c
// 注释
// 单行注释
/* 多行注释 */

// 标识符
identifier: [a-zA-Z_][a-zA-Z0-9_]*

// 字符串
string: "..." | '...'

// 数字
number: [0-9]+

// 布尔值
boolean: true | false

// 数组
array: [value, value, ...]

// 对象
object: { key: value, key: value, ... }
```

### 2.2 顶层声明

```c
// 应用声明（必须）
app "name" {
  // 应用配置
}

// 环境声明（可选）
env "name" {
  // 环境特定配置
}
```

### 2.3 应用配置

```c
app "lionetrides" {
  // 元数据
  version: "1.0.0"
  description: "LionetRides B2B 官网"
  
  // 技术栈
  stack {
    framework: nextjs@14
    runtime: node@24
    database: postgresql@17
    cache: redis@7
  }
  
  // 构建配置
  build {
    package_manager: pnpm
    command: "pnpm run build"
    output_dir: "dist"
    
    env {
      NODE_ENV: "production"
    }
  }
  
  // 部署配置
  deploy {
    port: 3000
    health_check: "/api/v1/products"
    
    resources {
      cpu: "500m"
      memory: "512Mi"
    }
    
    scaling {
      min_replicas: 2
      max_replicas: 10
      target_cpu: 70
    }
  }
  
  // 安全策略
  security {
    https: true
    non_root: true
    read_only_fs: true
  }
  
  // 监控
  monitoring {
    health_check {
      path: "/api/v1/products"
      interval: 30
      timeout: 10
    }
  }
}
```

---

## 3. 语义规则

### 3.1 框架兼容性

| Framework | Runtime | Database | Cache |
|-----------|---------|----------|-------|
| nextjs | node | postgresql, mysql | redis |
| react | node | any | any |
| vue | node | any | any |
| django | python | postgresql, mysql | redis |
| flask | python | any | any |
| spring | java | mysql, postgresql | redis |

### 3.2 版本约束

```c
// 语义化版本
framework: nextjs@14      // 14.x.x
runtime: node@24          // 24.x.x
database: postgresql@17   // 17.x

// 精确版本
framework: nextjs@14.2.3  // 14.2.3
```

### 3.3 必填字段

```c
app "name" {
  // 必填
  stack.framework: required
  stack.runtime: required
  
  // 可选
  version: optional
  description: optional
}
```

---

## 4. 编译器架构

```
┌─────────────────────────────────────┐
│  源代码 (deploy.dsl)                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  1. 词法分析 (Lexer)                │
│     - 分词                          │
│     - 去除空白和注释                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. 语法分析 (Parser)               │
│     - 构建抽象语法树 (AST)          │
│     - 语法错误检查                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. 语义分析 (Semantic Analyzer)    │
│     - 框架兼容性检查                │
│     - 类型检查                      │
│     - 必填字段检查                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. 优化器 (Optimizer)              │
│     - 层缓存优化                    │
│     - 镜像体积优化                  │
│     - 安全加固                      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. 代码生成 (Code Generator)       │
│     - 生成 Dockerfile               │
│     - 生成 docker-compose.yml       │
│     - 生成 CI/CD 配置               │
└─────────────────────────────────────┘
```

---

## 5. 示例

### 5.1 简单应用

```c
app "myapp" {
  stack {
    framework: nextjs@14
    runtime: node@24
  }
  
  deploy {
    port: 3000
  }
}
```

**生成的 Dockerfile**：
```dockerfile
# 自动生成
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

### 5.2 带数据库的应用

```c
app "myapp" {
  stack {
    framework: nextjs@14
    runtime: node@24
    database: postgresql@17
  }
  
  build {
    env {
      DATABASE_URL: "postgresql://user:pass@db:5432/myapp"
    }
  }
  
  deploy {
    port: 3000
  }
}
```

**生成的 docker-compose.yml**：
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
    depends_on:
      - db
  
  db:
    image: postgres:17
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=myapp
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 6. 错误处理

### 6.1 语法错误

```
Error: Syntax error at line 5, column 10
  Expected '}' but found 'EOF'
  
  3 | app "myapp" {
  4 |   stack {
  5 |     framework: nextjs@14
    |          ^
```

### 6.2 语义错误

```
Error: Incompatible framework and runtime
  framework: nextjs@14 requires node@*
  runtime: python@3.11 is not compatible
  
  Suggestion: Change runtime to node@24
```

### 6.3 验证错误

```
Error: Missing required field
  app "myapp" is missing required field: stack.framework
  
  Suggestion: Add stack { framework: nextjs@14 }
```

---

## 7. 扩展性

### 7.1 自定义框架

```c
framework "custom-framework" {
  runtime: node
  build_command: "npm run build"
  output_dir: "dist"
  start_command: "node dist/server.js"
}

app "myapp" {
  stack {
    framework: custom-framework
    runtime: node@24
  }
}
```

### 7.2 插件系统

```c
plugin "monitoring" {
  provider: "datadog"
  api_key: "${secrets.datadog_api_key}"
}

app "myapp" {
  plugins: ["monitoring"]
}
```

---

## 8. 实现计划

### Phase 1: MVP（2 周）
- [ ] 词法分析器
- [ ] 语法分析器
- [ ] 基础语义检查
- [ ] 生成简单 Dockerfile

### Phase 2: 框架感知（2 周）
- [ ] 框架注册表
- [ ] 自动生成构建逻辑
- [ ] 生成 docker-compose.yml

### Phase 3: 优化（2 周）
- [ ] 层缓存优化
- [ ] 镜像体积优化
- [ ] 安全加固

### Phase 4: 高级特性（2 周）
- [ ] 插件系统
- [ ] 自定义框架
- [ ] CI/CD 生成

---

## 9. 参考

- [Terraform HCL](https://www.terraform.io/docs/language/syntax/configuration.html)
- [Kubernetes YAML](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/)
- [Heroku Procfile](https://devcenter.heroku.com/articles/procfile)
- [Railway.toml](https://docs.railway.app/reference/project-configuration)
