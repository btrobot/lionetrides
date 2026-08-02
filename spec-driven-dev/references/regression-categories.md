# 回归测试分类

## 为什么需要分类

每次修复 Bug 后，开发者的直觉是"加一个测试用例验证修好了"。但这不是回归测试的完整价值——回归测试的真正目标是**防止同类问题再次出现**。

按分类补回归测试，可以确保同类 Bug 不会重复出现。

---

## 分类一：Schema Integrity（Schema 完整性）

### 触发场景
- 工厂字段名与 DB schema 字段名不匹配
- DB schema 中某列改名了，但服务层/工厂中未同步更新
- 新增字段后，测试数据未包含该字段

### 回归测试示例

```typescript
describe('schema integrity', () => {
  const schemaTables = {
    categories: ['id', 'name', 'slug', 'description', 'sort_order', 'is_active', 'created_at', 'updated_at', 'deleted_at', 'icon', 'image_url', 'parent_id'],
    // ... 所有表及其字段
  };

  it('category factory 字段应与 schema 一致', () => {
    const item = buildCategory();
    for (const field of schemaTables.categories) {
      expect(item).toHaveProperty(field);
    }
  });

  it('category factory 不应有多余字段', () => {
    const item = buildCategory();
    const keys = Object.keys(item);
    const extra = keys.filter(k => !schemaTables.categories.includes(k));
    expect(extra).toEqual([]);
  });
});
```

### 防御目标
防止工厂字段与 DB schema 脱节，杜绝 `image` vs `image_url` 类问题。

---

## 分类二：Format Compatibility（格式兼容性）

### 触发场景
- 第三方库大版本升级，API 不兼容（如 Zod v3→v4 的 `.errors` → `.issues`）
- 枚举值变更（如状态枚举新增/删除/重命名）
- 错误码格式变更

### 回归测试示例

```typescript
describe('zod format compatibility', () => {
  it('ZodError 应使用 .issues 而非 .errors', () => {
    // Zod v4 使用 .issues，v3 使用 .errors
    const schema = z.object({ name: z.string().min(1) });
    const result = schema.safeParse({ name: '' });
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(Array.isArray(result.error.issues)).toBe(true);
    }
  });

  it('Zod v4 错误码应包含预期格式', () => {
    // Zod v4 错误码（如 invalid_string, too_small 等）
    const schema = z.string().email();
    const result = schema.safeParse('not-an-email');
    if (!result.success) {
      expect(result.error.issues[0].code).toMatch(/^invalid_/);
    }
  });
});
```

### 防御目标
防止第三方库升级导致运行时崩溃，确保兼容性在 CI 阶段被捕获。

---

## 分类三：Mock Sequencing（Mock 链调用顺序）

### 触发场景
- 服务层中 `db.select` 被多次调用（如 list 操作先 count 再 items）
- Mock 链没有正确区分第一次和第二次调用
- `mockReturnValue`（返回同一个值）误用为 `mockReturnValueOnce`（分次返回值）

### 回归测试示例

```typescript
describe('mock sequencing', () => {
  it('mockReturnValueOnce 应区分先后调用', async () => {
    const fn = vi.fn();
    fn.mockReturnValueOnce('first')
      .mockReturnValueOnce('second');

    expect(fn()).toBe('first');
    expect(fn()).toBe('second');
    expect(fn()).toBe(undefined); // 第三次调用无返回值
  });

  it('list 操作应正确区分 count 和 items 查询', async () => {
    const mockDb = createMockDb();
    mockDb.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([{ count: 3 }])),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([{ id: 1 }, { id: 2 }, { id: 3 }])),
      });

    // 模拟 list 操作
    const countResult = await mockDb.select.mock.results[0].value.then;
    const itemsResult = await mockDb.select.mock.results[1].value.then;

    // 验证 count 和 items 的 mock 链结构不同
    expect(mockDb.select.mock.calls.length).toBe(2);
  });
});
```

### 防御目标
防止 `db.select` 多次调用场景下，Mock 返回错误数据导致 `total` 为 NaN 或 `undefined`。

---

## 分类四：Edge Cases（边界值）

### 触发场景
- 空列表（无数据时 list 返回空数组而非 null）
- 不存在的数据（getById 传入不存在 ID）
- 非法参数（负数 page、超大 pageSize）
- 并发操作（同一数据同时被更新或删除）
- 权限边界（普通用户访问管理员接口）

### 回归测试示例

```typescript
describe('edge cases', () => {
  it('空列表应返回空数组而非 null', async () => {
    mockDb.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([{ count: 0 }])),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

    const result = await productService.list({ page: 1, pageSize: 20 });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('不存在的数据应抛出 NotFoundError', async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: any) => resolve([])),
    });

    await expect(productService.getById(999)).rejects.toThrow('not found');
  });
});
```

### 防御目标
防止空数据、错误数据、越界数据导致运行时异常而非优雅的错误处理。

---

## 分类五：Async State（异步状态）

### 触发场景
- 异步操作未等待（await 缺失）
- Promise 链中的状态未正确同步
- 事件监听/定时器未清理

### 回归测试示例

```typescript
describe('async state', () => {
  it('异步操作应被 await', async () => {
    let completed = false;
    const asyncOp = vi.fn().mockResolvedValue('done');

    const result = await asyncOp();
    expect(result).toBe('done');
    expect(asyncOp).toHaveBeenCalledTimes(1);
  });
});
```

---

## 回归测试文件组织

```
src/__tests__/unit/regression/
├── schema-integrity.test.ts   # 分类一
├── zod-format.test.ts          # 分类二
├── mock-sequencing.test.ts     # 分类三
├── edge-cases.test.ts          # 分类四
└── async-state.test.ts         # 分类五
```

## 维护原则

1. **每修复一个 Bug，先判断属于哪一类**，然后在对应文件中补一个测试用例
2. **如果 Bug 不属于已有分类**，考虑新增一个分类文件
3. **回归测试不追求 100% 覆盖**，只覆盖"历史上出过问题的模式"
4. **回归测试随 CI 运行**，确保每次提交都自动执行