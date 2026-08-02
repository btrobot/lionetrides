# 游乐设施 B2B 官网 — 测试策略规划

> 版本: v1.0
> 基于测试金字塔 + 质量门禁（Quality Gate）体系

---

## 一、测试金字塔策略

```
           ╱╲
          ╱  ╲          E2E 端到端测试         ~5%
         ╱    ╲         Playwright + MSW
        ╱──────╲
       ╱        ╲      集成测试 (API + 服务)    ~10%
      ╱          ╲     Supertest + MSW
     ╱────────────╲
    ╱              ╲   组件测试 (React)         ~15%
   ╱                ╲  React Testing Library
  ╱──────────────────╲
 ╱                    ╲ 单元测试 (纯逻辑 + DB)   ~70%
╱                      ╲ Vitest + Drizzle Mock
────────────────────────
```

| 层级 | 目标 | 速度 | 数量级 | 维护成本 |
|------|------|------|--------|----------|
| **单元测试** | 验证服务层 / 工具函数 / Zod Schema | 毫秒级 | 数百个 | 低 |
| **组件测试** | 验证 UI 组件渲染 + 交互 | 百毫秒级 | 数十个 | 中 |
| **集成测试** | 验证 API 路由 + 服务与 DB 集成 | 秒级 | 数十个 | 中高 |
| **E2E 测试** | 验证关键业务路径 | 分钟级 | 十余个 | 高 |

---

## 二、测试类型详解

### 2.1 单元测试 (Unit Tests) — 占比 70%

**目标**: 覆盖所有服务层、工具函数、Zod Schema 定义

**工具**: `Vitest` + `vi.mock` (链式调用 Mock)

**覆盖范围**:

| 模块 | 目标覆盖率 | 测试策略 |
|------|-----------|----------|
| **Services** | ≥ 90% 行, ≥ 80% 分支 | 每个公有方法至少 1 个 happy path + 1 个 error case |
| **DB Schema** | ≥ 80% 行 | 表结构验证 + 关系验证 + 默认值验证 |
| **DB 连接** | ≥ 80% 行 | 连接配置 + 环境变量加载 |
| **工具函数** | ≥ 95% 行 | 输入输出边界测试 |
| **Zod Schema** | 100% 行 | 有效数据通过 + 无效数据拒绝 |

**编写规范**:
```
src/__tests__/unit/
├── services/
│   ├── auth.service.test.ts        # 注册/登录/Token 验证
│   ├── product.service.test.ts     # CRUD + 搜索 + 分页 + 软删除
│   ├── inquiry.service.test.ts     # 创建 + 状态机 + 客户查询
│   ├── category.service.test.ts    # 树形 + 多语言 + 软删除
│   ├── brand.service.test.ts       # CRUD + 搜索
│   ├── review.service.test.ts      # 创建 + 审核 + 评分统计
│   └── news.service.test.ts        # CRUD + 多语言 + 分页
├── validations/
│   └── *.test.ts                   # Zod Schema 验证
└── utils/
    └── *.test.ts                   # 工具函数
```

**命名规范**:
```typescript
describe('ProductService', () => {
  describe('create', () => {
    it('应能创建产品并返回完整信息', async () => { ... });
    it('SKU 重复时应抛出错误', async () => { ... });
    it('缺少必填字段时应抛出验证错误', async () => { ... });
  });
  describe('search', () => {
    it('应支持按关键词搜索', async () => { ... });
    it('应支持按分类筛选', async () => { ... });
    it('应支持分页返回', async () => { ... });
    it('空关键词应返回全部产品', async () => { ... });
    it('软删除产品不应出现在搜索结果中', async () => { ... });
  });
});
```

### 2.2 组件测试 (Component Tests) — 占比 15%

**目标**: 验证 React 组件渲染 + 用户交互

**工具**: `Vitest` + `@testing-library/react` + `@testing-library/user-event`

**覆盖范围**:

