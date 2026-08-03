import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockDb } from '@/__tests__/unit/helpers/mock-db';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Mock @/db ──────────────────────────────────────────
const mockDb = createMockDb();
vi.mock('@/db', () => ({
  get db() { return mockDb; },
}));

// ─── Mock bcryptjs ──────────────────────────────────────
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('$2a$12$hashedpassword')),
    compare: vi.fn((pw: string) => Promise.resolve(pw === 'password123')),
  },
  hash: vi.fn(() => Promise.resolve('$2a$12$hashedpassword')),
  compare: vi.fn((pw: string) => Promise.resolve(pw === 'password123')),
}));

// ─── Import route handlers after mocking ────────────────
import { POST as authPost } from '@/app/api/v1/auth/route';
import { GET as authMeGet } from '@/app/api/v1/auth/me/route';
import { POST as refreshPost } from '@/app/api/v1/auth/refresh/route';
import { GET as productsGet, POST as productsPost } from '@/app/api/v1/products/route';
import { GET as categoriesGet, POST as categoriesPost } from '@/app/api/v1/categories/route';
import { GET as brandsGet, POST as brandsPost } from '@/app/api/v1/brands/route';
import { POST as inquiriesPost, GET as inquiriesGet } from '@/app/api/v1/inquiries/route';
import { GET as newsGet } from '@/app/api/v1/news/route';
import { GET as reviewsGet } from '@/app/api/v1/reviews/route';
import { signToken } from '@/lib/auth';

// ─── Helper: create a Drizzle-like chain for select queries ──
function selectChain(returnValue: any) {
  // Return a promise-like object (thenable) that resolves to returnValue
  const chain: any = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    groupBy: vi.fn(() => chain),
    having: vi.fn(() => chain),
    then: vi.fn((resolve: any) => {
      if (resolve) return Promise.resolve(resolve(returnValue));
      return Promise.resolve(returnValue);
    }),
    catch: vi.fn(),
  };
  return chain;
}

