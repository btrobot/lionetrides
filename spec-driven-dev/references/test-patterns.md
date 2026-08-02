# 测试模式

## 核心原则

### 每个操作一条测试

spec 中定义的每个 operation，至少有一条测试覆盖其正常路径：

```typescript
describe('productService', () => {
  describe('list', () => {
    it('应返回分页产品列表', async () => {
      // 见下方模式示例
    });
  });

  describe('create', () => {
    it('应创建产品并返回', async () => {
      // 见下方模式示例
    });
  });

  describe('getById', () => {
    it('应返回单个产品', async () => {});
    it('产品不存在时应抛出 NotFoundError', async () => {});
  });

  describe('update', () => {
    it('应更新产品并返回', async () => {});
    it('产品不存在时应抛出 NotFoundError', async () => {});
  });

  describe('remove', () => {
    it('应软删除产品', async () => {});
    it('产品不存在时应抛出 NotFoundError', async () => {});
  });
});
```

### 每条规则一条测试

spec 中 Rules 定义的每条 `severity: error` 的规则，必须有测试覆盖：

```typescript
describe('business rules', () => {
  it('R001: 产品名称不能超过 255 个字符', async () => {});
  it('R002: 草稿产品不可公开访问', async () => {});
});
```

### 每个边界一条测试

```typescript
describe('edge cases', () => {
  it('空列表返回空结果', async () => {});
  it('查询不存在的数据返回 NotFoundError', async () => {});
  it('权限不足返回 ForbiddenError', async () => {});
  it('参数非法返回 ValidationError', async () => {});
});
```

---

## 模式一：服务层单元测试

### 测试文件结构

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/db';
import { <module>Service } from '@/services/<module>-service';
import { build<Module> } from '@/__tests__/factories/<module>.factory';
import { NotFoundError, ValidationError } from '@/lib/errors';

// Mock DB
vi.mock('@/db', () => ({
  db: {} as any,
}));

const mockDb = db as any;

describe('<module>Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
});
```

### List 操作测试模式

```typescript
it('应返回分页列表', async () => {
  const items = build<Module>List(3);

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
      then: vi.fn((resolve: any) => resolve(items)),
    });

  const result = await <module>Service.list({ page: 1, pageSize: 20 });

  expect(result.items).toHaveLength(3);
  expect(result.total).toBe(3);
});
```

**关键点**：`db.select` 被调用两次（一次 count、一次 items），必须用 `mockReturnValueOnce` 分别返回，顺序不可颠倒。

### Create 操作测试模式

```typescript
it('应创建资源并返回', async () => {
  const created = build<Module>({ id: 1 });

  mockDb.insert.mockReturnValue({
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: any) => resolve([created])),
  });

  const result = await <module>Service.create({ name: 'Test' });

  expect(result.id).toBe(1);
  expect(result.name).toBe('Test');
});
```

### GetById 操作测试模式（含 NotFound）

```typescript
it('应返回单个资源', async () => {
  const item = build<Module>({ id: 1 });

  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: any) => resolve([item])),
  });

  const result = await <module>Service.getById(1);
  expect(result.id).toBe(1);
});

it('不存在时应抛出 NotFoundError', async () => {
  mockDb.select.mockReturnValue({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: any) => resolve([])),
  });

  await expect(<module>Service.getById(999)).rejects.toThrow(NotFoundError);
});
```

### Update 操作测试模式

```typescript
it('应更新资源并返回', async () => {
  const updated = build<Module>({ id: 1, name: 'Updated' });

  mockDb.update.mockReturnValue({
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: any) => resolve([updated])),
  });

  const result = await <module>Service.update(1, { name: 'Updated' });
  expect(result.name).toBe('Updated');
});
```

### Remove 操作测试模式（软删除）

```typescript
it('应软删除资源', async () => {
  mockDb.update.mockReturnValue({
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: any) => resolve([{ id: 1 }])),
  });

  const result = await <module>Service.remove(1);
  expect(result.success).toBe(true);
});
```

---

## 模式二：Mock DB 配置

### mock-db.ts 配置

```typescript
import { vi } from 'vitest';

export function createMockDb() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as any;
}
```

### 使用方式

```typescript
const mockDb = createMockDb();

vi.mock('@/db', () => ({
  db: mockDb,
}));
```

---

## 模式三：Factory 数据生成

### Factory 模板

```typescript
import { faker } from '@faker-js/faker';

export function build<Module>(overrides: Partial<Module> = {}): Module {
  return {
    id: faker.number.int({ min: 1, max: 9999 }),
    name: faker.commerce.productName(),
    slug: faker.helpers.slugify(faker.commerce.productName()),
    description: faker.lorem.sentence(),
    sort_order: 0,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}

export function build<Module>List(count: number, overrides: Partial<Module> = {}): Module[] {
  return Array.from({ length: count }, () => build(overrides));
}
```

### Factory 检查清单

- 所有 DB schema 中 `notNull()` 的字段，factory 必须有默认值
- 所有可选字段，factory 必须有默认值（null 或 faker 生成）
- factory 字段名必须与 DB schema 中的列名一致（snake_case 转 camelCase）
- overrides 应使用 `Partial<Type>` 类型，允许任意覆盖