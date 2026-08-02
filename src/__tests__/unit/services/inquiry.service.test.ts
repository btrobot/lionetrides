import { describe, it, expect, vi } from 'vitest'
/* eslint-disable @typescript-eslint/no-explicit-any */;
import { createMockDb } from '../helpers/mock-db';
import { buildInquiry, buildInquiryList } from '@/__tests__/factories/inquiry.factory';
import { NotFoundError } from '@/lib/errors';

// Mock the db module
const mockDb = createMockDb();
vi.mock('@/db', () => ({
  get db() { return mockDb; },
}));

// Import the actual service after mocking
import { inquiryService } from '@/services/inquiry-service';

const inquiries = buildInquiryList(3);
const userInquiries = buildInquiryList(2).map(i => ({ ...i, user_id: 5 }));
const pendingInquiries = buildInquiryList(2).map(i => ({ ...i, status: 'pending' as const }));

describe('InquiryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('应创建询盘并返回记录', async () => {
      const inquiry = buildInquiry({ id: 1 });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([inquiry]),
        }),
      });

      const result = await inquiryService.create({
        name: '张三',
        email: 'zhangsan@test.com',
        message: '请提供报价',
        product_id: 1,
      });

      expect(result).not.toBeNull();
      expect(result.id).toBe(1);
      expect(result.status).toBe('pending');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('询盘 ID 应自动生成 inquiry_no', async () => {
      const inquiry = buildInquiry({ id: 2, inquiry_no: 'INQ-2025-00002' });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([inquiry]),
        }),
      });

      const result = await inquiryService.create({
        name: '李四',
        email: 'lisi@test.com',
        message: '询价',
      });

      expect(result.inquiry_no).toBeTruthy();
    });
  });

  describe('list', () => {
    it('应返回分页询盘列表', async () => {
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
          then: vi.fn((resolve: any) => resolve(inquiries)),
        });

      const result = await inquiryService.list({ page: 1, pageSize: 10 });

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
      const countMock = createMockDb();
      countMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([{ count: 0 }])),
      });

      const result = await inquiryService.list({ page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('应支持按 userId 过滤', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve(userInquiries)),
      });
      const countMock = createMockDb();
      countMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([{ count: 2 }])),
      });

      const result = await inquiryService.list({ userId: 5 });

      expect(result.items).toHaveLength(2);
      result.items.forEach(item => {
        expect(item.user_id).toBe(5);
      });
    });

    it('应支持按 status 过滤', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve(pendingInquiries)),
      });
      const countMock = createMockDb();
      countMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([{ count: 2 }])),
      });

      const result = await inquiryService.list({ status: 'pending' });

      expect(result.items).toHaveLength(2);
      result.items.forEach(item => {
        expect(item.status).toBe('pending');
      });
    });
  });

  describe('getById', () => {
    it('应返回指定 ID 的询盘', async () => {
      const inquiry = buildInquiry({ id: 1 });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([inquiry])),
      });

      const result = await inquiryService.getById(1);

      expect(result.id).toBe(1);
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      await expect(inquiryService.getById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateStatus', () => {
    it('应将 pending 更新为 responded', async () => {
      const inquiry = buildInquiry({ id: 1, status: 'pending' });
      const updatedInquiry = { ...inquiry, status: 'responded' as const, replied_at: new Date() };

      // Mock update
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedInquiry]),
          }),
        }),
      });
      // Mock insert for inquiry_history
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      });

      const result = await inquiryService.updateStatus(1, 'responded', 1, '已报价');

      expect(result.status).toBe('responded');
      expect(result.replied_at).toBeTruthy();
      // Should have logged to inquiry_history
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('应将 pending 更新为 closed', async () => {
      const inquiry = buildInquiry({ id: 1, status: 'pending' });
      const updatedInquiry = { ...inquiry, status: 'closed' as const, closed_at: new Date() };

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedInquiry]),
          }),
        }),
      });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      });

      const result = await inquiryService.updateStatus(1, 'closed');

      expect(result.status).toBe('closed');
      expect(result.closed_at).toBeTruthy();
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(inquiryService.updateStatus(999, 'responded')).rejects.toThrow(NotFoundError);
    });
  });
});