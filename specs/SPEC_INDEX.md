# Specs 索引

## 项目规格总览

```
specs/
├── README.md          # NodeCoda 建模机制分析
├── SPEC_GUIDE.md      # 本项目的规格建模指南
├── SPEC_INDEX.md      # 本文件 — 规格索引
│
├── auth.spec.yaml          # Layer 0 — 用户认证与权限
├── settings.spec.yaml      # Layer 0 — 站点配置与统计
├── certification.spec.yaml # Layer 0 — 认证资质
├── partner.spec.yaml       # Layer 0 — 合作伙伴
│
├── brand.spec.yaml         # Layer 1 — 品牌管理
├── category.spec.yaml      # Layer 1 — 产品分类
├── news.spec.yaml          # Layer 1 — 新闻动态
│
├── product.spec.yaml       # Layer 2 — 产品核心
│
├── customer.spec.yaml      # Layer 3 — 客户管理
├── inquiry.spec.yaml       # Layer 3 — 询盘系统
│
└── review.spec.yaml        # Layer 4 — 客户评价
```

## 实体关系图

```
Auth ──→ Customer ──→ Inquiry ──→ Review
 │                          │
 │                    ┌─────┘
 │                    ▼
Settings ──→ Product ←─── Category
 │             │
 │             ├──→ Brand
 │             ├──→ ProductDescription (多语言)
 │             └──→ ProductImage
 │
Certification    News
 │
Partner       TeamMember
```

## 关键业务流

### 询盘（核心业务）
```
Customer → 浏览 Product → 点击 "Send Inquiry" → 填写 Inquiry
  → Inquiry.status = pending
  → Admin 回复 → InquiryMessage → Inquiry.status = responded
  → Admin 关闭 → Inquiry.status = closed
  → Customer 可以查看历史询盘
```

### 产品管理
```
Admin → 创建 Category → 创建 Brand → 创建 Product
  → Product 关联 Category + Brand
  → Product 关联 ProductDescription (多语言)
  → Product 关联 ProductImage
  → 前台展示 Product
```

## 状态机汇总

| 实体 | 状态 | 初始 | 可能的最终状态 |
|------|------|------|----|
| Inquiry | pending / responded / closed | pending | closed |
| Review | pending / approved / rejected | pending | approved / rejected |