import { db } from '@/db';
import { products, reviews } from '@/db/schema';
import { eq, and, ne, isNull, desc, asc, count, sql, gte, lte, or } from 'drizzle-orm';
import { NotFoundError, paginatedResponse } from '@/lib/errors';

export const productService = {
  async list(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: number;
    brandId?: number;
    minPrice?: number;
    maxPrice?: number;
    material?: string;
    capacity?: string;
    power?: string;
    certification?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, pageSize = 12, search, categoryId, brandId, minPrice, maxPrice, material, capacity, power, certification, sortBy = 'created_at', sortOrder = 'desc' } = params;

    const conditions = [isNull(products.deleted_at), eq(products.status, 'published')];

    if (search) {
      const searchCondition = or(
        sql`to_tsvector('simple', coalesce(${products.name}, '') || ' ' || coalesce(${products.description}, '')) @@ plainto_tsquery('simple', ${search})`,
        sql`${products.name} ILIKE ${'%' + search + '%'}`,
        sql`${products.sku} ILIKE ${'%' + search + '%'}`
      );
      if (searchCondition) conditions.push(searchCondition);
    }
    if (categoryId) conditions.push(eq(products.category_id, categoryId));
    if (brandId) conditions.push(eq(products.brand_id, brandId));
    if (minPrice !== undefined) conditions.push(gte(products.price, String(minPrice)));
    if (maxPrice !== undefined) conditions.push(lte(products.price, String(maxPrice)));
    if (material) conditions.push(eq(products.material, material));
    if (capacity) conditions.push(eq(products.capacity, capacity));
    if (power) conditions.push(eq(products.power, power));
    if (certification) conditions.push(sql`${products.certification} ILIKE ${'%' + certification + '%'}`);

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

  async create(data: {
    name: string;
    slug: string;
    sku: string;
    description?: string;
    categoryId?: number;
    brandId?: number;
    price: string;
    mainImage?: string;
    status?: 'draft' | 'published' | 'archived';
    isFeatured?: boolean;
  }) {
    const [product] = await db
      .insert(products)
      .values({
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        description: data.description || '',
        category_id: data.categoryId || null,
        brand_id: data.brandId || null,
        price: data.price,
        main_image: data.mainImage || null,
        status: data.status || 'draft',
        is_featured: data.isFeatured || false,
      })
      .returning();

    return product;
  },

  async update(id: number, data: Partial<{
    name: string;
    slug: string;
    sku: string;
    description: string;
    categoryId: number;
    brandId: number;
    price: string;
    mainImage: string;
    status: 'draft' | 'published' | 'archived';
    isFeatured: boolean;
  }>) {
    const [product] = await db
      .update(products)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(and(eq(products.id, id), isNull(products.deleted_at)))
      .returning();

    if (!product) throw new NotFoundError('Product');
    return product;
  },

  async remove(id: number) {
    const [product] = await db
      .update(products)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(eq(products.id, id))
      .returning();

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

  async getRelated(productId: number, categoryId: number | null, limit: number = 4) {
    if (!categoryId) return [];
    const items = await db
      .select()
      .from(products)
      .where(and(
        eq(products.category_id, categoryId),
        ne(products.id, productId),
        eq(products.status, 'published'),
        isNull(products.deleted_at)
      ))
      .orderBy(desc(products.created_at))
      .limit(limit);
    return items;
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