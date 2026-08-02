import { describe, it, expect } from 'vitest'
/* eslint-disable @typescript-eslint/no-explicit-any */;

import * as schema from '@/db/schema';
import { buildProduct, buildProductList } from '@/__tests__/factories/product.factory';
import { buildCategory } from '@/__tests__/factories/category.factory';
import { buildBrand } from '@/__tests__/factories/brand.factory';
import { buildInquiry } from '@/__tests__/factories/inquiry.factory';
import { buildNews } from '@/__tests__/factories/news.factory';
import { buildReview } from '@/__tests__/factories/review.factory';
import { buildCertification } from '@/__tests__/factories/certification.factory';
import { buildPartner } from '@/__tests__/factories/partner.factory';
import { buildUser } from '@/__tests__/factories/user.factory';

/**
 * Regression Test: Schema Integrity
 *
 * 历史 Bug 复盘：
 * - factory 使用了 schema 中不存在的字段（如 `image` 应为 `image_url`，`code` 不存在）
 * - factory 字段类型与 schema 不匹配（如 `review.images` 类型不一致）
 * - factory 可选字段与 schema 必填字段冲突
 *
 * 本测试自动校验：每个工厂生成的数据，所有字段名都必须在对应表 schema 中真实存在。
 * 新增表或修改 schema 后，factory 若未同步更新，此测试将立即失败。
 */

// ─── 辅助: 从 pgTable 提取列名集合 ───────────────────────────
function getColumnNames(table: any): Set<string> {
  // Drizzle pgTable 的列定义在 table 的 _ 开头的内部属性中
  // 可靠方式：遍历 table 的 Object.keys 过滤出 Column 实例
  const cols = new Set<string>();
  for (const key of Object.keys(table)) {
    if (key.startsWith('_') || key === 'Symbol(state)') continue;
    // Drizzle 的 Column 对象有 columnType 属性
    const col = table[key as keyof typeof table];
    if (col && typeof col === 'object' && 'columnType' in col) {
      cols.add(key);
    }
  }
  return cols;
}

// 用于 factory 的 Partial<InsertType> 的字段名集合
function getFactoryFieldNames<T extends Record<string, any>>(data: T): string[] {
  // 取 build* 函数返回数据中的非函数属性
  return Object.keys(data).filter((k) => {
    const v = data[k];
    // 过滤掉方法
    return typeof v !== 'function';
  });
}

// ─── 测试用例 ────────────────────────────────────────────────

describe('Schema Integrity: Factory ↔ DB Schema', () => {
  // 1. Product
  it('product factory fields should exist in schema', () => {
    const tableCols = getColumnNames(schema.products);
    const product = buildProduct();
    const fields = getFactoryFieldNames(product);
    for (const field of fields) {
      expect(tableCols.has(field)).toBe(true);
    }
  });

  // 2. Category
  it('category factory fields should exist in schema', () => {
    const tableCols = getColumnNames(schema.categories);
    const category = buildCategory();
    const fields = getFactoryFieldNames(category);
    for (const field of fields) {
      expect(tableCols.has(field)).toBe(true);
    }
  });

  // 3. Brand
  it('brand factory fields should exist in schema', () => {
    const tableCols = getColumnNames(schema.brands);
    const brand = buildBrand();
    const fields = getFactoryFieldNames(brand);
    for (const field of fields) {
      expect(tableCols.has(field)).toBe(true);
    }
  });

  // 4. Inquiry
  it('inquiry factory fields should exist in schema', () => {
    const tableCols = getColumnNames(schema.inquiries);
    const inquiry = buildInquiry();
    const fields = getFactoryFieldNames(inquiry);
    for (const field of fields) {
      expect(tableCols.has(field)).toBe(true);
    }
  });

  // 5. News
  it('news factory fields should exist in schema', () => {
    const tableCols = getColumnNames(schema.news);
    const news = buildNews();
    const fields = getFactoryFieldNames(news);
    for (const field of fields) {
      expect(tableCols.has(field)).toBe(true);
    }
  });

  // 6. Review
  it('review factory fields should exist in schema', () => {
    const tableCols = getColumnNames(schema.reviews);
    const review = buildReview();
    const fields = getFactoryFieldNames(review);
    for (const field of fields) {
      expect(tableCols.has(field)).toBe(true);
    }
  });

  // 7. Certification
  it('certification factory fields should exist in schema', () => {
    const tableCols = getColumnNames(schema.certifications);
    const cert = buildCertification();
    const fields = getFactoryFieldNames(cert);
    for (const field of fields) {
      expect(tableCols.has(field)).toBe(true);
    }
  });

  // 8. Partner
  it('partner factory fields should exist in schema', () => {
    const tableCols = getColumnNames(schema.partners);
    const partner = buildPartner();
    const fields = getFactoryFieldNames(partner);
    for (const field of fields) {
      expect(tableCols.has(field)).toBe(true);
    }
  });

  // 9. User
  it('user factory fields should exist in schema', () => {
    const tableCols = getColumnNames(schema.users);
    const user = buildUser();
    const fields = getFactoryFieldNames(user);
    for (const field of fields) {
      expect(tableCols.has(field)).toBe(true);
    }
  });
});

describe('Schema Integrity: Factory data shape', () => {
  // 验证工厂生成的数据类型与 schema 定义一致

  it('product factory should generate valid product data', () => {
    const product = buildProduct();
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('sku');
    expect(product).toHaveProperty('slug');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('status');
    expect(['draft', 'published', 'archived']).toContain(product.status);
  });

  it('product list factory should generate correct count', () => {
    const items = buildProductList(5);
    expect(items).toHaveLength(5);
    items.forEach((item) => {
      expect(item).toHaveProperty('id');
    });
  });

  it('category factory should generate valid category data', () => {
    const category = buildCategory();
    expect(category).toHaveProperty('id');
    expect(category).toHaveProperty('name');
    expect(category).toHaveProperty('slug');
    // image_url 字段必须存在（历史 bug：曾误用 image 字段名）
    expect(category).toHaveProperty('image_url');
    expect(category).not.toHaveProperty('image');
  });

  it('inquiry factory should generate valid inquiry data', () => {
    const inquiry = buildInquiry();
    expect(inquiry).toHaveProperty('id');
    expect(inquiry).toHaveProperty('inquiry_no');
    expect(inquiry).toHaveProperty('contact_name');
    expect(inquiry).toHaveProperty('contact_email');
    expect(inquiry).toHaveProperty('status');
    expect(['pending', 'replied', 'closed']).toContain(inquiry.status);
  });

  it('review factory should generate valid review data', () => {
    const review = buildReview();
    expect(review).toHaveProperty('id');
    expect(review).toHaveProperty('product_id');
    expect(review).toHaveProperty('rating');
    expect(review).toHaveProperty('status');
    expect(['pending', 'approved', 'rejected', 'hidden']).toContain(review.status);
  });

  it('certification factory should not have code field', () => {
    const cert = buildCertification();
    // 历史 bug：曾误用 code 字段名，schema 中无此字段
    expect(cert).not.toHaveProperty('code');
    expect(cert).toHaveProperty('slug');
  });

  it('partner factory should not have slug field', () => {
    const partner = buildPartner();
    // 历史 bug：曾误用 slug 字段名，partners 表无 slug 字段
    expect(partner).not.toHaveProperty('slug');
    expect(partner).toHaveProperty('name');
  });

  it('user factory should generate valid user data', () => {
    const user = buildUser();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('password_hash');
    expect(user).toHaveProperty('role');
    expect(['customer', 'admin', 'super_admin']).toContain(user.role);
  });
});