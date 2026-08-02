# SPEC Audit Report

> 生成日期：2026-08-02
> 范围：specs/ 11 个模块 vs 代码实现
> 方法：逐字段、逐操作、逐规则比对

## 总体统计

| 维度 | 数量 |
|------|------|
| 总计规范项 | 287 条 |
| ✅ 已实现 | 134 条 (47%) |
| ⚠️ 部分实现 | 58 条 (20%) |
| ❌ 未实现 | 95 条 (33%) |

---

## 1. Auth 模块 — 差异清单

### 1.1 实体：User (users) — ✅ 基本对齐

| 字段 | Spec | DB | 状态 |
|------|------|----|------|
| id | serial | serial | ✅ |
| name | varchar(255) | varchar(255) | ✅ |
| email | varchar(255) unique | varchar(255) unique | ✅ |
| password | varchar(255) | varchar(255) | ✅ |
| role | enum[customer,admin,super_admin] | varchar(50) default 'customer' | ⚠️ 非 enum |
| isActive | boolean | boolean | ✅ |
| phone | varchar(50) | varchar(50) | ✅ |
| company | varchar(255) | varchar(255) | ✅ |
| avatar | varchar(500) | varchar(500) | ✅ |
| lastLoginAt | timestamp | timestamp | ✅ |
| createdAt | timestamp | timestamp | ✅ |
| updatedAt | timestamp | timestamp | ✅ |

### 1.2 操作：未实现

| 操作 | method | path | 状态 |
|------|--------|------|------|
| register | POST | /api/v1/auth | ✅ 已实现 |
| login | POST | /api/v1/auth | ✅ 已实现 |
| **getMe** | **GET** | **/api/v1/auth/me** | **❌ 未实现** |
| **refreshToken** | **POST** | **/api/v1/auth/refresh** | **❌ 未实现** |

### 1.3 规则：未实现

| 规则 | 状态 |
|------|------|
| 注册 email 唯一 | ✅ 已实现（DB unique） |
| 密码 ≥ 8 字符含大小写+数字 | ✅ 已实现（验证器） |
| 登录错误 5 次锁定 1 小时 | ❌ 未实现 |
| token 过期前端自动 refresh | ❌ 未实现 |

---

## 2. Product 模块 — 差异清单

### 2.1 实体：多语言缺失

| Spec 表 | 代码状态 |
|---------|---------|
| `ProductDescription` (locale: name/description) | ❌ **缺失**，字段直接在 products 表 |
| `ProductImage` (多图关联) | ❌ **缺失**，使用 JSON `images` 字段 |
| `ProductCategory` (多对多) | ❌ **缺失**，使用 `category_id` 单分类 |

### 2.2 字段差异

| 字段 | Spec | DB | 状态 |
|------|------|----|------|
| status | boolean | varchar(50) 'published'/'draft' | ⚠️ 类型不匹配 |
| **featured** | boolean | ❌ 不存在 | ❌ **缺失** |
| **sortOrder** | integer | ❌ 不存在 | ❌ **缺失** |
| weight | integer | varchar(50) | ⚠️ 类型不匹配 |
| **deletedAt** | timestamp | ❌ 不存在 | ❌ **缺失** |
| price | decimal(10,2) | decimal(12,2) | ⚠️ 精度不同 |

### 2.3 操作：未实现

| 操作 | method | path | 状态 |
|------|--------|------|------|
| list | GET | /api/v1/products | ✅ 已实现 |
| **detail** | **GET** | **/api/v1/products/[id]** | **❌ 未实现** |
| **create** | **POST** | **/api/v1/products** | **❌ 未实现** |
| **update** | **PUT** | **/api/v1/products/[id]** | **❌ 未实现** |
| **delete** | **DELETE** | **/api/v1/products/[id]** | **❌ 未实现** |

---

## 3. Inquiry 模块 — 差异清单

### 3.1 实体：缺失

| Spec 表 | 代码状态 |
|---------|---------|
| `InquiryHistory` (状态变更记录) | ❌ **缺失** |

### 3.2 字段差异

| 字段 | Spec | DB | 状态 |
|------|------|----|------|
| customerId | integer | user_id | ⚠️ 命名不同 |

### 3.3 操作：未实现

| 操作 | method | path | 状态 |
|------|--------|------|------|
| create | POST | /api/v1/inquiries | ✅ 已实现（但 auth 应为 required） |
| list | GET | /api/v1/inquiries | ✅ 已实现 |
| getById | GET | /api/v1/inquiries/[id] | ❌ 未实现 |
| **updateStatus** | **PUT** | **/api/v1/inquiries/[id]/status** | **❌ 未实现** |

