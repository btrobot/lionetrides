# AGENTS.md

## 项目概述
游乐设施制造与销售公司 B2B 企业官网。技术栈：Next.js 16 (App Router) + TypeScript 5 + Tailwind CSS 4 + shadcn/ui + PostgreSQL + Drizzle ORM + next-intl。

## 编码规范
详见 `CODING_STANDARD.md`。治理哲学：**原型期不阻塞，提交前守门禁，周期集中治理**。

## 规格建模（Specs）
项目采用形式化规格（Formal Specification）驱动开发，详见 `specs/` 目录。

- **SPEC_GUIDE.md** — 规格建模指南与规范
- **SPEC_INDEX.md** — 规格索引与实体关系
- **SPEC_AUDIT.md** — 最新 Spec 审计报告（代码 vs spec 差异清单）
- **`*.spec.yaml`** — 每个业务模块的完整规格（实体/操作/状态机/规则）

**开发原则**：数据库 Schema、API 路由、业务逻辑、测试用例都必须与 spec 保持一致。修改业务前，先更新对应 spec 文件。

**审计流程**：每次重大变更后，执行 `specs/SPEC_AUDIT.md` 中列出的审计检查项，确保代码与 spec 对齐。当前覆盖率 47%（134/287），目标 100%。

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
- `pnpm validate` — 完整验证（lint + ts-check + test）
- `pnpm test` — 运行所有测试（213 个）
- `pnpm test:watch` — 监听模式运行测试
- `pnpm test:coverage` — 运行测试 + 覆盖率报告
- `pnpm test:e2e` — 运行 Playwright E2E 端到端测试（25 个场景）
- `pnpm test:e2e:ui` — 以 UI 模式运行 Playwright E2E 测试
- `pnpm gate:commit` — 提交前门禁（lint + ts-check + test + i18n 校验）
- `pnpm validate:i18n` — 校验 11 种语言文件一致性（以 en.json 为真相源）
- `pnpm sync:i18n` — 将 en.json 缺失的键同步到所有语言文件（标记 [TODO: translate]）
- `pnpm translate:i18n` — 使用 AI 大模型自动翻译 `[TODO: translate]` 标记的条目
- `pnpm translate:i18n --lang=ja` — 只翻译日语
- `pnpm translate:i18n --dry-run` — 仅列出待翻译条目，不实际翻译
- `pnpm translate:i18n --model=kimi-k2-5-260127` — 使用指定模型翻译

## i18n 维护流程

项目使用 `next-intl` 支持 11 种语言，以 `src/i18n/messages/en.json` 为真相源。

### 添加新翻译键
1. 在 `en.json` 中添加键和英文值
2. 在 `zh.json` 中添加对应中文翻译
3. 运行 `pnpm sync:i18n` — 自动将缺失的键同步到其他 9 种语言（标记 `[TODO: translate]`）
4. 运行 `pnpm translate:i18n` — 使用 AI 自动翻译所有 `[TODO: translate]` 标记的条目

### 删除/重命名键
1. 更新 `en.json` 后运行 `pnpm validate:i18n` — 会报告多余键
2. 手动清理其他语言文件中的多余键，或全量同步

### 校验规则
- **缺失键**：键在 en.json 中存在但目标语言缺失 → 报错
- **多余键**：键在目标语言中存在但 en.json 中已删除 → 报错
- **未翻译值**：键值等于英文原文（中例外） → 警告
- **空值**：键值为空字符串 → 警告

### 门禁集成
`pnpm gate:commit` 会自动运行 `pnpm validate:i18n`，确保不一致的翻译文件无法提交。

## 测试治理规范（必须遵守）

详见 `TEST_PLAN.md`。以下为必须遵守的简要规范：

### 测试金字塔
```
70% 单元测试 (Unit)     — 服务层（services/）、工具函数（lib/）
15% 组件测试 (Component) — 共享组件（components/shared/）
10% 集成测试 (Integration) — API 路由（app/api/）
 5% 端到端测试 (E2E)     — 关键用户流程（e2e/）
```

