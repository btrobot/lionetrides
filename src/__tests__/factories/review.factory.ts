import type { reviews } from '@/db/schema';
type Review = typeof reviews.$inferSelect;

export function buildReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 1,
    product_id: 1,
    user_id: 1,
    rating: 5,
    title: null,
    content: '质量非常好，运行稳定！',
    customer_name: '张三',
    company_name: '欢乐谷主题乐园',
    project_name: null,
    project_location: null,
    images: [],
    status: 'approved',
    is_featured: false,
    deleted_at: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildReviewList(count: number): Review[] {
  return Array.from({ length: count }, (_, i) =>
    buildReview({
      id: i + 1,
      product_id: 1,
      rating: (i % 5) + 1,
      content: `评价内容 ${i + 1}`,
      customer_name: `客户 ${i + 1}`,
    })
  );
}