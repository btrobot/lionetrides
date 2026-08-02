import type { inquiries } from '@/db/schema';
type Inquiry = typeof inquiries.$inferSelect;

export function buildInquiry(overrides: Partial<Inquiry> = {}): Inquiry {
  return {
    id: 1,
    inquiry_no: 'INQ-2025-00001',
    user_id: null,
    product_id: 1,
    contact_name: '张三',
    contact_email: 'zhangsan@test.com',
    contact_phone: '13800138000',
    company_name: '欢乐谷主题乐园',
    quantity: 2,
    message: '请提供报价和交货周期',
    status: 'pending',
    admin_notes: null,
    replied_at: null,
    closed_at: null,
    deleted_at: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildInquiryList(count: number): Inquiry[] {
  return Array.from({ length: count }, (_, i) =>
    buildInquiry({
      id: i + 1,
      inquiry_no: `INQ-2025-${String(i + 1).padStart(5, '0')}`,
      contact_name: `客户 ${i + 1}`,
      contact_email: `customer${i + 1}@test.com`,
    })
  );
}