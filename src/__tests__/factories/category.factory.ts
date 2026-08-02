import type { categories } from '@/db/schema';
type Category = typeof categories.$inferSelect;

export function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1,
    name: '过山车',
    slug: 'roller-coasters',
    description: null,
    icon: null,
    image_url: null,
    sort_order: 0,
    parent_id: null,
    is_active: true,
    deleted_at: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildCategoryList(count: number): Category[] {
  return Array.from({ length: count }, (_, i) =>
    buildCategory({
      id: i + 1,
      name: `分类 ${i + 1}`,
      slug: `category-${i + 1}`,
      sort_order: i,
    })
  );
}