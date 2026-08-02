import { describe, it, expect } from 'vitest';
import { paginatedResponse, errorResponse, NotFoundError, ValidationError, AuthError, type PaginationParams } from '@/lib/errors';

/**
 * API 契约测试：验证所有 API 响应结构的统一性
 */
describe('API Response Structure Contract', () => {
  describe('paginatedResponse', () => {
    const defaultParams: PaginationParams = { page: 1, pageSize: 10 };

    it('returns standard paginated structure', () => {
      const items = [{ id: 1, name: 'Test' }];
      const result = paginatedResponse(items, 1, defaultParams);
      expect(result).toEqual({
        items: [{ id: 1, name: 'Test' }],
        total: 1, page: 1, pageSize: 10, totalPages: 1,
      });
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('returns empty array when no items', () => {
      const result = paginatedResponse([], 0, defaultParams);
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('calculates totalPages correctly', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
      const result = paginatedResponse(items, 25, { page: 2, pageSize: 10 });
      expect(result.page).toBe(2);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('errorResponse', () => {
    it('returns 500 for generic Error', () => {
      const result = errorResponse(new Error('Something went wrong'));
      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.statusCode).toBe(500);
    });

    it('returns 404 for NotFoundError', () => {
      const result = errorResponse(new NotFoundError('User'));
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(result.statusCode).toBe(404);
    });

    it('returns 400 for ValidationError', () => {
      const result = errorResponse(new ValidationError('Invalid input'));
      expect(result.statusCode).toBe(400);
    });

    it('returns 401 for AuthError', () => {
      const result = errorResponse(new AuthError('Unauthorized'));
      expect(result.statusCode).toBe(401);
    });

    it('returns 500 for unknown input', () => {
      const result = errorResponse('Custom error');
      expect(result.error).toBe('Unknown error');
      expect(result.statusCode).toBe(500);
    });
  });
});
