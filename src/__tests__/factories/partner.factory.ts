import type { partners } from '@/db/schema';
type Partner = typeof partners.$inferSelect;

export function buildPartner(overrides: Partial<Partner> = {}): Partner {
  return {
    id: 1,
    name: '欢乐谷集团',
    logo_url: '/logos/happy-valley.png',
    website: 'https://happyvalley.com',
    description: null,
    sort_order: 0,
    is_active: true,
    deleted_at: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildPartnerList(count: number): Partner[] {
  return Array.from({ length: count }, (_, i) =>
    buildPartner({
      id: i + 1,
      name: `合作伙伴 ${i + 1}`,
      sort_order: i,
    })
  );
}