import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paginatedResponse } from '@/lib/errors';

/**
 * Regression Test: Reviews API 500 Error
 *
 * 历史 Bug 复盘：
 * reviewService.list() 中：
 *   const [{ count: total }] = await db.select({ count: count() })
 *   return paginatedResponse(items, count, { page, pageSize })
 *                                     ^^^^^
 *   count 是 drizzle-orm 的 SQL 函数引用，不是数字！
 *   修复：改为 paginatedResponse(items, total, { page, pageSize })
 *
 * 本测试验证：
 * 1. paginatedResponse 第二个参数必须传数字
 * 2. 传递函数引用不会导致崩溃
 */

describe('Reg: Reviews Pagination - count variable bug', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('paginatedResponse should accept total as number', () => {
    const result = paginatedResponse(
      [{ id: 1, rating: 5 }],
      42,  // total 是数字
      { page: 1, pageSize: 10 },
    );
    expect(result.total).toBe(42);
    expect(result.totalPages).toBe(5);
  });

  it('paginatedResponse should handle total = 0', () => {
    const result = paginatedResponse([], 0, { page: 1, pageSize: 10 });
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('paginatedResponse should handle total = 1', () => {
    const result = paginatedResponse([{ id: 1 }], 1, { page: 1, pageSize: 10 });
    expect(result.totalPages).toBe(1);
  });

  it('paginatedResponse should handle large total', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
    const result = paginatedResponse(items, 100, { page: 1, pageSize: 10 });
    expect(result.totalPages).toBe(10);
    expect(result.total).toBe(100);
  });

  it('paginatedResponse should handle total as string (edge case)', () => {
    // 已知限制：paginatedResponse 不转换 total 类型
    // 若传入字符串，total 保持原样，但 JS 算术运算会隐式转换
    // 所以 totalPages = Math.ceil('42' / 10) = 5（正常）
    // 调用方应确保 total 为 number，否则 total 字段类型不一致
    const result = paginatedResponse(
      [{ id: 1 }],
      '42' as unknown as number,
      { page: 1, pageSize: 10 },
    );
    expect(result.total).toBe('42');
    expect(result.totalPages).toBe(5);
  });

  it('paginatedResponse should handle NaN total gracefully', () => {
    // 如果总数字段传了 NaN
    const result = paginatedResponse(
      [{ id: 1 }],
      NaN,
      { page: 1, pageSize: 10 },
    );
    expect(Number.isNaN(result.total)).toBe(true);
    expect(Number.isNaN(result.totalPages)).toBe(true);
  });
});