// ─── Helper: create mock NextRequest ─────────────────────
function createRequest(method: string, url: string, body?: any, auth?: { userId: number; email: string; role: string }) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-forwarded-for': '127.0.0.1',
  };
  if (auth) {
    const token = signToken(auth as any);
    headers['Authorization'] = `Bearer ${token}`;
  }
  return new NextRequest(new URL(url, 'http://localhost:5000'), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ─── Helper: parse Response JSON ─────────────────────────
async function parseResponse(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// ─── Tests ───────────────────────────────────────────────
describe('API Routes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Auth Routes ─────────────────────────────────────
  describe('POST /api/v1/auth (login/register)', () => {
    it('应成功注册新用户', async () => {
      // Mock: no existing user with this email
      mockDb.select.mockReturnValueOnce(selectChain([]));
      // Mock: insert user
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 1, email: 'new@test.com', name: 'New User',
            role: 'customer', company: null, phone: null,
          }]),
        }),
      });

      const req = createRequest('POST', '/api/v1/auth', {
        action: 'register', name: 'New User', email: 'new@test.com', password: 'password123',
      });
      const res = await authPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeTruthy();
      expect(data.data.user.email).toBe('new@test.com');
    });

    it('注册时邮箱已存在应返回 409', async () => {
      mockDb.select.mockReturnValueOnce(selectChain([{ id: 1, email: 'exists@test.com' }]));

      const req = createRequest('POST', '/api/v1/auth', {
        action: 'register', name: 'User', email: 'exists@test.com', password: 'password123',
      });
      const res = await authPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.code).toBe('CONFLICT');
    });

    it('应成功登录有效用户', async () => {
      mockDb.select.mockReturnValueOnce(selectChain([{
        id: 1, email: 'admin@test.com', name: 'Admin',
        password_hash: '$2a$12$hash',
        role: 'admin', login_attempts: 0, locked_until: null,
        company: null, phone: null,
      }]));
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 1 }]) }),
        }),
      });

      const req = createRequest('POST', '/api/v1/auth', {
        action: 'login', email: 'admin@test.com', password: 'password123',
      });
      const res = await authPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeTruthy();
    });

    it('登录密码错误应返回 401', async () => {
      mockDb.select.mockReturnValueOnce(selectChain([{
        id: 1, email: 'admin@test.com', name: 'Admin',
        password_hash: '$2a$12$hash',
        role: 'admin', login_attempts: 0, locked_until: null,
      }]));
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 1 }]) }),
        }),
      });

      const req = createRequest('POST', '/api/v1/auth', {
        action: 'login', email: 'admin@test.com', password: 'wrongpassword',
      });
      const res = await authPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('无效 action 应返回 400', async () => {
      const req = createRequest('POST', '/api/v1/auth', { action: 'unknown' });
      const res = await authPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('验证失败的请求应返回 400', async () => {
      const req = createRequest('POST', '/api/v1/auth', { action: 'register', name: 'A' });
      const res = await authPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.details).toBeDefined();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('已认证用户应返回个人信息', async () => {
      mockDb.select.mockReturnValueOnce(selectChain([{
        id: 1, email: 'admin@test.com', name: 'Admin',
        role: 'admin', phone: null, company: null,
        avatar_url: null, is_active: true, last_login_at: null, created_at: new Date(),
      }]));

      const req = createRequest('GET', '/api/v1/auth/me', undefined, { userId: 1, email: 'admin@test.com', role: 'admin' });
      const res = await authMeGet(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.email).toBe('admin@test.com');
    });

    it('未认证用户应返回 401', async () => {
      const req = createRequest('GET', '/api/v1/auth/me');
      const res = await authMeGet(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('有效令牌应返回新令牌', async () => {
      const token = signToken({ userId: 1, email: 'admin@test.com', role: 'admin' });
      const req = createRequest('POST', '/api/v1/auth/refresh', { token });
      const res = await refreshPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeTruthy();
    });

    it('无效令牌应返回 500', async () => {
      const req = createRequest('POST', '/api/v1/auth/refresh', { token: 'invalid-token' });
      const res = await refreshPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  // ─── Products Routes ─────────────────────────────────
  describe('Products API', () => {
    it('GET /api/v1/products 应返回产品列表', async () => {
      // First call: count query → resolve to [{count: 2}]
      mockDb.select.mockReturnValueOnce(selectChain([{ count: 2 }]));
      // Second call: data query → resolve to products
      mockDb.select.mockReturnValueOnce(selectChain([
        { id: 1, name: '过山车', slug: 'roller-coaster', status: 'published' },
        { id: 2, name: '摩天轮', slug: 'ferris-wheel', status: 'published' },
      ]));

      const req = createRequest('GET', '/api/v1/products?page=1&pageSize=10');
      const res = await productsGet(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.items).toHaveLength(2);
    });

    it('GET /api/v1/products?categoryId=1 应支持筛选', async () => {
      mockDb.select.mockReturnValueOnce(selectChain([{ count: 1 }]));
      mockDb.select.mockReturnValueOnce(selectChain([
        { id: 1, name: '过山车', slug: 'roller-coaster', category_id: 1, status: 'published' },
      ]));

      const req = createRequest('GET', '/api/v1/products?page=1&pageSize=10&categoryId=1');
      const res = await productsGet(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('POST /api/v1/products 需认证', async () => {
      const req = createRequest('POST', '/api/v1/products', {
        name: '新产品', slug: 'new-product', sku: 'NP-001', price: '10000',
      });
      const res = await productsPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  // ─── Categories Routes ───────────────────────────────
  describe('Categories API', () => {
    it('GET /api/v1/categories 应返回分类列表', async () => {
      // CategoryService.list calls select twice: data query then count
      mockDb.select.mockReturnValueOnce(selectChain([
        { id: 1, name: '过山车', slug: 'roller-coaster' },
        { id: 2, name: '旋转木马', slug: 'carousel' },
      ]));
      mockDb.select.mockReturnValueOnce(selectChain([{ count: 2 }]));

      const req = createRequest('GET', '/api/v1/categories');
      const res = await categoriesGet(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('POST /api/v1/categories 需认证', async () => {
      const req = createRequest('POST', '/api/v1/categories', { name: '新分类', slug: 'new-cat' });
      const res = await categoriesPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  // ─── Brands Routes ───────────────────────────────────
  describe('Brands API', () => {
    it('GET /api/v1/brands 应返回品牌列表', async () => {
      mockDb.select.mockReturnValueOnce(selectChain([
        { id: 1, name: '品牌A', slug: 'brand-a' },
        { id: 2, name: '品牌B', slug: 'brand-b' },
      ]));

      const req = createRequest('GET', '/api/v1/brands');
      const res = await brandsGet(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it('POST /api/v1/brands 需认证', async () => {
      const req = createRequest('POST', '/api/v1/brands', { name: '新品牌', slug: 'new-brand' });
      const res = await brandsPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  // ─── Inquiries Routes ────────────────────────────────
  describe('Inquiries API', () => {
    it('POST /api/v1/inquiries 应创建询盘（公开）', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 1, inquiry_no: 'INQ-2025-00001', name: '张三',
            email: 'zhangsan@test.com', message: '请提供报价，需要10台过山车',
            status: 'pending', created_at: new Date(),
          }]),
        }),
      });

      const req = createRequest('POST', '/api/v1/inquiries', {
        name: '张三', email: 'zhangsan@test.com',
        message: '请提供报价，需要10台过山车', quantity: 10,
      });
      const res = await inquiriesPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.inquiry_no).toContain('INQ-');
    });

    it('POST /api/v1/inquiries 验证失败应返回 400', async () => {
      const req = createRequest('POST', '/api/v1/inquiries', {
        name: '', email: 'invalid', message: '短',
      });
      const res = await inquiriesPost(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.details).toBeDefined();
    });

    it('GET /api/v1/inquiries 需认证', async () => {
      const req = createRequest('GET', '/api/v1/inquiries');
      const res = await inquiriesGet(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  // ─── News & Reviews (public) ─────────────────────────
  describe('News API', () => {
    it('GET /api/v1/news 应返回新闻列表', async () => {
      mockDb.select.mockReturnValueOnce(selectChain([{ count: 1 }]));
      mockDb.select.mockReturnValueOnce(selectChain([
        { id: 1, title: '新闻标题', slug: 'news-1', status: 'published' },
      ]));

      const req = createRequest('GET', '/api/v1/news?page=1&pageSize=10');
      const res = await newsGet(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Reviews API', () => {
    it('GET /api/v1/reviews 应返回评价列表', async () => {
      mockDb.select.mockReturnValueOnce(selectChain([{ count: 2 }]));
      mockDb.select.mockReturnValueOnce(selectChain([
        { id: 1, rating: 5, content: '好评！', status: 'approved' },
        { id: 2, rating: 4, content: '不错', status: 'approved' },
      ]));

      const req = createRequest('GET', '/api/v1/reviews?page=1&pageSize=10');
      const res = await reviewsGet(req, { params: Promise.resolve({}) });
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});