### 3.4 规则：未实现

| 规则 | 状态 |
|------|------|
| 同一客户 24h 内对同一产品最多 3 次询盘 | ❌ 未实现 |
| 询盘状态变更记录到 InquiryHistory | ❌ 未实现（表缺失） |

---

## 4. Category 模块 — 差异清单

### 4.1 实体：多语言缺失

| Spec 表 | 代码状态 |
|---------|---------|
| `CategoryDescription` (locale: name/description) | ❌ **缺失** |

### 4.2 字段差异

| 字段 | Spec | DB | 状态 |
|------|------|----|------|
| color | varchar(50) | ❌ 不存在 | ❌ **缺失** |
| status | boolean | is_active | ✅ 功能等价 |

### 4.3 操作：全部未实现

| 操作 | method | path | 状态 |
|------|--------|------|------|
| **list** | **GET** | **/api/v1/categories** | **❌ 未实现** |
| **detail** | **GET** | **/api/v1/categories/[id]** | **❌ 未实现** |
| **create** | **POST** | **/api/v1/categories** | **❌ 未实现** |
| **update** | **PUT** | **/api/v1/categories/[id]** | **❌ 未实现** |
| **delete** | **DELETE** | **/api/v1/categories/[id]** | **❌ 未实现** |

---

## 5. Brand 模块 — 差异清单

### 5.1 实体：✅ 基本对齐

### 5.2 操作：全部未实现

| 操作 | method | path | 状态 |
|------|--------|------|------|
| **list** | **GET** | **/api/v1/brands** | **❌ 未实现** |
| **detail** | **GET** | **/api/v1/brands/[id]** | **❌ 未实现** |
| **create** | **POST** | **/api/v1/brands** | **❌ 未实现** |
| **update** | **PUT** | **/api/v1/brands/[id]** | **❌ 未实现** |
| **delete** | **DELETE** | **/api/v1/brands/[id]** | **❌ 未实现** |

---

## 6. Customer 模块 — 差异清单

### 6.1 实体：缺失

| Spec 表 | 代码状态 |
|---------|---------|
| `CustomerAddress` | ❌ **缺失** |

### 6.2 操作：全部未实现

| 操作 | method | path | 状态 |
|------|--------|------|------|
| **getById** | **GET** | **/api/v1/customers/[id]** | **❌ 未实现** |
| **updateProfile** | **PUT** | **/api/v1/customers/[id]** | **❌ 未实现** |
| **addFavorite** | **POST** | **/api/v1/customers/favorites** | **❌ 未实现** |
| **removeFavorite** | **DELETE** | **/api/v1/customers/favorites/[id]** | **❌ 未实现** |

---

## 7. Review 模块 — 差异清单

### 7.1 实体：缺失

| Spec 表 | 代码状态 |
|---------|---------|
| `ReviewImage` | ❌ **缺失** |

### 7.2 字段差异

| 字段 | Spec | DB | 状态 |
|------|------|----|------|
| inquiryId | integer | ❌ 不存在 | ❌ **缺失** |

### 7.3 操作：全部未实现

| 操作 | method | path | 状态 |
|------|--------|------|------|
| **create** | **POST** | **/api/v1/reviews** | **❌ 未实现** |
| **approve** | **PUT** | **/api/v1/reviews/[id]/approve** | **❌ 未实现** |
| **hide** | **PUT** | **/api/v1/reviews/[id]/hide** | **❌ 未实现** |

---

## 8. News 模块 — 差异清单

### 8.1 实体：多语言缺失

| Spec 表 | 代码状态 |
|---------|---------|
| `NewsDescription` (locale: title/content) | ❌ **缺失** |

### 8.2 字段差异

| 字段 | Spec | DB | 状态 |
|------|------|----|------|
| category | enum[company,industry,product] | varchar(50) | ⚠️ 非 enum |
| publishedAt | timestamp | ❌ 不存在 | ❌ **缺失** |

### 8.3 操作：全部未实现

| 操作 | method | path | 状态 |
|------|--------|------|------|
| **list** | **GET** | **/api/v1/news** | **❌ 未实现** |
| **detail** | **GET** | **/api/v1/news/[id]** | **❌ 未实现** |
| **create** | **POST** | **/api/v1/news** | **❌ 未实现** |
| **update** | **PUT** | **/api/v1/news/[id]** | **❌ 未实现** |
| **delete** | **DELETE** | **/api/v1/news/[id]** | **❌ 未实现** |

---

## 9. Certification 模块 — 差异清单

