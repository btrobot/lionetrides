import type { certifications } from '@/db/schema';
type Certification = typeof certifications.$inferSelect;

export function buildCertification(overrides: Partial<Certification> = {}): Certification {
  return {
    id: 1,
    name: 'ISO 9001',
    slug: 'iso-9001-2025',
    logo_url: null,
    description: null,
    issuing_body: 'SGS',
    certificate_number: 'CERT-001',
    issue_date: new Date('2025-01-01'),
    expiry_date: new Date('2028-01-01'),
    sort_order: 0,
    is_active: true,
    deleted_at: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildCertificationList(count: number): Certification[] {
  return Array.from({ length: count }, (_, i) =>
    buildCertification({
      id: i + 1,
      name: `认证 ${i + 1}`,
      slug: `cert-${i + 1}`,
      sort_order: i,
    })
  );
}