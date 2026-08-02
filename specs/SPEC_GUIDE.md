# 游乐设施 B2B 官网 — 规格建模指南

## 概述

本目录下的 `*.spec.yaml` 文件是项目的**形式化规格**（Formal Specification），作为代码、数据库、API 和测试的唯一真相源（Single Source of Truth）。

## 文件列表

| 文件 | 层级 | 覆盖实体 | 说明 |
|------|------|----------|------|
| `auth.spec.yaml` | 0 | User, Role, Permission | 用户认证与权限 |
| `settings.spec.yaml` | 0 | Setting, SiteStat, TeamMember | 站点配置与统计 |
| `certification.spec.yaml` | 0 | Certification | 认证资质 |
| `partner.spec.yaml` | 0 | Partner | 合作伙伴 |
| `brand.spec.yaml` | 1 | Brand | 品牌管理 |
| `category.spec.yaml` | 1 | Category, CategoryPath | 产品分类（树形） |
| `news.spec.yaml` | 1 | News, NewsDescription | 新闻动态 |
| `product.spec.yaml` | 2 | Product, ProductDescription, ProductImage, ProductAttribute, ProductCategory | 产品核心 |
| `customer.spec.yaml` | 3 | Customer, CustomerAddress | 客户管理 |
| `inquiry.spec.yaml` | 3 | Inquiry, InquiryMessage | 询盘系统（核心业务） |
| `review.spec.yaml` | 4 | Review | 客户评价 |

## 分层依赖拓扑

```
Layer 0:  Auth, Settings, Certification, Partner
          ↑ 独立基础，无外部依赖
Layer 1:  Brand, Category, News
          ↑ 依赖 Layer 0
Layer 2:  Product
          ↑ 依赖 Layer 0~1
Layer 3:  Customer, Inquiry
          ↑ 依赖 Layer 0~2
Layer 4:  Review
          ↑ 依赖 Layer 2~3
```

## Spec 文件结构

每个 spec 文件包含以下维度：

### 1. Entity（实体 → 数据表）
```yaml
entities:
  Product:
    table: products
    fields:
      name:  { type: varchar(100), required: true, index: true }
      price: { type: decimal(10,2), required: true, min: 0 }
    relations:
      brand: { type: belongs_to, entity: Brand, via: brandId }
    unique: [field1, field2]  # 联合唯一索引
```

### 2. Operations（操作 → API 接口）
```yaml
operations:
  list:
    method: GET
    path: /api/v1/products
    auth: public           # public / auth / admin
    cache: 30              # 缓存秒数
    input: { ... }         # 请求参数
    pre:  [...]            # 前置条件
    post: [...]            # 后置条件
    effects: "..."         # 副作用
    output: { ... }        # 响应格式
    errors:                # 错误场景
      - { code: 404, condition: "产品不存在", message: "..." }
```

### 3. State Machine（状态机）
```yaml
Inquiry.status:
  initial: pending
  transitions:
    - { from: pending,  to: [responded, closed] }
    - { from: responded, to: [closed] }
  illegal_transitions:
    - [pending, resolved]
```

### 4. Rules（业务规则）
```yaml
rules:
  - "一个客户对一个产品只能询盘一次"
  - "询盘回复后状态变为 responded"
  - "前台只展示 status = true 的产品"
```

## 开发工作流

```
1. 需求分析 → 编写/更新 spec.yaml
2. 从 spec 推导数据库 Schema（Drizzle ORM）
3. 从 spec 推导 API 接口（Route Handlers）
4. 从 spec 推导测试用例（每条 rule → 一个 test）
5. 编码实现
6. 验证：spec 与代码是否一致
```

## 验证规则

- 代码中的 **数据库表结构** 必须与 spec 的 `entities.fields` 一致
- 代码中的 **API 路由** 必须与 spec 的 `operations` 一致
- 代码中的 **状态流转** 必须符合 spec 的 `state machine` 定义
- 代码中的 **业务逻辑** 必须满足 spec 的 `rules`
- 每个 `errors` 场景必须有对应的**测试用例**
- 每个 `pre` 条件必须在代码中有**显式校验**
- 每个 `post` 条件必须能转化为**断言**