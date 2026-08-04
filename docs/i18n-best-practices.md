# 多语言国际化 (i18n) 最佳实践

## 架构概览

项目采用 **三层内容管理架构**，使用 next-intl 库实现国际化。

```
┌─────────────────────────────────────────────────────────────┐
│                    内容类型分类                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  第一层：静态 UI 文案 (i18n JSON)                           │
│  ├── 导航菜单 (nav.home, nav.products)                      │
│  ├── 按钮文字 (hero.cta_products)                           │
│  ├── 表单标签 (auth.email, auth.password)                   │
│  ├── 错误提示 (common.error)                                │
│  └── SEO 元数据 (meta.title, meta.description)              │
│                                                             │
│  第二层：动态业务内容 (site_settings 数据库)                │
│  ├── 公司信息 (company_name, contact_address)               │
│  ├── 关于我们 (about_hero_title, about_mission_desc)        │
│  ├── 团队信息 (about_team JSON)                             │
│  └── 里程碑 (about_milestones JSON)                         │
│                                                             │
│  第三层：用户生成内容 (数据库表)                            │
│  ├── 产品数据 (products 表)                                 │
│  ├── 新闻文章 (news 表)                                     │
│  ├── 分类/品牌 (categories/brands 表)                       │
│  ── 询盘记录 (inquiries 表)                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 内容分类与存储策略

### 分类一：静态 UI 文案

**特征**：
- 界面元素文字（按钮、标签、提示）
- 数量固定，不常变动
- 需要严格的多语言对照

**存储位置**：`src/i18n/messages/*.json`

**示例**：
```json
{
  "nav": { "home": "Home", "products": "Products" },
  "hero": { "cta_products": "Explore Products" }
}
```

**使用方式**：
```tsx
const t = useTranslations('nav');
<button>{t('home')}</button>
```

**最佳实践**：
1. 按功能模块分组（nav, hero, products, auth...）
2. 使用语义化 key（`hero.cta_products` 而非 `button1`）
3. 支持插值（`"products_count": "{count} products"`）
4. 保持 JSON 结构扁平（最多 2-3 层嵌套）

---

### 分类二：公司配置信息

**特征**：
- 公司名称、联系方式、地址
- 联系信息全局统一，不随语言变化
- 地址、描述等需要多语言版本

**存储位置**：PostgreSQL `site_settings` 表

**示例**：
```sql
-- 联系信息（所有语言相同）
INSERT INTO site_settings (key, value, locale, section) VALUES
('contact_phone', '13800138000', 'en', 'contact'),
('contact_phone', '13800138000', 'zh', 'contact');

-- 地址（不同语言不同）
INSERT INTO site_settings (key, value, locale, section) VALUES
('contact_address', 'No.88 Industrial Ave...', 'en', 'contact'),
('contact_address', '广州市工业大道 88 号', 'zh', 'contact');
```

**使用方式**：
```tsx
const config = useSiteConfig();
<div>{config.contact_phone}</div>  // 所有语言显示相同电话
```

**最佳实践**：
1. 联系信息（电话/邮箱/联系人）：所有 locale 存储相同值
2. 地址/描述：按 locale 存储不同翻译
3. 提供管理后台：让运营人员自行维护

---

### 分类三：动态业务内容

**特征**：
- 产品、新闻、分类等
- 内容量大，频繁更新
- 需要完整的多语言支持

**存储位置**：PostgreSQL 各业务表（含 `locale` 字段）

**示例**：
```sql
-- 产品表
INSERT INTO products (id, name, locale, description) VALUES
(1, 'Roller Coaster X1', 'en', '...'),
(1, '过山车 X1', 'zh', '...');
```

**使用方式**：
```tsx
// 按 locale 查询
const products = await db.query.products.findMany({
  where: eq(products.locale, locale)
});
```

**最佳实践**：
1. 数据库表设计：每条记录包含 `locale` 字段
2. 查询时过滤：始终按当前 locale 查询
3. 回退机制：如果当前 locale 无数据，回退到默认 locale（en）

---

## 关键设计原则

| 原则 | 说明 | 示例 |
|------|------|------|
| **关注点分离** | UI 文案与业务数据分开管理 | 按钮文字在 JSON，产品名称在数据库 |
| **单一数据源** | 每种内容类型只有一个存储位置 | 联系信息只在 site_settings |
| **回退机制** | 缺失翻译时回退到默认语言 | 产品无中文版时显示英文 |
| **类型安全** | TypeScript 类型约束 | `SiteConfig` 接口定义所有配置项 |
| **运营友好** | 非技术人员可维护内容 | 管理后台编辑，无需改代码 |

---

## 当前项目评估

| 维度 | 评分 | 说明 |
|------|------|------|
| **架构设计** | ⭐⭐⭐⭐⭐ | 三层分离清晰，职责明确 |
| **工具链** | ⭐⭐⭐⭐⭐ | next-intl + 自动同步 + AI 翻译 |
| **数据库设计** | ⭐⭐⭐⭐⭐ | locale 字段设计合理 |
| **管理后台** | ⭐⭐⭐ | 已有 API，前端界面待完善 |
| **回退机制** | ⭐⭐⭐⭐ | 部分实现，可加强 |

---

## 改进计划

### P0 - 立即实施
1. **完善 site_settings 数据**：填充所有多语言配置项
2. **添加管理后台界面**：`/admin/settings` 页面

### P1 - 短期优化
1. **统一回退逻辑**：创建 `useLocaleContent` hook 统一处理回退
2. **添加翻译进度指示**：显示各语言翻译完成度

### P2 - 长期规划
1. **内容版本控制**：业务数据支持草稿/发布流程
2. **翻译工作流**：支持翻译人员协作

---

## 附录：现有 i18n JSON 结构

```
en.json (484 行)
── site          # 站点基本信息
├── meta          # SEO 元数据
├── nav           # 导航菜单
├── hero          # 首页 Hero 区
├── stats         # 统计数据
├── categories    # 分类页面
├── products      # 产品页面
├── inquiry       # 询盘功能
├── auth          # 登录注册
├── certifications # 认证资质
├── partners      # 合作伙伴
├── news          # 新闻页面
├── footer        # 页脚
├── common        # 通用文案
├── process       # 流程说明
├── home          # 首页专属
├── brands        # 品牌页面
├── account       # 账户页面
├── contact       # 联系页面
── search        # 搜索页面
└── admin         # 管理后台
    ├── sidebar
    ├── dashboard
    ├── products
    ├── categories
    ├── brands
    ├── inquiries
    ├── customers
    ├── reviews
    └── settings
```
