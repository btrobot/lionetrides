import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from '../helpers/mock-db';
import { buildReview, buildReviewList } from '../../factories/review.factory';
import { NotFoundError } from '@/lib/errors';

const mockDb = createMockDb();
vi.mock('@/db', () => ({
  get db() { return mockDb; },
}));

import { reviewService } from '@/services/review-service';

describe('ReviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('应返回分页评价列表', async () => {
      const reviews = buildReviewList(3);
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve(reviews)),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve([{ count: 3 }])),
        });

      const result = await reviewService.list({ page: 1, pageSize: 10 });
      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('应支持按 productId 过滤', async () => {
      const productReviews = buildReviewList(2).map(r => ({ ...r, product_id: 5 }));
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve(productReviews)),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve([{ id: 2 }])),
        });

      const result = await reviewService.list({ productId: 5 });
      expect(result.items).toHaveLength(2);
      result.items.forEach(item => {
        expect(item.product_id).toBe(5);
      });
    });

    it('应支持按 status 过滤', async () => {
      const approved = buildReviewList(2).map(r => ({ ...r, status: 'approved' as const }));
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve(approved)),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve([{ id: 2 }])),
        });

      const result = await reviewService.list({ status: 'approved' });
      expect(result.items).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('应返回指定 ID 的评价', async () => {
      const review = buildReview({ id: 1 });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([review])),
      });

      const result = await reviewService.getById(1);
      expect(result.id).toBe(1);
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      await expect(reviewService.getById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('应创建评价并返回记录', async () => {
      const review = buildReview({ id: 1, product_id: 1, rating: 5, content: '非常好！' });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([review]),
        }),
      });

      const result = await reviewService.create({
        productId: 1,
        rating: 5,
        content: '非常好！',
      });
      expect(result.id).toBe(1);
      expect(result.rating).toBe(5);
    });

    it('应支持带客户名称创建', async () => {
      const review = buildReview({ id: 1, customer_name: '张三', company_name: '欢乐谷' });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([review]),
        }),
      });

      const result = await reviewService.create({
        productId: 1,
        rating: 4,
        content: '不错',
        customerName: '张三',
        companyName: '欢乐谷',
      });
      expect(result.customer_name).toBe('张三');
      expect(result.company_name).toBe('欢乐谷');
    });
  });

  describe('approve', () => {
    it('批准评价应设置 status=approved', async () => {
      const approved = buildReview({ id: 1, status: 'approved' });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([approved]),
          }),
        }),
      });

      const result = await reviewService.approve(1);
      expect(result.status).toBe('approved');
    });

    it('不存在的评价应抛出 NotFoundError', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(reviewService.approve(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('hide', () => {
    it('隐藏评价应设置 status=hidden', async () => {
      const hidden = buildReview({ id: 1, status: 'hidden' });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([hidden]),
          }),
        }),
      });

      const result = await reviewService.hide(1);
      expect(result.status).toBe('hidden');
    });
  });

  describe('remove', () => {
    it('软删除评价应设置 deleted_at', async () => {
      const deleted = buildReview({ id: 1, deleted_at: new Date() });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([deleted]),
          }),
        }),
      });

      const result = await reviewService.remove(1);
      expect(result.deleted_at).not.toBeNull();
    });
  });
});