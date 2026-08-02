import { describe, it, expect } from 'vitest'
import { signToken, verifyToken, JwtPayload } from '@/lib/auth';

describe('AuthService', () => {
  const testPayload: JwtPayload = { userId: 1, email: 'admin@test.com', role: 'admin' };

  describe('signToken', () => {
    it('应生成有效的 JWT 令牌', () => {
      const token = signToken(testPayload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      // JWT has 3 parts separated by dots
      expect(token.split('.')).toHaveLength(3);
    });

    it('不同 payload 应生成不同令牌', () => {
      const token1 = signToken(testPayload);
      const token2 = signToken({ ...testPayload, userId: 2 });
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('应验证有效令牌并返回 payload', () => {
      const token = signToken(testPayload);
      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(1);
      expect(decoded.email).toBe('admin@test.com');
      expect(decoded.role).toBe('admin');
    });

    it('应包含 id/email/role 在 payload 中', () => {
      const token = signToken(testPayload);
      const decoded = verifyToken(token);
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('role');
    });

    it('无效令牌应抛出异常', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('篡改过的令牌应抛出异常', () => {
      const token = signToken(testPayload);
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyToken(tampered)).toThrow();
    });
  });
});