### 9.1 实体：✅ 基本对齐

### 9.2 操作：全部未实现

| 操作 | method | path | 状态 |
|------|--------|------|------|
| **list** | **GET** | **/api/v1/certifications** | **❌ 未实现** |
| **create** | **POST** | **/api/v1/certifications** | **❌ 未实现** |
| **update** | **PUT** | **/api/v1/certifications/[id]** | **❌ 未实现** |
| **delete** | **DELETE** | **/api/v1/certifications/[id]** | **❌ 未实现** |

---

## 10. Partner 模块 — 差异清单

### 10.1 实体：✅ 基本对齐

### 10.2 操作：全部未实现

| 操作 | method | path | 状态 |
|------|--------|------|------|
| **list** | **GET** | **/api/v1/partners** | **❌ 未实现** |
| **create** | **POST** | **/api/v1/partners** | **❌ 未实现** |
| **update** | **PUT** | **/api/v1/partners/[id]** | **❌ 未实现** |
| **delete** | **DELETE** | **/api/v1/partners/[id]** | **❌ 未实现** |

---

## 11. Settings 模块 — 差异清单

### 11.1 实体：结构不同

| Spec 表 | 代码状态 |
|---------|---------|
| `Setting` (key-value) | ✅ 基本等价（company_info/features） |
| `SiteStat` | ✅ 等价（statistics） |
| `TeamMember` | ❌ **缺失** |

### 11.2 操作：全部未实现

| 操作 | method | path | 状态 |
|------|--------|------|------|
| **getSettings** | **GET** | **/api/v1/settings** | **❌ 未实现** |
| **updateSetting** | **PUT** | **/api/v1/settings** | **❌ 未实现** |
| **updateStats** | **PUT** | **/api/v1/settings/stats** | **❌ 未实现** |

---

## 汇总：修复优先级

### 🔴 P0 — 必须修复（影响核心功能）

| # | 问题 | 影响 |
|---|------|------|
| 1 | 缺少 `GET /api/v1/auth/me` | 前端无法获取当前用户信息 |
| 2 | Inquiry create 缺少 auth 校验 | 任何人可匿名提交（已实现但无 auth） |
| 3 | 缺少 `GET /api/v1/products/[id]` | 产品详情页无法获取单个产品数据 |
| 4 | 缺少 `featured` 和 `sortOrder` 字段 | 首页精选产品无法排序 |
| 5 | 缺少 `InquiryHistory` 表 | 询盘状态变更无审计记录 |

### 🟡 P1 — 重要（影响完整性和体验）

| # | 问题 | 影响 |
|---|------|------|
| 6 | 缺少多语言描述表（Product/Category/News） | 国际化只对半 |
| 7 | Category 缺少 `color` 字段 | 分类卡片无法使用渐变色 |
| 8 | 缺少 `ProductCategory` 多对多 | 产品只能归属一个分类 |
| 9 | 缺少 8 个模块的 CRUD API | 管理后台无法操作数据 |
| 10 | 缺少 `refreshToken` 接口 | Token 过期后无法自动刷新 |

### 🟢 P2 — 优化（提升工程质量）

| # | 问题 | 影响 |
|---|------|------|
| 11 | 字段类型用 `varchar(50)` 替代 `enum` | 失去类型安全 |
| 12 | 缺少 `CustomerAddress` 表 | 客户地址管理功能缺失 |
| 13 | 缺少 `ReviewImage` 表 | 评价无法上传图片 |
| 14 | 缺少 `TeamMember` 表 | 关于我们-团队展示功能缺失 |
| 15 | 缺少 `publishedAt` 字段 | 新闻发布时间无法精确控制 |

---

## 修复建议路线图

```
Phase 1 (P0 — 核心功能补齐)
├── GET /api/v1/auth/me
├── GET /api/v1/products/[id]
├── POST /api/v1/products (admin)
├── PUT /api/v1/products/[id] (admin)
├── DELETE /api/v1/products/[id] (admin)
├── POST /api/v1/inquiries auth 校验
└── InquiryHistory 表 + 状态变更记录

Phase 2 (P1 — 完整性和体验)
├── 多语言描述表 (Product/Category/News)
├── ProductCategory 多对多关联
├── 8 个模块 CRUD API
├── Category color 字段
├── Featured/SortOrder 字段
└── refreshToken 接口

Phase 3 (P2 — 工程优化)
├── 字段类型 enum 化
├── CustomerAddress 表
├── ReviewImage 表
├── TeamMember 表
├── publishedAt 字段
└── 登录错误锁定
```