| 组件 | 优先级 | 测试要点 |
|------|--------|----------|
| Header | P0 | 导航链接渲染、语言切换、移动端汉堡菜单、响应式 |
| Footer | P0 | 链接渲染、公司信息、响应式 |
| ProductCard | P0 | 产品信息渲染、hover 技术参数浮层、询盘按钮触发 |
| CategoryCard | P0 | 分类图标/名称/子分类数、点击跳转 |
| InquiryDialog | P0 | 表单渲染、字段验证、提交、关闭 |
| AnimatedSection | P1 | 元素出现动画触发、IntersectionObserver 行为 |
| CountUp | P1 | 数字动画计数、滚动触发、目标值正确性 |
| Pagination | P0 | 页码渲染、点击切换、当前页高亮、边界条件 |
| StatusBadge | P0 | 不同状态颜色渲染、文字正确性 |
| SearchBar | P0 | 输入搜索、提交、清空、防抖行为 |

**编写规范**:
```typescript
describe('InquiryDialog', () => {
  it('应渲染表单字段: 姓名/邮箱/电话/公司/数量/留言', () => { ... });
  it('提交空表单应显示必填校验错误', async () => { ... });
  it('邮箱格式错误时应显示格式错误提示', async () => { ... });
  it('提交成功应关闭弹窗并显示成功提示', async () => { ... });
  it('取消按钮应关闭弹窗', async () => { ... });
});
```

### 2.3 集成测试 (Integration Tests) — 占比 10%

**目标**: 验证 API 路由与服务的真实集成

**工具**: `Vitest` + `Supertest` + `MSW` (Mock Service Worker)

**覆盖范围**:

| 接口 | 优先级 | 测试要点 |
|------|--------|----------|
| `POST /api/v1/auth` — 注册 | P0 | 新用户注册成功、邮箱重复 409、必填字段缺失 422 |
| `POST /api/v1/auth` — 登录 | P0 | 登录成功返回 token、密码错误 401、用户不存在 404 |
| `GET /api/v1/products` | P0 | 列表返回 + 搜索 + 分页 + 分类筛选 + 排序 |
| `POST /api/v1/inquiries` | P0 | 创建询盘成功 + 关联产品 + 游客也可提交 |
| `GET /api/v1/inquiries` | P0 | 列表返回 + 状态筛选 + 分页 |
| `GET /api/v1/inquiries` — 认证 | P0 | 未认证 401、认证后返回自己的询盘 |

**编写规范**:
```typescript
describe('POST /api/v1/auth', () => {
  it('注册成功应返回 200 + token + 用户信息', async () => { ... });
  it('邮箱重复应返回 409', async () => { ... });
  it('密码太短应返回 422', async () => { ... });
  describe('login', () => {
    it('登录成功应返回 JWT token', async () => { ... });
    it('密码错误应返回 401', async () => { ... });
  });
});
```

### 2.4 API 契约测试 (API Contract Tests) — 新增

**目标**: 验证 API 响应结构的一致性，防止前后端数据格式不匹配

**工具**: `Vitest` + 直接调用工具函数

**背景**: 此前因 `paginatedResponse` 被页面误用（`d.data ?? []` 拿到对象而非数组），导致 `a.map is not a function` 运行时错误。此类测试确保 API 工具函数返回的结构始终符合前端预期。

**覆盖范围**:

| 文件 | 测试项 | 验证点 |
|------|--------|--------|
| `src/__tests__/integration/api-response-structure.test.ts` | `paginatedResponse` | `items` 始终为数组、`totalPages` 计算正确 |
| | `errorResponse` | 不同错误类型映射到正确 HTTP 状态码 |
| | `successResponse` | 数据包装结构一致 |

**编写规范**:
```typescript
describe('paginatedResponse', () => {
  it('items 必须始终是数组', () => {
    const result = paginatedResponse([], 0, { page: 1, pageSize: 10 });
    expect(Array.isArray(result.items)).toBe(true);
  });
});
```

### 2.5 组件测试 — 数据加载路径 (Component Tests) — 新增

