import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from '../helpers/mock-db';
import { NotFoundError } from '@/lib/errors';

const mockDb = createMockDb();
vi.mock('@/db', () => ({
  get db() { return mockDb; },
}));

import { settingsService } from '@/services/settings-service';

describe('SettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('应返回公司信息和统计数据', async () => {
      const companyInfo = [
        { id: 1, key: 'company_name', value: '欢乐游乐设备有限公司', type: 'text', created_at: new Date(), updated_at: new Date() },
        { id: 2, key: 'company_phone', value: '400-888-9999', type: 'text', created_at: new Date(), updated_at: new Date() },
      ];
      const stats = [
        { id: 1, label: '年产能', value: '1000+', suffix: '台', icon: 'factory', sort_order: 0, is_active: true, created_at: new Date(), updated_at: new Date() },
      ];

      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve(companyInfo)),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve(stats)),
        });

      const result = await settingsService.getSettings();
      expect(result.info).toHaveProperty('company_name', '欢乐游乐设备有限公司');
      expect(result.info).toHaveProperty('company_phone', '400-888-9999');
      expect(result.stats).toHaveLength(1);
    });

    it('无数据时应返回空对象和空数组', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve([])),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          then: vi.fn((resolve: any) => resolve([])),
        });

      const result = await settingsService.getSettings();
      expect(result.info).toEqual({});
      expect(result.stats).toHaveLength(0);
    });
  });

  describe('updateSetting', () => {
    it('应更新指定 key 的配置值', async () => {
      const updated = { id: 1, key: 'company_name', value: '新公司名', type: 'text', created_at: new Date(), updated_at: new Date() };
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      });

      const result = await settingsService.updateSetting('company_name', '新公司名');
      expect(result.value).toBe('新公司名');
    });

    it('不存在的 key 应抛出 NotFoundError', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(settingsService.updateSetting('non_existent', 'value')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateStats', () => {
    it('应更新统计数据项', async () => {
      const updated = { id: 1, label: '年产能', value: '2000+', suffix: '台', icon: 'factory', sort_order: 0, is_active: true, created_at: new Date(), updated_at: new Date() };
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      });

      const result = await settingsService.updateStats(1, { value: '2000+', label: '年产能' });
      expect(result.value).toBe('2000+');
    });

    it('不存在的 ID 应抛出 NotFoundError', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(settingsService.updateStats(999, { value: 'test' })).rejects.toThrow(NotFoundError);
    });
  });
});