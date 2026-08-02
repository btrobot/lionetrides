import { db } from '@/db';
import { reviews } from '@/db/schema';
import { eq, desc, isNull } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';
import { paginatedResponse } from '@/lib/errors';

export const reviewService = {
  async list(params: { page?: number; pageSize?: number; productId?: number; status?: string }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 12));
    const conditions = [isNull(reviews.deleted_at)];
    if (params.productId) conditions.push(eq(reviews.product_id, params.productId));
    if (params.status) conditions.push(eq(reviews.status, params.status as any));
    const items = await db.select().from(reviews)
      .where(conditions.length === 1 ? conditions[0] : (conditions as any))
      .orderBy(desc(reviews.created_at)).limit(pageSize).offset((page - 1) * pageSize);
    const [{ count }] = await db.select({ count: reviews.id }).from(reviews)
      .where(conditions.length === 1 ? conditions[0] : (conditions as any));
    return paginatedResponse(items, count, { page, pageSize });
  },
  async getById(id: number) {
    const [item] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!item) throw new NotFoundError('Review not found');
    return item;
  },
  async create(data: any) {
    const dbData = {
      product_id: data.productId,
      rating: data.rating,
      title: data.title || null,
      content: data.content,
      customer_name: data.customerName || null,
      company_name: data.companyName || null,
    };
    const [item] = await db.insert(reviews).values(dbData).returning();
    return item;
  },
  async approve(id: number) {
    const [item] = await db.update(reviews).set({ status: 'approved' as any }).where(eq(reviews.id, id)).returning();
    if (!item) throw new NotFoundError('Review not found');
    return item;
  },
  async hide(id: number) {
    const [item] = await db.update(reviews).set({ status: 'hidden' }).where(eq(reviews.id, id)).returning();
    if (!item) throw new NotFoundError('Review not found');
    return item;
  },
  async remove(id: number) {
    const [item] = await db.update(reviews).set({ deleted_at: new Date() }).where(eq(reviews.id, id)).returning();
    if (!item) throw new NotFoundError('Review not found');
    return item;
  },
};
