import { describe, it, expect, vi } from 'vitest'
/* eslint-disable @typescript-eslint/no-explicit-any */;
import { createMockDb } from '../helpers/mock-db';
import { buildNews, buildNewsList } from '../../factories/news.factory';
import { NotFoundError } from '@/lib/errors';

const mockDb = createMockDb();
vi.mock('@/db', () => ({
  get db() { return mockDb; },
}));

import { newsService } from '@/services/news-service';

describe('NewsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('应返回分页新闻列表', async () => {
      const newsList = buildNewsList(3);
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve(newsList)),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve([{ count: 3 }])),
        });

      const result = await newsService.list({ page: 1, pageSize: 10 });
      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('应支持按分类过滤', async () => {
      const companyNews = buildNewsList(2).map(n => ({ ...n, category: 'company' as const }));
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve(companyNews)),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve([{ id: 2 }])),
        });

      const result = await newsService.list({ category: 'company' });
      expect(result.items).toHaveLength(2);
    });

    it('应支持按关键词搜索', async () => {
      const filtered = [buildNews({ id: 1, title: '新品发布' })];
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

      const result = await newsService.list({ search: '新品' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toContain('新品');
    });
  });

  describe('getById', () => {
    it('应返回指定 ID 的新闻', async () => {
      const news = buildNews({ id: 1 });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([news])),
      });

      const result = await newsService.getById(1);
      expect(result.id).toBe(1);
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      await expect(newsService.getById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getBySlug', () => {
    it('应返回指定 slug 的新闻', async () => {
      const news = buildNews({ id: 1, slug: 'new-product-launch' });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([news])),
      });

      const result = await newsService.getBySlug('new-product-launch');
      expect(result.id).toBe(1);
    });

    it('不存在的 slug 应抛出 NotFoundError', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      await expect(newsService.getBySlug('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('应创建新闻并返回记录', async () => {
      const news = buildNews({ id: 1, title: '新品发布', slug: 'new-product' });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([news]),
        }),
      });

      const result = await newsService.create({ title: '新品发布', slug: 'new-product' });
      expect(result.id).toBe(1);
      expect(result.title).toBe('新品发布');
    });
  });

  describe('update', () => {
    it('应更新新闻', async () => {
      const updated = buildNews({ id: 1, title: '更新标题' });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      });

      const result = await newsService.update(1, { title: '更新标题' });
      expect(result.title).toBe('更新标题');
    });
  });

  describe('remove', () => {
    it('软删除应设置 deleted_at', async () => {
      const deleted = buildNews({ id: 1, deleted_at: new Date() });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([deleted]),
          }),
        }),
      });

      const result = await newsService.remove(1);
      expect(result.deleted_at).not.toBeNull();
    });
  });
});