**目标**: 覆盖页面从 API 加载数据到渲染的完整路径，确保 API 响应结构变化时前端不崩溃

**工具**: `Vitest` + `@testing-library/react` + `jsdom`

**覆盖范围**（当前已实现）:

| 页面 | 测试场景 | 验证点 |
|------|---------|--------|
| 管理后台 - 分类 | 加载中、正常渲染、空数据、**错误数据结构** | 页面不崩溃，显示正确状态 |
| 前台 - 品牌 | 加载中、正常渲染、空数据 | 页面不崩溃，显示品牌列表 |

**关键测试模式** — 模拟旧 bug 场景：
```typescript
it('API 返回错误结构时页面不崩溃', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: true, data: [...] }), // 数组而非 {items:[]}
  });
  render(<AdminCategories />);
  await waitFor(() => {
    expect(screen.getByText('categories.no_results')).toBeInTheDocument();
  });
});
```

### 2.6 回归测试 (Regression Tests) — 新增

**目标**: 防止已修复的 Bug 再次出现，为每个已知 Bug 建立永久防御

**工具**: `Vitest`

**覆盖范围**（当前已实现）:

| 文件 | 测试数 | 覆盖的 Bug | 验证点 |
|------|--------|-----------|--------|
| `src/__tests__/unit/regression/api-response-shape.test.ts` | 11 | `a.map is not a function` | API 三种响应模式的访问安全（`d.data?.items ?? []` / `d.data ?? []`） |
| `src/__tests__/unit/regression/reviews-pagination.test.ts` | 6 | Reviews API 500 (`count` 变量名冲突) | `paginatedResponse` 边界情况（0/1/大数/NaN） |
| `src/__tests__/unit/regression/i18n-namespace.test.ts` | 6 | `MISSING_MESSAGE: Could not resolve 'home'` | 所有命名空间在 11 种语言中一致性 |
| `src/__tests__/unit/regression/brands-empty-state.test.ts` | 3 | 品牌页空数组无空状态提示 | 空数组/null/undefined 兜底逻辑 |
| `src/__tests__/unit/regression/mock-sequencing.test.ts` | 5 | Mock 调用顺序不一致 | `vi.mock` 链式调用顺序 |
| `src/__tests__/unit/regression/schema-integrity.test.ts` | 17 | DB Schema 46 张表完整性 | 表结构、列名、关系、默认值 |
| `src/__tests__/unit/regression/zod-format.test.ts` | 7 | Zod Schema 验证规则 | 有效数据通过 + 无效数据拒绝 |

**原则**:
- 每个线上/测试发现的 Bug 修复后，**必须**添加至少一个回归测试
- 回归测试名包含 `Reg:` 前缀，便于识别
- 回归测试只测试**已修复的 Bug 场景**，不替代单元测试的完整覆盖率
- 回归测试放在 `src/__tests__/unit/regression/` 目录下

**目标**: 覆盖关键 B2B 业务路径

**工具**: `Playwright` + `MSW` (Mock Service Worker)

**覆盖路径**:

| 路径 | 优先级 | 场景描述 |
|------|--------|----------|
| **游客浏览 → 产品发现 → 发起询盘** | P0 | 核心 B2B 流程：首页 → 产品列表 → 详情 → 询盘弹窗 → 提交 |
| **注册 → 登录 → 查看询盘历史** | P0 | 用户认证流程：注册 → 登录 → 账户中心 → 询盘历史 |
| **管理员登录 → 产品管理 → 处理询盘** | P0 | 管理后台流程：登录 → 仪表盘 → 产品管理 → 询盘处理 |
| **多语言切换 → 浏览产品 → 询盘** | P1 | 国际化流程：切换语言 → 验证本地化内容 → 提交询盘 |
| **响应式移动端 → 汉堡菜单 → 浏览 → 询盘** | P1 | 移动端流程：响应式布局 → 导航 → 产品浏览 → 询盘 |
| **询盘状态流转: 待处理 → 已回复 → 已关闭** | P1 | 询盘全生命周期：管理员回复 → 状态更新 → 客户确认关闭 |

