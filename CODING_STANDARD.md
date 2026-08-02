# Coding Standard

## 治理哲学

```
原型期（宽松） → 提交门禁（守住基线） → 周期治理（集中清理）
```

**原则：规则服务于开发效率，不是反过来。**

---

## 核心规范

### 1. TypeScript
- **禁止 `any`** — 原型期可临时加 `// TODO: type`，周期治理时统一清理
- **禁止未使用变量/导入** — 声明了就用，用不到就删
- **函数参数标注类型** — 禁止隐式 `any` 参数

### 2. React / Next.js
- **服务端组件优先**，`'use client'` 下推到叶子节点
- **JSX 文本转义** — `'` 用 `&apos;`，`<` 用 `&lt;`
- **Hydration 安全** — 浏览器 API 放 `useEffect` + `useState`

### 3. 国际化
- **新文本先加 `en.json`**（真相源），再加 `zh.json`，然后 `pnpm sync:i18n`
- **禁止硬编码用户可见文本** — 统一走 `useTranslations()` / `getTranslations()`

### 4. 测试
- **测试金字塔**：单元 > 组件 > 集成 > E2E
- **禁止 `any`**、禁止 `test.skip` 提交、禁止 `new Date()`（用 `vi.setSystemTime()`）

### 5. 数据库
- 列名 `snake_case`，代码属性 `camelCase`
- 业务表包含 `deleted_at`（软删除）、`created_at`、`updated_at`

---

## 治理流程

| 环节 | 做什么 | 严格度 |
|------|--------|--------|
| **原型开发** | 快速验证，不阻塞 | 宽松 |
| **提交前** | `pnpm gate:commit`（lint + ts-check + test） | 新增代码零容忍 |
| **周期治理** | 每 3~5 个功能模块集中清理一次 | 集中收紧 |

**存量已清理过基线，只盯新增代码即可。**