import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Regression Test: Zod Validation Format
 *
 * 历史 Bug 复盘：
 * - Zod v4 使用 `error.issues` 而非 `error.errors`（Zod v3 兼容属性）
 * - 所有 API 路由的 catch 块中，都使用 `e instanceof z.ZodError` 并访问 `e.issues`
 * - 若 Zod 升级或版本变更，需要确保 `issues` 属性仍然可用
 *
 * 本测试确保：
 * 1. ZodError 实例有 `issues` 属性（而非 `errors`）
 * 2. 每个 issue 包含 path, message, code 三个关键字段
 * 3. 验证常见的 Zod 验证场景（字符串、数字、邮箱、枚举、可选字段）
 */

const testSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18').optional(),
  role: z.enum(['admin', 'customer']).optional(),
});

describe('ZodError Format Compatibility', () => {
  it('should have .issues property (not .errors)', () => {
    try {
      testSchema.parse({ name: 'A', email: 'invalid' });
    } catch (e) {
      expect(e).toBeInstanceOf(z.ZodError);
      const zodError = e as z.ZodError;
      // 核心：issues 必须存在
      expect(zodError.issues).toBeDefined();
      expect(Array.isArray(zodError.issues)).toBe(true);
      // 不应依赖 .errors（Zod v3 兼容属性）
      expect((zodError as any).errors).toBeUndefined();
    }
  });

  it('should report multiple validation errors with correct structure', () => {
    try {
      testSchema.parse({ name: 'A', email: 'invalid' });
    } catch (e) {
      const zodError = e as z.ZodError;
      expect(zodError.issues.length).toBeGreaterThanOrEqual(2);

      // 每个 issue 必须包含标准字段
      for (const issue of zodError.issues) {
        expect(issue).toHaveProperty('code');
        expect(issue).toHaveProperty('message');
        expect(issue).toHaveProperty('path');
        expect(Array.isArray(issue.path)).toBe(true);
      }

      // name 字段错误
      const nameIssue = zodError.issues.find((i) => i.path[0] === 'name');
      expect(nameIssue).toBeDefined();
      expect(nameIssue!.message).toContain('at least 2');

      // email 字段错误
      const emailIssue = zodError.issues.find((i) => i.path[0] === 'email');
      expect(emailIssue).toBeDefined();
      expect(emailIssue!.message).toContain('Invalid email');
    }
  });

  it('should report single field validation error', () => {
    try {
      testSchema.parse({ name: 'Valid Name', email: 'bad-email' });
    } catch (e) {
      const zodError = e as z.ZodError;
      expect(zodError.issues).toHaveLength(1);
      expect(zodError.issues[0].path[0]).toBe('email');
      // Zod v4 使用 invalid_format 替代 invalid_string
      expect(zodError.issues[0].code).toBe('invalid_format');
    }
  });

  it('should handle optional fields correctly', () => {
    const result = testSchema.parse({
      name: 'Valid Name',
      email: 'test@example.com',
    });
    expect(result.name).toBe('Valid Name');
    expect(result.email).toBe('test@example.com');
    expect(result.age).toBeUndefined();
    expect(result.role).toBeUndefined();
  });

  it('should handle enum validation', () => {
    try {
      testSchema.parse({
        name: 'Valid Name',
        email: 'test@example.com',
        role: 'super_admin',
      });
    } catch (e) {
      const zodError = e as z.ZodError;
      const roleIssue = zodError.issues.find((i) => i.path[0] === 'role');
      expect(roleIssue).toBeDefined();
      // Zod v4 使用 invalid_value 替代 invalid_enum_value
      expect(roleIssue!.code).toBe('invalid_value');
    }
  });

  it('should handle nested object validation', () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string().min(1),
        address: z.object({
          city: z.string().min(1),
        }),
      }),
    });

    try {
      nestedSchema.parse({ user: { name: '', address: { city: '' } } });
    } catch (e) {
      const zodError = e as z.ZodError;
      expect(zodError.issues.length).toBeGreaterThanOrEqual(2);
      // 嵌套路径应正确反映
      const nameIssue = zodError.issues.find(
        (i) => i.path[0] === 'user' && i.path[1] === 'name'
      );
      expect(nameIssue).toBeDefined();
    }
  });

  it('should safely serialize to JSON for API response', () => {
    try {
      testSchema.parse({ name: '', email: 'bad' });
    } catch (e) {
      const zodError = e as z.ZodError;
      // 模拟 API 路由中的序列化模式
      const response = {
        success: false,
        error: 'Validation failed',
        details: zodError.issues,
      };
      const json = JSON.stringify(response);
      const parsed = JSON.parse(json);
      expect(parsed.success).toBe(false);
      expect(parsed.error).toBe('Validation failed');
      expect(Array.isArray(parsed.details)).toBe(true);
      expect(parsed.details[0]).toHaveProperty('code');
      expect(parsed.details[0]).toHaveProperty('message');
      expect(parsed.details[0]).toHaveProperty('path');
    }
  });
});