**文件夹结构**:
```
e2e/
├── fixtures/
│   ├── auth.setup.ts         # 认证状态预置（JWT token）
│   └── products.setup.ts     # 产品数据预置
├── specs/
│   ├── inquiry-flow.spec.ts  # 询盘核心流程
│   ├── auth-flow.spec.ts     # 用户认证流程
│   ├── admin-flow.spec.ts    # 后台管理流程
│   └── i18n-flow.spec.ts     # 国际化流程
├── helpers/
│   └── api.ts                # E2E 辅助函数
└── playwright.config.ts      # Playwright 配置
```

---

## 三、覆盖率目标 (Coverage Targets)

### 3.1 分模块目标

| 模块 | 语句 | 分支 | 函数 | 行 | 优先级 |
|------|------|------|------|-----|--------|
| **Services** | ≥ 90% | ≥ 80% | ≥ 90% | ≥ 90% | P0 |
| **DB Schema** | ≥ 80% | — | — | ≥ 80% | P0 |
| **DB 连接** | ≥ 80% | ≥ 80% | 100% | ≥ 80% | P0 |
| **工具函数** | ≥ 95% | ≥ 90% | 100% | ≥ 95% | P0 |
| **Zod Schema** | 100% | 100% | 100% | 100% | P0 |
| **API 路由** | ≥ 80% | ≥ 75% | ≥ 80% | ≥ 80% | P1 |
| **UI 组件** | ≥ 60% | ≥ 50% | ≥ 60% | ≥ 60% | P1 |
| **页面组件** | ≥ 30% | ≥ 25% | ≥ 30% | ≥ 30% | P2 |

### 3.2 整体目标

| 指标 | 当前 | 短期目标 (v1.0) | 长期目标 (v2.0) |
|------|------|-----------------|-----------------|
| **语句覆盖率** | 0% | **≥ 70%** | **≥ 80%** |
| **分支覆盖率** | 0% | **≥ 65%** | **≥ 75%** |
| **函数覆盖率** | 0% | **≥ 50%** | **≥ 70%** |
| **行覆盖率** | 0% | **≥ 70%** | **≥ 80%** |
| **测试总数** | 0 | **≥ 200** | **≥ 500** |

---

## 四、测试比例与数量规划

### 4.1 各类型比例

```
单元测试      70%  ########################################
组件测试      15%  #########
集成测试      10%  ######
E2E 测试       5%  ###
```

### 4.2 各阶段数量目标

| 阶段 | 单元测试 | 组件测试 | 集成测试 | 回归测试 | E2E 测试 | 总计 |
|------|---------|---------|---------|---------|---------|------|
| **当前** | 104 | 7 | 8 | 41 | 0 | **160** |
| **v1.0 目标** | 140 | 30 | 20 | 50 | 5 | **245** |
| **v2.0 目标** | 250 | 60 | 40 | 100 | 10 | **460** |
| **v1.0 短期** | 140 | 30 | 20 | 10 | 200 |
| **v1.5 中期** | 280 | 60 | 40 | 20 | 400 |
| **v2.0 长期** | 350 | 75 | 50 | 25 | 500 |

---

## 五、质量门禁 (Quality Gate)

### 5.1 提交前门禁 (Pre-commit Gate)

在 `package.json` 中配置：

```json
{
  "scripts": {
    "validate": "pnpm dlx concurrently --group --names lint-tsc,lint-build,lint-style,test \"pnpm ts-check\" \"pnpm lint:build\" \"pnpm lint:style\" \"pnpm test\"",
    "gate:commit": "pnpm validate",
    "gate:deploy": "pnpm test:coverage && pnpm test:e2e"
  }
}
```

**门禁规则**:

