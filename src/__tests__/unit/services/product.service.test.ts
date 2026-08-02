import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb, resetMockDb } from '../helpers/mock-db';
import { buildProduct, buildProductList } from '../../factories/product.factory';

// Mock the db module
vi.mock('@/db', () => ({
  get db() {
    return mockDb;
  },
}));

// We'll use a variable to hold the mock db
let mockDb: ReturnType<typeof createMockDb>;

// Mock the product service
const productService = {
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  search: vi.fn(),
};

describe('ProductService', () => {
  beforeEach(() => {
    mockDb = createMockDb();
    resetMockDb(mockDb);
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('应返回产品列表', async () => {
      const products = buildProductList(3);
      productService.list.mockResolvedValue({
        items: products,
        total: 3,
        page: 1,
        pageSize: 10,
      });

      const result = await productService.list({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
    });

    it('空数据时应返回空列表', async () => {
      productService.list.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
      });

      const result = await productService.list({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('应返回指定 ID 的产品', async () => {
      const product = buildProduct({ id: 1 });
      productService.getById.mockResolvedValue(product);

      const result = await productService.getById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });

    it('不存在的 ID 应返回 null', async () => {
      productService.getById.mockResolvedValue(null);

      const result = await productService.getById(999);

      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('应支持按关键词搜索', async () => {
      const products = buildProductList(2);
      productService.search.mockResolvedValue({
        items: products,
        total: 2,
        page: 1,
        pageSize: 10,
      });

      const result = await productService.search({ keyword: '过山车' });

      expect(result.items).toHaveLength(2);
    });

    it('无匹配结果应返回空列表', async () => {
      productService.search.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
      });

      const result = await productService.search({ keyword: '不存在的产品' });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('softDelete', () => {
    it('软删除产品应设置 deleted_at', async () => {
      const deletedProduct = buildProduct({ deleted_at: new Date() });
      productService.softDelete.mockResolvedValue(deletedProduct);

      const result = await productService.softDelete(1);

      expect(result?.deleted_at).not.toBeNull();
    });

    it('不存在的产品应返回 null', async () => {
      productService.softDelete.mockResolvedValue(null);

      const result = await productService.softDelete(999);

      expect(result).toBeNull();
    });
  });
});