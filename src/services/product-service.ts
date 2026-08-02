import { db } from '@/db';
import { products, categories, brands, reviews } from '@/db/schema';
import { eq, like, or, and, isNull, desc, asc, count, sql } from 'drizzle-orm';
import { NotFoundError, ValidationError, parsePagination, paginatedResponse, PaginatedResult } from '@/lib/errors';
import type { PaginationParams } from '@/lib/errors';

export const productService = {
  async list(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: number;
    brandId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, pageSize = 12, search, categoryId, brandId, sortBy = 'created_at', sortOrder = 'desc' } = params;

    const conditions = [isNull(products.deleted_at), eq(products.status, 'published')];

    if (search) {
      conditions.push(
        sql`(${products.name} ILIKE ${'%' + search + '%'} OR ${products.description} ILIKE ${'%' + search + '%'} OR ${products.sku} ILIKE ${'%' + search + '%'})`
      );
    }
    if (categoryId) conditions.push(eq(products.category_id, categoryId));
    if (brandId) conditions.push(eq(products.brand_id, brandId));

    const where = and(...conditions);

    const [totalResult] = await db.select({ count: count() }).from(products).where(where);
    const total = Number(totalResult.count);

    const sortColumn = getSortColumn(sortBy);
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const items = await db
      .select()
      .from(products)
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return paginatedResponse(items, total, { page, pageSize });
  },

  async getById(id: number) {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deleted_at)))
      .limit(1);

    if (!product) throw new NotFoundError('Product');
    return product;
  },

  async getBySlug(slug: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), isNull(products.deleted_at)))
      .limit(1);

    if (!product) throw new NotFoundError('Product');
    return product;
  },

  async getFeatured(limit: number = 8) {
    const items = await db
      .select()
      .from(products)
      .where(and(eq(products.status, 'published'), isNull(products.deleted_at)))
      .orderBy(desc(products.created_at))
      .limit(limit);

    return items;
  },

  async getReviews(productId: number) {
    const items = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.product_id, productId), eq(reviews.status, 'approved')))
      .orderBy(desc(reviews.created_at));

    const [totalResult] = await db
      .select({ count: count() })
      .from(reviews)
      .where(and(eq(reviews.product_id, productId), eq(reviews.status, 'approved')));

    return { items, total: Number(totalResult.count) };
  },
};

function getSortColumn(sortBy: string) {
  switch (sortBy) {
    case 'name': return products.name;
    case 'price': return products.price;
    case 'created_at': return products.created_at;
    default: return products.created_at;
  }
}