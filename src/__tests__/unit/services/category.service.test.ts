import { describe, it, expect, vi } from 'vitest'
/* eslint-disable @typescript-eslint/no-explicit-any */;
import { createMockDb } from '../helpers/mock-db';
import { buildCategory, buildCategoryList } from '../../factories/category.factory';
import { NotFoundError } from '@/lib/errors';

const mockDb = createMockDb();
vi.mock('@/db', () => ({
  get db() { return mockDb; },
}));

import { categoryService } from '@/services/category-service';

describe('CategoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('应返回分类列表（分页）', async () => {
      const categories = buildCategoryList(3);
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve(categories)),
      });

      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve(categories)),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve([{ count: 3 }])),
        });

      const result = await categoryService.list({ page: 1, pageSize: 10 });
      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('应支持按关键词搜索', async () => {
      const filtered = [buildCategory({ id: 1, name: '过山车' })];
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve(filtered)),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve([{ id: 1 }])),
        });

      const result = await categoryService.list({ search: '过山车' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('过山车');
    });
  });

  describe('getById', () => {
    it('应返回指定 ID 的分类', async () => {
      const category = buildCategory({ id: 1 });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([category])),
      });

      const result = await categoryService.getById(1);
      expect(result.id).toBe(1);
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      await expect(categoryService.getById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('应创建分类并返回记录', async () => {
      const category = buildCategory({ id: 1, name: '水上乐园', slug: 'water-parks' });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([category]),
        }),
      });

      const result = await categoryService.create({ name: '水上乐园', slug: 'water-parks' });
      expect(result.id).toBe(1);
      expect(result.name).toBe('水上乐园');
    });
  });

  describe('update', () => {
    it('应更新分类名称', async () => {
      const updated = buildCategory({ id: 1, name: '超级过山车' });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      });

      const result = await categoryService.update(1, { name: '超级过山车' });
      expect(result.name).toBe('超级过山车');
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(categoryService.update(999, { name: 'test' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('remove', () => {
    it('软删除应设置 deleted_at', async () => {
      const deleted = buildCategory({ id: 1, deleted_at: new Date() });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([deleted]),
          }),
        }),
      });

      const result = await categoryService.remove(1);
      expect(result.deleted_at).not.toBeNull();
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(categoryService.remove(999)).rejects.toThrow(NotFoundError);
    });
  });
});