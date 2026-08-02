import { describe, it, expect, vi } from 'vitest'
/* eslint-disable @typescript-eslint/no-explicit-any */;
import { createMockDb } from '../helpers/mock-db';
import { buildProduct, buildProductList, buildDeletedProduct } from '../../factories/product.factory';
import { NotFoundError } from '@/lib/errors';

const mockDb = createMockDb();
vi.mock('@/db', () => ({
  get db() { return mockDb; },
}));

import { productService } from '@/services/product-service';

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('应返回分页产品列表', async () => {
      const products = buildProductList(3);
      // Mock count query first
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve([{ count: 3 }])),
        })
        // Mock data query
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve(products)),
        });

      const result = await productService.list({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
    });

    it('空数据时应返回空列表', async () => {
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

      const result = await productService.list({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('应支持按分类过滤', async () => {
      const filtered = buildProductList(2).map(p => ({ ...p, category_id: 5 }));
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve([{ count: 2 }])),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve(filtered)),
        });

      const result = await productService.list({ categoryId: 5 });
      expect(result.items).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('应返回指定 ID 的产品', async () => {
      const product = buildProduct({ id: 1 });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([product])),
      });

      const result = await productService.getById(1);

      expect(result).not.toBeNull();
      expect(result.id).toBe(1);
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      await expect(productService.getById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getBySlug', () => {
    it('应返回指定 slug 的产品', async () => {
      const product = buildProduct({ id: 1, slug: 'roller-coaster-x' });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([product])),
      });

      const result = await productService.getBySlug('roller-coaster-x');
      expect(result.id).toBe(1);
    });

    it('不存在的 slug 应抛出 NotFoundError', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      await expect(productService.getBySlug('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('应创建产品并返回记录', async () => {
      const product = buildProduct({ id: 1, name: '云霄飞车', slug: 'roller-coaster', sku: 'SKU-001' });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([product]),
        }),
      });

      const result = await productService.create({
        name: '云霄飞车', slug: 'roller-coaster', sku: 'SKU-001', price: '99999.00',
      });

      expect(result.id).toBe(1);
      expect(result.name).toBe('云霄飞车');
    });

    it('创建时默认 status 为 draft', async () => {
      const product = buildProduct({ id: 1, status: 'draft' });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([product]),
        }),
      });

      const result = await productService.create({
        name: '测试产品', slug: 'test', sku: 'SKU-002', price: '100.00',
      });

      expect(result.status).toBe('draft');
    });
  });

  describe('update', () => {
    it('应更新产品信息', async () => {
      const updated = buildProduct({ id: 1, name: '新名称', price: '88888.00' });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      });

      const result = await productService.update(1, { name: '新名称', price: '88888.00' });
      expect(result.name).toBe('新名称');
      expect(result.price).toBe('88888.00');
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(productService.update(999, { name: 'test' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('remove', () => {
    it('软删除产品应设置 deleted_at', async () => {
      const deleted = buildDeletedProduct({ id: 1 });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([deleted]),
          }),
        }),
      });

      const result = await productService.remove(1);
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

      await expect(productService.remove(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getFeatured', () => {
    it('应返回已发布产品', async () => {
      const products = buildProductList(4).map(p => ({ ...p, status: 'published' as const }));
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve(products)),
      });

      const result = await productService.getFeatured(4);
      expect(result).toHaveLength(4);
    });
  });
});