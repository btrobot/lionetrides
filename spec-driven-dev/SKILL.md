---
name: spec-driven-dev
description: 规格驱动开发治理 — 当项目已引入形式化规格（YAML Spec），需要按 "Spec 真相源" 驱动审计、修复、测试、回归测试的完整闭环时使用。
---

# Spec Driven Dev

## 何时使用

当用户表达以下任一意图时触发：

- "按 spec 检查代码" / "spec audit" — 审计代码与 spec 的差异
- "根据 spec 写测试" / "按 spec 覆盖测试" — 从 spec 生成测试
- "补回归测试" / "防止回归" — 对历史 Bug 分类补回归测试
- "驱动开发" / "spec-driven" — 启动完整治理闭环
- "P0/P1/P2" / "修复差异" — 按优先级修复 audit 发现的问题

## 核心流程（四阶段闭环）

```
Phase 1: 建模 (Model)
  ↓
Phase 2: 审计修复 (Audit & Fix)
  ↓
Phase 3: 测试覆盖 (Test)
  ↓
Phase 4: 回归防御 (Regression)
```

### Phase 1: 建模 — Spec 建模规范

**触发条件**：项目还没有 spec 文件，或用户要求新增模块的 spec。

**操作步骤**：

1. 读取 `references/spec-template.md`，理解实体/操作/状态机/Rules 四维建模法
2. 为每个业务模块创建 `*.spec.yaml` 文件，放在 `specs/` 目录下
3. 遵循以下原则：
   - **实体（Entity）**：每个业务模块一个，定义字段名、类型、约束、关联
   - **操作（Operation）**：每个实体定义 CRUD + 业务操作，标注入参/出参/权限
   - **状态机（State Machine）**：有状态流转的实体定义状态图，标注合法转换
   - **规则（Rules）**：业务规则、约束条件、边界情况

### Phase 2: 审计修复 — Spec Audit

**触发条件**：spec 文件已存在，需要检查代码是否对齐 spec。

**操作步骤**：

1. 执行 `scripts/audit-compare.ts` 自动扫描 spec 与代码差异
2. 生成差异清单，按优先级分类：
   - **P0（核心功能 missing）**：主流程断裂、认证缺失、关键数据不可写
   - **P1（完整 CRUD）**：模块不全、查询/分页/过滤缺失
   - **P2（工程优化）**：类型收窄、枚举化、软删除、索引优化
3. 逐项修复，每修复完一项重新审计确认
4. 修复完成后更新 `SPEC_AUDIT.md` 覆盖率

**修复原则**：
- 串行修复：P0 → P1 → P2，不可跳跃
- 每次修复后运行 `pnpm ts-check && pnpm test` 验证
- 同一轮次内的错误并行修复，减少循环

### Phase 3: 测试覆盖 — 按 Spec 写测试

**触发条件**：audit 修复完成，需要为每个模块写服务层单元测试。

**操作步骤**：

1. 读取 `references/test-patterns.md` 了解测试模式
2. 执行 `scripts/gen-test-template.ts` 为每个模块生成测试骨架
3. 按以下原则实现测试：
   - **每个操作一条测试**：list/create/update/remove/getById 各一条
   - **每条规则一条测试**：spec 中 Rules 定义的每条业务规则一条测试
   - **每个边界一条测试**：空列表、不存在、权限不足、参数非法
4. 使用工厂模式（`factories/*.factory.ts`）生成测试数据
5. 使用 Mock DB（`mock-db.ts`）隔离数据库依赖

**测试覆盖目标**：
- 语句覆盖率 ≥ 75%
- 分支覆盖率 ≥ 65%
- 函数覆盖率 ≥ 70%

### Phase 4: 回归防御 — 补回归测试

**触发条件**：开发过程中遇到 Bug 修复后，需要防止同类问题再次出现。

**操作步骤**：

1. 读取 `references/regression-categories.md` 了解回归测试分类
2. 对遇到的 Bug 按以下分类补回归测试：
   - **Schema Integrity**：工厂字段 vs DB schema 自动校验
   - **Format Compatibility**：第三方库版本兼容性（如 ZodError.issues vs .errors）
   - **Mock Sequencing**：Mock 链调用顺序（如 db.select 被调用两次的场景）
   - **Edge Cases**：边界值、空数据、并发等
3. 回归测试文件统一放在 `src/__tests__/unit/regression/` 目录下
4. 每次补充回归测试后，确认 CI 门禁包含该测试

## 资源索引

### references/

- `references/spec-template.md`：**新建模块 spec 时必读**。实体/操作/状态机/Rules 四维建模模板，含字段类型对照表和 YAML 示例。
- `references/audit-checklist.md`：**执行 spec audit 时必读**。四维审计检查项清单，含 P0/P1/P2 优先级判定规则。
- `references/test-patterns.md`：**按 spec 写测试时必读**。测试模式说明（每个操作一条 / 每条规则一条 / 每个边界一条），含 Mock DB 和 Factory 使用示例。
- `references/regression-categories.md`：**补回归测试时必读**。五类回归测试分类说明，每类附带触发场景和示例。

### scripts/

- `scripts/audit-compare.ts`：**执行 audit 时运行**。自动扫描 spec 目录下的所有 `*.spec.yaml`，与代码中的服务层/API 路由/DB Schema 对比，输出差异清单。
- `scripts/gen-test-template.ts`：**按 spec 写测试时运行**。读取 spec 文件，为每个模块生成测试文件骨架（含操作列表和规则列表注释）。

## 注意事项

### 必须遵守的规则

1. **Spec 是真相源**：修改业务前先更新 spec，再改代码，最后改测试。顺序不可颠倒。
2. **审计不可跳过**：每次重大变更后必须执行一次 audit，确认覆盖率未下降。
3. **测试不可跳过门禁**：`pnpm gate:commit` 必须通过（lint + ts-check + test + i18n 校验）。
4. **回归测试随 Bug 走**：每修复一个 Bug，必须评估是否需要补回归测试。

### 常见错误

- ❌ 先改代码再更新 spec → 导致 spec 与代码脱节，audit 失效
- ❌ 跳过 P0 直接修 P2 → 核心功能未就绪，工程优化无意义
- ❌ 测试只测 Happy Path → 漏掉边界和规则，等同于没测
- ❌ 回归测试只写一次就不再维护 → 新 Bug 不断出现但检测不到

### 依赖检查

- 项目根目录下必须有 `specs/` 目录，包含 `SPEC_GUIDE.md` 和至少一个 `*.spec.yaml`
- 必须有 `src/__tests__/` 目录和测试基础设施（mock-db.ts、factories/）
- 必须有 `pnpm ts-check` 和 `pnpm test` 命令可用