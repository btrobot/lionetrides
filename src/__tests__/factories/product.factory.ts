import type { Product } from '@/db/schema';

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    sku: `SKU-${Date.now()}`,
    price: '99999.00',
    costPrice: '50000.00',
    weight: '5000.00',
    quantity: 10,
    status: true,
    sortOrder: 0,
    isFeatured: false,
    brandId: 1,
    categoryId: 1,
    sales: 0,
    views: 0,
    minOrder: 1,
    unit: '台',
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildProductList(count: number): Product[] {
  return Array.from({ length: count }, (_, i) =>
    buildProduct({ id: i + 1, sku: `SKU-${i + 1}` })
  );
}

export function buildDeletedProduct(overrides: Partial<Product> = {}): Product {
  return buildProduct({
    ...overrides,
    deletedAt: new Date('2025-06-01'),
  });
}

export function buildProductDescription(overrides = {}) {
  return {
    id: 1,
    productId: 1,
    locale: 'zh',
    name: '测试过山车',
    description: '这是一款高性能过山车，适合大型主题乐园',
    metaTitle: '过山车 - 游乐设施制造商',
    metaDescription: '专业过山车制造，安全可靠',
    metaKeywords: '过山车,游乐设施,主题乐园',
    ...overrides,
  };
}