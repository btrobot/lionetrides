import type { products } from '@/db/schema';
type Product = typeof products.$inferSelect;

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    sku: `SKU-${Date.now()}`,
    slug: 'test-product',
    name: '测试产品',
    description: null,
    short_description: null,
    price: '99999.00',
    weight: null,
    dimensions: null,
    material: null,
    capacity: null,
    power: null,
    warranty: null,
    certification: null,
    min_order_qty: null,
    main_image: null,
    images: null,
    specifications: null,
    features: null,
    status: 'draft',
    is_featured: false,
    category_id: null,
    brand_id: null,
    view_count: 0,
    inquiry_count: 0,
    meta_title: null,
    meta_description: null,
    deleted_at: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildProductList(count: number): Product[] {
  return Array.from({ length: count }, (_, i) =>
    buildProduct({ id: i + 1, sku: `SKU-${i + 1}`, slug: `product-${i + 1}`, name: `产品 ${i + 1}` })
  );
}

export function buildDeletedProduct(overrides: Partial<Product> = {}): Product {
  return buildProduct({
    ...overrides,
    deleted_at: new Date('2025-06-01'),
  });
}