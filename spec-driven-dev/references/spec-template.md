# Spec 模板规范

## 四维建模法

每个业务模块的 `*.spec.yaml` 必须包含以下四个维度：

```yaml
module: <模块名，如 product>
entity:  <实体定义>
operations:  <操作列表>
state_machine:  <状态机定义（可选）>
rules:  <业务规则列表>
```

---

## 一、实体（Entity）

### 字段类型对照表

| YAML 类型 | TypeScript 类型 | DB 类型（PostgreSQL） |
|-----------|----------------|----------------------|
| `string` | `string` | `text` / `varchar` |
| `integer` | `number` | `integer` |
| `float` | `number` | `numeric` / `double` |
| `boolean` | `boolean` | `boolean` |
| `datetime` | `Date` | `timestamp` |
| `enum` | 联合类型 | `text` 或 pgEnum |
| `json` | `Record<string, unknown>` | `jsonb` |
| `relation` | 外键 ID | `integer`（带 FK 约束） |

### 字段定义模板

```yaml
entity:
  name: Product
  table: products
  fields:
    id:
      type: integer
      primary_key: true
      auto_increment: true
    name:
      type: string
      required: true
      max_length: 255
      description: 产品名称
    slug:
      type: string
      required: true
      unique: true
    description:
      type: string
      required: false
      max_length: 2000
    category_id:
      type: integer
      required: false
      relation: categories.id
      on_delete: SET NULL
    status:
      type: enum
      values: [draft, published, archived]
      default: draft
    price:
      type: float
      required: false
    sort_order:
      type: integer
      default: 0
    is_active:
      type: boolean
      default: true
    created_at:
      type: datetime
      default: now
    updated_at:
      type: datetime
      default: now
      on_update: true
    deleted_at:
      type: datetime
      required: false
      description: 软删除时间戳
```

### 软删除规范

所有业务表必须包含 `deleted_at` 字段，所有查询默认过滤 `deleted_at IS NULL`。

---

## 二、操作（Operation）

### 操作定义模板

```yaml
operations:
  list:
    method: GET
    path: /api/v1/products
    auth: public
    pagination: true
    params:
      page: { type: integer, default: 1 }
      pageSize: { type: integer, default: 20, max: 100 }
      search: { type: string, required: false }
      category_id: { type: integer, required: false }
      status: { type: enum, values: [draft, published, archived], required: false }
    response:
      items: Product[]
      total: integer
      page: integer
      pageSize: integer

  getById:
    method: GET
    path: /api/v1/products/:id
    auth: public
    params:
      id: { type: integer, in: path }
    response: Product

  create:
    method: POST
    path: /api/v1/products
    auth: admin
    body: ProductCreateInput
    response: Product

  update:
    method: PUT
    path: /api/v1/products/:id
    auth: admin
    params:
      id: { type: integer, in: path }
    body: ProductUpdateInput
    response: Product

  remove:
    method: DELETE
    path: /api/v1/products/:id
    auth: admin
    params:
      id: { type: integer, in: path }
    response: { success: true }
```

### 权限等级

| 权限 | 说明 |
|------|------|
| `public` | 无需认证 |
| `auth` | 需要 JWT 认证 |
| `admin` | 需要管理员角色 |
| `owner` | 仅资源所有者可访问 |

### 分页规范

所有 list 操作统一分页格式：

```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

---

## 三、状态机（State Machine）

### 何时需要状态机

当实体有明确的"生命周期"（状态流转受业务规则约束）时，必须定义状态机。

### 状态机定义模板

```yaml
state_machine:
  initial: pending
  states:
    - name: pending
      label: 待处理
    - name: processing
      label: 处理中
    - name: completed
      label: 已完成
    - name: cancelled
      label: 已取消
  transitions:
    - from: pending
      to: processing
      action: process
      auth: admin
    - from: pending
      to: cancelled
      action: cancel
      auth: [admin, owner]
    - from: processing
      to: completed
      action: complete
      auth: admin
    - from: processing
      to: cancelled
      action: cancel
      auth: admin
  rules:
    - description: 已完成或已取消的状态不可再转换
      constraint: terminal_states: [completed, cancelled]
    - description: 状态变更必须记录到历史表
      constraint: audit_required: true
```

### 历史记录规范

有状态机流转的实体，必须创建对应的 `_history` 表记录每次状态变更：

```yaml
fields:
  # ... 其他字段
  history:
    table: inquiry_history
    fields:
      id: integer
      inquiry_id: integer
      from_status: string
      to_status: string
      changed_by: integer
      remark: string
      created_at: datetime
```

---

## 四、规则（Rules）

### 规则定义模板

```yaml
rules:
  - id: R001
    severity: error
    description: 产品名称不能超过 255 个字符
    validation: name.length <= 255
    error: Product name too long

  - id: R002
    severity: error
    description: 草稿产品不可公开访问
    validation: status !== 'draft' || is_admin
    error: Draft products are not accessible

  - id: R003
    severity: warning
    description: 删除产品时同步清理关联的询盘
    validation: on_delete_cascade
    note: 建议软删除，保留关联数据

  - id: R004
    severity: error
    description: 邮箱格式校验
    validation: email ~ /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    error: Invalid email format
```

### 规则优先级

| 严重度 | 含义 | 测试要求 |
|--------|------|---------|
| `error` | 必须遵守，违反会导致数据不一致或安全漏洞 | 必须有测试覆盖 |
| `warning` | 建议遵守，违反可能影响体验或可维护性 | 建议有测试覆盖 |
| `info` | 提供参考信息 | 可选测试覆盖 |