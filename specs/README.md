# 游乐设施 B2B 官网 — 形式化规格说明书

## 建模机制说明

本目录受 **NodeCoda 形式化规格系统** 启发，采用 YAML 格式的 `.spec.yaml` 文件对项目中的业务实体、操作契约、状态机和业务规则进行形式化建模。

### 核心原则

**Spec 即真相源（Single Source of Truth）** — 代码实现、数据库 schema、API 路由、测试用例**必须**符合 spec 定义。冲突时以 spec 为准。

### 文件结构

```yaml
module: 模块名
version: '1.0'

entities:
  EntityName:
    table: 表名
    fields:
      fieldName: { type: 类型, required: true/false, ... }
    relations:
      relationName: { type: belongs_to/has_many, entity: 目标, via: 外键 }
    state_machine:
      initial: 初始状态
      transitions:
        - { from: 状态A, to: [状态B, 状态C] }

operations:
  操作名:
    method: GET/POST/PUT/DELETE
    path: /api/v1/路径
    auth: public/required/admin
    input: { 参数名: 约束 }
    pre: "前置条件"
    post: "后置条件"
    effect: "副作用"
    output: { 返回字段 }
    errors:
      - { code: 状态码, condition: "触发条件", message: "错误信息" }

rules:
  - "业务规则描述"
```

### 模块分层

```
Layer 0: Auth, Settings, Notification
Layer 1: Brand, Category, Certification, Partner, Team
Layer 2: Product, News
Layer 3: Customer, Inquiry, Review
```