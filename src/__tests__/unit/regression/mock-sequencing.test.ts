import { describe, it, expect } from 'vitest'
/* eslint-disable @typescript-eslint/no-explicit-any */;

import { createMockDb, resetMockDb } from '@/__tests__/unit/helpers/mock-db';

/**
 * Regression Test: Mock Chain Sequencing
 *
 * 历史 Bug 复盘：
 * - 服务层 list 方法会调用两次 db.select()：先 count 查询，再 items 查询
 * - 若 mock 只设置一次 mockReturnValue，两次调用返回同一链对象
 * - 导致 count 查询也返回 items 数据，paginatedResponse 的 total 变成 undefined/NaN
 * - 修复方案：使用 mockReturnValueOnce 分别返回 count 和 items 的 mock 链
 *
 * 本测试确保：
 * 1. mockReturnValueOnce 模式能正确区分两次 select 调用
 * 2. 链式调用的 then 方法返回正确的数据类型
 * 3. mock 链的 Promise 行为符合预期
 */

describe('Mock Chain Sequencing', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
    resetMockDb();
  });

  it('should handle two sequential select calls with mockReturnValueOnce', async () => {
    // 模拟 service list 方法的两次 db.select() 调用
    // 第一次：count 查询 -> 返回 [{ count: 5 }]
    const countResult = [{ count: 5 }];
    // 第二次：items 查询 -> 返回数据数组
    const itemsResult = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];

    // 用 mockReturnValueOnce 分别设置
    mockDb.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => {
          if (resolve) return Promise.resolve(resolve(countResult));
          return Promise.resolve(countResult);
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => {
          if (resolve) return Promise.resolve(resolve(itemsResult));
          return Promise.resolve(itemsResult);
        }),
      });

    // 模拟 service 的 list 逻辑
    // 第一次 await：count
    const [totalRow] = await mockDb.select({ count: true }).from('table').where('id > 0');
    // 第二次 await：items
    const items = await mockDb.select().from('table').where('id > 0').orderBy('id').limit(10).offset(0);

    // 验证 count 正确
    expect(totalRow).toEqual({ count: 5 });
    // 验证 items 正确
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe('Item 1');
    expect(items[1].name).toBe('Item 2');
    // 验证 select 被调用了两次
    expect(mockDb.select).toHaveBeenCalledTimes(2);
  });

  it('should handle count query with complex select projection', async () => {
    // 模拟带投影的 count 查询：db.select({ count: count() }).from(table).where(...)
    mockDb.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => {
          if (resolve) return Promise.resolve(resolve([{ count: 10 }]));
          return Promise.resolve([{ count: 10 }]);
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => {
          if (resolve) return Promise.resolve(resolve([{ id: 1 }]));
          return Promise.resolve([{ id: 1 }]);
        }),
      });

    // 模拟计数
    const [countRow] = await mockDb.select({ count: true }).from('table').where('active = true');
    expect(countRow.count).toBe(10);

    // 模拟查询
    const [item] = await mockDb.select().from('table').where('active = true').orderBy('id').limit(10).offset(0);
    expect(item.id).toBe(1);
  });

  it('should handle single select call (create/update/delete patterns)', async () => {
    // 模拟 create：mockDb.insert().values().returning()
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1, name: 'New Item' }]),
      }),
    });

    // 模拟 create 调用
    const [created] = await mockDb.insert().values({ name: 'New Item' }).returning();
    expect(created.id).toBe(1);
    expect(created.name).toBe('New Item');
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it('should handle error in mock chain (catch method)', async () => {
    const mockError = new Error('DB Error');

    // 模拟一个 Promise 链，通过 then 方法返回拒绝的 Promise
    // 注意：链式调用的最后一步会触发 then，所以 limit 返回的链对象必须有 then
    const chainWithError = {
      then: vi.fn((_resolve: any, _reject?: any) => {
        // 如果 _reject 存在，调用它，否则返回 rejected Promise
        if (_reject) {
          _reject(mockError);
          return Promise.resolve();
        }
        return Promise.reject(mockError);
      }),
      catch: vi.fn(),
    };

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn(() => chainWithError),
    });

    // 模拟 DB 查询失败
    let caught: Error | null = null;
    try {
      await mockDb.select().from('table').where('id = 1').limit(1);
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).toBeTruthy();
    expect(caught!.message).toBe('DB Error');
  });

  it('should handle empty result sets correctly', async () => {
    // 空结果集
    mockDb.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => {
          if (resolve) return Promise.resolve(resolve([{ count: 0 }]));
          return Promise.resolve([{ count: 0 }]);
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => {
          if (resolve) return Promise.resolve(resolve([]));
          return Promise.resolve([]);
        }),
      });

    const [countRow] = await mockDb.select({ count: true }).from('table').where('1=0');
    const items = await mockDb.select().from('table').where('1=0').orderBy('id').limit(10).offset(0);

    expect(countRow.count).toBe(0);
    expect(items).toHaveLength(0);
  });
});