### 测试文件规范
- **单元测试**: `src/__tests__/unit/**/*.test.ts` — 测试服务层函数、工具函数
- **组件测试**: `src/__tests__/component/**/*.test.tsx` — 测试 React 组件渲染与交互
- **集成测试**: `src/__tests__/integration/**/*.test.ts` — 测试 API 路由端到端
- **E2E 测试**: `e2e/**/*.spec.ts` — Playwright 端到端测试（25 个场景覆盖首页/产品/分类/品牌/新闻/关于/认证/API）
- **工厂函数**: `src/__tests__/factories/*.factory.ts` — 测试数据生成
- **测试工具**: `src/__tests__/unit/helpers/*.ts` — Mock 辅助函数

### 覆盖率目标（硬性门禁）
| 维度 | 目标 | 红线 |
|------|------|------|
| 语句 (statements) | ≥ 75% | < 50% 阻挡合并 |
| 分支 (branches) | ≥ 65% | < 40% 阻挡合并 |
| 函数 (functions) | ≥ 70% | < 50% 阻挡合并 |
| 行 (lines) | ≥ 75% | < 50% 阻挡合并 |

### 质量门禁
```
Pre-commit (pnpm gate:commit)
  ├── pnpm lint          — ESLint 零错误
  ├── pnpm ts-check      — TypeScript 零错误
  └── pnpm test          — 全部测试通过 + 覆盖率达标

PR (GitHub Actions)
  ├── 同 Pre-commit
  ├── pnpm test:coverage — 覆盖率报告上传
  └── 审查覆盖率下降趋势

Deploy
  ├── 同 PR
  └── E2E 测试通过
```

### 测试红线（严格禁止）
- ❌ 禁止使用 `any` 绕过类型检查
- ❌ 禁止 Mock 真实 HTTP 请求（使用 MSW 或 nock）
- ❌ 禁止测试间共享可变状态（每个测试独立 factory）
- ❌ 禁止在测试中访问真实数据库
- ❌ 禁止跳过覆盖率阈值的提交
- ❌ 禁止 `test.skip` / `it.skip` 提交（临时调试除外）
- ❌ 禁止直接 `new Date()` 或 `Date.now()`（使用 `vi.setSystemTime()`）

### 测试基础设施
- **框架**: Vitest 4.x
- **组件测试**: @testing-library/react + jsdom
- **Mock 数据库**: `src/__tests__/unit/helpers/mock-db.ts`（Drizzle 链式调用 Mock）
- **工厂模式**: `factories/*.factory.ts` 生成测试数据（faker.js 辅助）
- **环境变量**: 测试自动加载 `.env.test`

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
- 详见 `CODING_STANDARD.md` 完整规范
## Docker 部署命令
- `./docker-build.sh` — 构建 Docker 镜像
- `./docker-run.sh` — 运行容器（启动后自动执行 smoke 测试）
- `./docker-stop.sh` — 停止容器
- `./docker-build.sh --no-cache` — 完全重新构建
- `./docker-build.sh --clean` — 构建前清理缓存
- `./docker-smoke-test.sh` — 独立运行 smoke 测试（容器健康 + 页面可达 + API 响应 + 日志检查）

## 部署治理原则（硬性规则）

### 原则一：GitHub 是唯一部署权威来源
**所有生产环境的代码变更，必须经由 GitHub 仓库流转，严禁从开发环境（沙箱/本地）直接向生产服务器传输代码。**

```
开发环境 (Sandbox)  ──push──→  GitHub  ──pull/build──→  生产服务器
     ✗ 不允许直传                    ↑ 权威来源              仅从 GitHub 拉取
```

### 原则二：部署流程
1. 在沙箱开发并验证（`pnpm validate`、`pnpm test` 全部通过）
2. `git push` 到 GitHub（需通过门禁：lint + ts-check + test）
3. 生产服务器 `git pull` 拉取最新代码
4. 生产服务器执行 `docker-build.sh` 构建镜像
5. 生产服务器执行 `docker-run.sh` 部署运行

### 原则三：禁止行为（红线）
- ❌ 禁止通过 scp/rsync/直接编辑 等方式将沙箱代码传输到生产服务器
- ❌ 禁止直接在生产服务器上修改业务代码
- ❌ 禁止将未经过 GitHub 的代码直接部署
- ❌ 禁止跨 worktree 操作生产服务器文件

### 原则四：生产服务器只读
- 生产服务器 `git pull` 仅拉取已推送到 GitHub 的代码
- 生产服务器上的 `.env.local` 等配置文件的变更应记录到文档
- 生产服务器上的 Docker 配置变更应先提交到 GitHub 再部署
