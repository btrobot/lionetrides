import type { Inquiry } from '@/db/schema';

export function buildInquiry(overrides: Partial<Inquiry> = {}): Inquiry {
  return {
    id: 1,
    name: '张三',
    email: 'zhangsan@test.com',
    phone: '13800138000',
    company: '欢乐谷主题乐园',
    quantity: 2,
    message: '请提供报价和交货周期',
    status: 'pending',
    productId: 1,
    customerId: null,
    adminReply: null,
    repliedAt: null,
    closedAt: null,
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildInquiryList(count: number): Inquiry[] {
  return Array.from({ length: count }, (_, i) =>
    buildInquiry({
      id: i + 1,
      name: `客户 ${i + 1}`,
      email: `customer${i + 1}@test.com`,
    })
  );
}