```
┌─────────────────────────────────────────────────────┐
│                    Pre-commit Gate                    │
│                                                       │
│  1. pnpm ts-check        → ❌ 不允许任何 TS 错误       │
│  2. pnpm lint:build      → ❌ 不允许任何 ESLint 错误    │
│  3. pnpm lint:style      → ❌ 不允许任何 Stylelint 错误 │
│  4. pnpm test            → ✅ 100% 通过                │
│                                                       │
│  全部通过 → ✅ 允许提交                                │
│  任一失败 → ❌ 禁止提交                                │
└─────────────────────────────────────────────────────┘
```

### 5.2 合并请求门禁 (PR Gate)

```
┌─────────────────────────────────────────────────────┐
│                    PR Merge Gate                      │
│                                                       │
│  🔴 必须通过:                                          │
│  ├─ ts-check: 零错误                                  │
│  ├─ lint: 零错误                                      │
│  ├─ test: 100% 通过                                   │
│  ├─ 新增代码覆盖率 ≥ 80%                              │
│  └─ 未引入新的覆盖率下降                               │
│                                                       │
│  🟡 警告但不阻塞:                                      │
│  ├─ 总覆盖率下降 ≥ 2%                                 │
│  └─ 测试文件缺失                                      │
│                                                       │
│  全部通过 → ✅ 允许合并                                │
│  任一 Red → ❌ 阻塞合并                                │
└─────────────────────────────────────────────────────┘
```

### 5.3 部署门禁 (Deploy Gate)

```
┌─────────────────────────────────────────────────────┐
│                    Deploy Gate                        │
│                                                       │
│  🔴 必须通过:                                          │
│  ├─ 所有 PR Gate 条件                                 │
│  ├─ 总覆盖率 ≥ 70% (短期) / ≥ 80% (长期)              │
│  ├─ E2E 关键路径 100% 通过                             │
│  └─ 无 P0/P1 级 Bug                                  │
│                                                       │
│  全部通过 → ✅ 允许部署                                │
│  任一失败 → ❌ 阻塞部署                                │
└─────────────────────────────────────────────────────┘
```

---

## 六、CI/CD 流水线

```yaml
# .github/workflows/test.yml
name: Test & Quality Gate
on: [push, pull_request]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'

      - run: pnpm install

      # 静态检查
      - name: TypeScript Check
        run: pnpm ts-check
      - name: ESLint
        run: pnpm lint:build
      - name: Stylelint
        run: pnpm lint:style

      # 测试
      - name: Unit & Integration Tests
        run: pnpm test:coverage
      - name: Upload Coverage
        uses: codecov/codecov-action@v5
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

      # E2E
      - name: E2E Tests
        run: pnpm test:e2e

      # 覆盖率检查
      - name: Coverage Gate
        run: |
          total=$(npx vitest run --coverage | grep "All files" | awk '{print $4}')
          if [ "$(echo "$total >= 70" | bc)" -eq 1 ]; then
            echo "✅ 覆盖率达标: $total%"
          else
            echo "❌ 覆盖率不达标: $total% < 70%"
            exit 1
          fi
```

---

## 七、基础设施与工具链

### 7.1 需要安装的依赖

```bash
# 测试框架
pnpm add -D vitest @vitejs/plugin-react @vitest/coverage-v8

# React 组件测试
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# HTTP 集成测试
pnpm add -D supertest @types/supertest

# Mock Service Worker
pnpm add -D msw@latest

# E2E 测试
pnpm add -D @playwright/test
pnpm dlx playwright install chromium

# Git hooks
pnpm add -D husky lint-staged
pnpm dlx husky init
echo "pnpm validate" > .husky/pre-commit
```

