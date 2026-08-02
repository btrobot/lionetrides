import type { brands } from '@/db/schema';
type Brand = typeof brands.$inferSelect;

export function buildBrand(overrides: Partial<Brand> = {}): Brand {
  return {
    id: 1,
    name: '测试品牌',
    slug: 'test-brand',
    logo_url: null,
    description: null,
    website: null,
    country: null,
    sort_order: 0,
    is_active: true,
    deleted_at: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildBrandList(count: number): Brand[] {
  return Array.from({ length: count }, (_, i) =>
    buildBrand({
      id: i + 1,
      name: `品牌 ${i + 1}`,
      slug: `brand-${i + 1}`,
      sort_order: i,
    })
  );
}