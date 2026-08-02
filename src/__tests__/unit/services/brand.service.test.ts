import { describe, it, expect, vi } from 'vitest'
/* eslint-disable @typescript-eslint/no-explicit-any */;
import { createMockDb } from '../helpers/mock-db';
import { buildBrand, buildBrandList } from '../../factories/brand.factory';
import { NotFoundError } from '@/lib/errors';

const mockDb = createMockDb();
vi.mock('@/db', () => ({
  get db() { return mockDb; },
}));

import { brandService } from '@/services/brand-service';

describe('BrandService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('应返回品牌列表', async () => {
      const brands = buildBrandList(3);
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve(brands)),
      });

      const result = await brandService.list();
      expect(result).toHaveLength(3);
    });

    it('空数据时应返回空数组', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      const result = await brandService.list();
      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('应返回指定 ID 的品牌', async () => {
      const brand = buildBrand({ id: 1 });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([brand])),
      });

      const result = await brandService.getById(1);
      expect(result.id).toBe(1);
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      await expect(brandService.getById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('应创建品牌并返回记录', async () => {
      const brand = buildBrand({ id: 1, name: '测试品牌', slug: 'test-brand' });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([brand]),
        }),
      });

      const result = await brandService.create({ name: '测试品牌', slug: 'test-brand' });
      expect(result.id).toBe(1);
      expect(result.name).toBe('测试品牌');
    });
  });

  describe('update', () => {
    it('应更新品牌信息', async () => {
      const updated = buildBrand({ id: 1, name: '新品牌名' });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      });

      const result = await brandService.update(1, { name: '新品牌名' });
      expect(result.name).toBe('新品牌名');
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(brandService.update(999, { name: 'test' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('remove', () => {
    it('软删除应设置 deleted_at', async () => {
      const deleted = buildBrand({ id: 1, deleted_at: new Date() });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([deleted]),
          }),
        }),
      });

      const result = await brandService.remove(1);
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

      await expect(brandService.remove(999)).rejects.toThrow(NotFoundError);
    });
  });
});