### 7.2 Vitest 配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/services/**/*.ts',
        'src/lib/**/*.ts',
        'src/db/**/*.ts',
        'src/components/shared/**/*.tsx',
      ],
      exclude: [
        'src/__tests__/**',
        'src/components/ui/**',
        '**/*.d.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 50,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 7.3 测试脚本

更新 `package.json` 中的 scripts：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "validate": "pnpm dlx concurrently --group --names lint-tsc,lint-build,lint-style,test \"pnpm ts-check\" \"pnpm lint:build\" \"pnpm lint:style\" \"pnpm test\"",
    "gate:commit": "pnpm validate",
    "gate:deploy": "pnpm test:coverage && pnpm test:e2e"
  }
}
```

---

## 八、Mock 策略

### 8.1 分层 Mock 体系

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mock 策略体系                              │
│                                                                   │
│  单元测试         链式调用 Mock (vi.mock + Proxy)                   │
│                  → 模拟 db 对象，返回预定数据                      │
│                  → 模拟 bcrypt 等外部依赖                          │
│                                                                   │
│  组件测试         MSW (Mock Service Worker)                       │
│                  → 模拟 API 请求响应                               │
│                  → 验证组件在不同数据状态下的渲染                  │
│                                                                   │
│  集成测试         MSW + 真实 Service 实例                         │
│                  → 模拟下游依赖 (支付/物流)                       │
│                  → 真实路由 + 真实 Controller                     │
│                                                                   │
│  E2E 测试         MSW (可选，用于支付/第三方)                     │
│                  → 端到端真实用户操作                              │
│                  → 关键路径使用真实数据库                          │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 链式调用 Mock 模板

```typescript
// src/__tests__/unit/helpers/mock-db.ts
import { vi } from 'vitest';

export function createMockDb() {
  const defaultInsertReturn = [{ id: 1, createdAt: new Date() }];
  const defaultSelectReturn: any[] = [];

  const mockDb = {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve(defaultInsertReturn)),
      })),
    })),
    select: vi.fn(() => createSelectMock(defaultSelectReturn)),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve(defaultInsertReturn)),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve(defaultInsertReturn)),
      })),
    })),
  };

  return mockDb;
}

