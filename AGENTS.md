# AGENTS.md

## 项目概述
游乐设施制造与销售公司 B2B 企业官网。技术栈：Next.js 16 (App Router) + TypeScript 5 + Tailwind CSS 4 + shadcn/ui + PostgreSQL + Drizzle ORM + next-intl。

## 规格建模（Specs）
项目采用形式化规格（Formal Specification）驱动开发，详见 `specs/` 目录。

- **SPEC_GUIDE.md** — 规格建模指南与规范
- **SPEC_INDEX.md** — 规格索引与实体关系
- **`*.spec.yaml`** — 每个业务模块的完整规格（实体/操作/状态机/规则）

**开发原则**：数据库 Schema、API 路由、业务逻辑、测试用例都必须与 spec 保持一致。修改业务前，先更新对应 spec 文件。

## 目录结构
```
src/
├── app/
│   ├── [locale]/           # 国际化路由
│   │   ├── page.tsx        # 首页
│   │   ├── layout.tsx      # 本地化布局
│   │   ├── products/       # 产品页面
│   │   ├── categories/     # 分类页面
│   │   ├── brands/         # 品牌页面
│   │   ├── news/           # 新闻页面
│   │   ├── about/          # 关于我们
│   │   ├── account/        # 用户账户
│   │   ├── auth/           # 登录注册
│   │   └── admin/          # 管理后台
│   ├── api/v1/             # REST API
│   ├── layout.tsx          # 根布局
│   └── globals.css         # 全局样式
├── components/
│   ├── shared/             # 共享组件
│   │   ├── header.tsx       # 导航栏
│   │   ├── footer.tsx       # 页脚
│   │   ├── inquiry-dialog.tsx # 询盘弹窗
│   │   ├── animated-section.tsx # 入场动画
│   │   └── count-up.tsx     # 计数动画
│   └── ui/                 # shadcn/ui 组件
├── db/
│   ├── schema.ts           # 数据库 Schema（46 张表）
│   └── index.ts            # 数据库连接
├── i18n/
│   ├── routing.ts          # 路由配置
│   ├── request.ts          # 请求配置
│   └── messages/           # 多语言 JSON
├── middleware.ts           # next-intl 中间件
├── lib/
│   └── utils.ts            # 工具函数
└── server.ts               # 自定义服务端入口
```

## 构建和测试命令
- `pnpm dev` — 启动开发服务器
- `pnpm build` — 构建生产版本
- `pnpm ts-check` — TypeScript 类型检查
- `pnpm lint` — ESLint 检查
- `pnpm validate` — 完整验证

## 路由结构
- 前台：/, /products, /products/[id], /categories, /brands, /news, /news/[id], /about
- 账户：/account/inquiries
- 认证：/auth/login, /auth/register
- 管理：/admin, /admin/products, /admin/categories, /admin/brands, /admin/inquiries, /admin/customers, /admin/reviews, /admin/settings
- API：/api/v1/inquiries, /api/v1/products, /api/v1/auth

## 设计规范
- 主色：蓝色 #2563eb
- 强调色：橙色 #F97316
- 字体：Rubik（标题）+ Nunito Sans（正文）
- 布局：max-w-7xl 居中，大区块呼吸感

## 关键业务逻辑
- 询盘系统替代购物车（B2B 模式）
- 产品卡片 hover 展示技术参数浮层
- 支持 11 种语言的国际化

## 代码风格指南
- TypeScript strict 模式
- 组件使用 'use client' 或服务端组件
- 文件名使用 kebab-case
- 数据库列名使用 snake_case
## Docker 部署命令
- `./docker-build.sh` — 构建 Docker 镜像
- `./docker-run.sh` — 运行容器
- `./docker-stop.sh` — 停止容器
- `./docker-build.sh --no-cache` — 完全重新构建
- `./docker-build.sh --clean` — 构建前清理缓存
