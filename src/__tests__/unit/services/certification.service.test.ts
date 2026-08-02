import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from '../helpers/mock-db';
import { buildCertification, buildCertificationList } from '../../factories/certification.factory';
import { NotFoundError } from '@/lib/errors';

const mockDb = createMockDb();
vi.mock('@/db', () => ({
  get db() { return mockDb; },
}));

import { certificationService } from '@/services/certification-service';

describe('CertificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('应返回认证列表', async () => {
      const certs = buildCertificationList(3);
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve(certs)),
      });

      const result = await certificationService.list();
      expect(result).toHaveLength(3);
    });

    it('空数据时返回空数组', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      const result = await certificationService.list();
      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('应返回指定 ID 的认证', async () => {
      const cert = buildCertification({ id: 1 });
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([cert])),
      });

      const result = await certificationService.getById(1);
      expect(result.id).toBe(1);
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve([])),
      });

      await expect(certificationService.getById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('应创建认证并返回记录', async () => {
      const cert = buildCertification({ id: 1, name: 'CE 认证', slug: 'CE-2025' });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([cert]),
        }),
      });

      const result = await certificationService.create({ name: 'CE 认证', code: 'CE-2025' });
      expect(result.id).toBe(1);
      expect(result.name).toBe('CE 认证');
    });
  });

  describe('update', () => {
    it('应更新认证信息', async () => {
      const updated = buildCertification({ id: 1, name: '更新认证' });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      });

      const result = await certificationService.update(1, { name: '更新认证' });
      expect(result.name).toBe('更新认证');
    });
  });

  describe('remove', () => {
    it('软删除应设置 deleted_at', async () => {
      const deleted = buildCertification({ id: 1, deleted_at: new Date() });
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([deleted]),
          }),
        }),
      });

      const result = await certificationService.remove(1);
      expect(result.deleted_at).not.toBeNull();
    });
  });
});