function createSelectMock(returnValue: any[]) {
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(() => Promise.resolve(returnValue)),
              })),
            })),
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve(returnValue)),
            })),
          })),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve(returnValue)),
            })),
          })),
          limit: vi.fn(() => ({
            offset: vi.fn(() => Promise.resolve(returnValue)),
          })),
        })),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            offset: vi.fn(() => Promise.resolve(returnValue)),
          })),
        })),
        limit: vi.fn(() => ({
          offset: vi.fn(() => Promise.resolve(returnValue)),
        })),
      })),
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          offset: vi.fn(() => Promise.resolve(returnValue)),
        })),
      })),
      limit: vi.fn(() => ({
        offset: vi.fn(() => Promise.resolve(returnValue)),
      })),
    })),
  };
}
```

---

## 九、测试数据管理

### 9.1 工厂模式

```typescript
// src/__tests__/factories/product.factory.ts
export function buildProduct(overrides = {}) {
  return {
    id: 1,
    sku: `SKU-${Date.now()}`,
    name: '测试过山车',
    price: '99999.00',
    weight: '5000.00',
    status: true,
    brandId: 1,
    categoryId: 1,
    sortOrder: 0,
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildProductList(count: number) {
  return Array.from({ length: count }, (_, i) =>
    buildProduct({ id: i + 1, sku: `SKU-${i + 1}`, name: `产品 ${i + 1}` })
  );
}

// src/__tests__/factories/inquiry.factory.ts
export function buildInquiry(overrides = {}) {
  return {
    id: 1,
    name: '张三',
    email: 'zhangsan@test.com',
    phone: '13800138000',
    company: '欢乐谷主题乐园',
    quantity: 2,
    message: '请提供报价和交货周期',
    status: 'pending',
    productId: 1,
    customerId: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}
```

### 9.2 数据隔离

- 每个测试用例使用独立的数据
- 测试间不共享状态
- 使用 `beforeEach` 重置 Mock
- 避免测试间的时序依赖
- 工厂函数使用 `Date.now()` 保证唯一性

---

## 十、最佳实践清单

### 10.1 通用规则

- [ ] 每个测试只测一个行为（Single Responsibility）
- [ ] 测试命名使用中文描述业务场景（`应能...` / `当...时应...`）
- [ ] 遵循 AAA 模式：Arrange → Act → Assert
- [ ] 不测试框架/库本身的行为
- [ ] 不测试私有方法（通过公有方法间接测试）
- [ ] 避免 Mock 过度（Mock 边界，测试内部）
- [ ] 快照测试仅在必要时使用（UI 组件）

### 10.2 服务层测试规则

- [ ] Mock 数据库层，测试业务逻辑
- [ ] 覆盖所有公有方法
- [ ] 每个方法至少 1 个 happy path + 1 个 error case
- [ ] 覆盖边界条件（空数据、极限值、重复值）
- [ ] 状态机测试：验证所有合法流转 + 非法流转拒绝
- [ ] 软删除测试：查询必须过滤 `deleted_at IS NULL`

### 10.3 组件测试规则

- [ ] 使用 `@testing-library/user-event` 模拟用户交互
- [ ] 优先测试用户可见行为（渲染/交互）
- [ ] 避免测试实现细节（内部状态/DOM 结构）
- [ ] 测试无障碍（aria-label、role）
- [ ] 响应式组件测试多种窗口尺寸

### 10.4 API 测试规则

- [ ] 测试 HTTP 状态码（200/201/400/401/404/409/422/500）
- [ ] 测试响应体结构（JSON Schema）
- [ ] 测试错误消息内容
- [ ] 测试认证与权限（游客/客户/管理员）
- [ ] 测试速率限制（429）

### 10.5 E2E 测试规则

- [ ] 覆盖核心 B2B 用户旅程（Happy Path）
- [ ] 使用 Page Object 模式
- [ ] 避免测试静态页面（那是集成测试的职责）
- [ ] 保持测试数量少而精（关键路径 > 边缘场景）
- [ ] 测试国际化页面多语言内容正确性

---

## 十一、红线与降级策略

### 11.1 红线 (Red Lines)

| 规则 | 严重级别 | 说明 |
|------|---------|------|
| 不允许有 `any` 类型绕过 | 🔴 阻塞 | 禁止 `as any` 或 `// @ts-ignore` 跳过测试 |
| 不允许 Mock 真实 HTTP 请求 | 🔴 阻塞 | 必须使用 MSW 或 vi.mock |
| 不允许测试间共享可变状态 | 🔴 阻塞 | 每个测试用例必须独立 |
| 不允许跳过失败测试 | 🔴 阻塞 | 禁止 `test.skip` 或 `xit` |
| 不允许覆盖率 < 70% 部署 | 🔴 阻塞 | 低于阈值禁止部署 |
| 不允许跳过软删除校验 | 🔴 阻塞 | 所有查询必须过滤 `deleted_at IS NULL` |

### 11.2 降级策略

| 场景 | 处理方式 |
|------|----------|
| 紧急修复需要跳过测试 | 需团队审批 + 48 小时内补测 |
| 覆盖率暂时下降 | 记录 TODO + 下个迭代修复 |
| 第三方依赖不稳定 | 使用 MSW 模拟 + 标记集成测试为可选 |
| E2E 环境不可用 | 回退到集成测试覆盖关键路径 |
| 数据库不可用 | 使用 Mock DB 完成单元测试 |

---

## 十二、监控与度量

### 12.1 持续追踪指标

- 测试通过率（目标: 100%）
- 测试覆盖率（目标: 持续上升）
- 测试执行时间（目标: 单次 < 5 分钟）
- 测试与代码行数比（目标: 1:3 ~ 1:5）
- 失败测试修复时间（目标: < 2 小时）

### 12.2 报告

```bash
# 生成覆盖率报告
pnpm test:coverage
# 输出: coverage/index.html (可视化报告)
# 输出: coverage/coverage-summary.json (机器可读数据)

# 生成 JUnit 格式报告（CI 集成）
pnpm test -- --reporter=junit --outputFile=test-results.xml
```