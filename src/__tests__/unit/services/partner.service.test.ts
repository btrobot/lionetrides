import { describe, it, expect, vi } from 'vitest'
/* eslint-disable @typescript-eslint/no-explicit-any */;
import { createMockDb } from '../helpers/mock-db';
import { buildPartner, buildPartnerList } from '../../factories/partner.factory';
import { NotFoundError } from '@/lib/errors';

const mockDb = createMockDb();
vi.mock('@/db', () => ({
  get db() { return mockDb; },
}));

import { partnerService } from '@/services/partner-service';

describe('PartnerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('应返回合作伙伴列表', async () => {
      const partners = buildPartnerList(3);
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve(partners)),
      });

      const result = await partnerService.list();
      expect(result).toHaveLength(3);
    });

    it('空数据时返回空数组', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      const result = await partnerService.list();
      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('应返回指定 ID 的合作伙伴', async () => {
      const partner = buildPartner({ id: 1 });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([partner])),
      });

      const result = await partnerService.getById(1);
      expect(result.id).toBe(1);
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      await expect(partnerService.getById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('应创建合作伙伴并返回记录', async () => {
      const partner = buildPartner({ id: 1, name: '新合作伙伴' });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([partner]),
        }),
      });

      const result = await partnerService.create({ name: '新合作伙伴', slug: 'new-partner' });
      expect(result.id).toBe(1);
      expect(result.name).toBe('新合作伙伴');
    });
  });

  describe('update', () => {
    it('应更新合作伙伴信息', async () => {
      const updated = buildPartner({ id: 1, name: '更新名称' });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      });

      const result = await partnerService.update(1, { name: '更新名称' });
      expect(result.name).toBe('更新名称');
    });
  });

  describe('remove', () => {
    it('软删除应设置 deleted_at', async () => {
      const deleted = buildPartner({ id: 1, deleted_at: new Date() });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([deleted]),
          }),
        }),
      });

      const result = await partnerService.remove(1);
      expect(result.deleted_at).not.toBeNull();
    });
  });
});