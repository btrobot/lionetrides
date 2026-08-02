import { db } from '@/db';
import { news } from '@/db/schema';
import { eq, desc, isNull, ilike, and } from 'drizzle-orm';
import { NotFoundError, paginatedResponse } from '@/lib/errors';

export const newsService = {
  async list(params: { page?: number; pageSize?: number; search?: string; category?: string }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 12));
    const conditions = [isNull(news.deleted_at)];
    if (params.search) conditions.push(ilike(news.title, `%${params.search}%`));
    if (params.category) conditions.push(eq(news.category, params.category));
    const items = await db.select().from(news)
      .where(and(...conditions))
      .orderBy(desc(news.created_at)).limit(pageSize).offset((page - 1) * pageSize);
    const [{ count }] = await db.select({ count: news.id }).from(news)
      .where(and(...conditions));
    return paginatedResponse(items, count, { page, pageSize });
  },
  async getById(id: number) {
    const [item] = await db.select().from(news).where(eq(news.id, id)).limit(1);
    if (!item) throw new NotFoundError('News not found');
    return item;
  },
  async getBySlug(slug: string) {
    const [item] = await db.select().from(news).where(eq(news.slug, slug)).limit(1);
    if (!item) throw new NotFoundError('News not found');
    return item;
  },
  async create(data: Record<string, unknown>) {
    const [item] = await db.insert(news).values(data).returning();
    return item;
  },
  async update(id: number, data: Record<string, unknown>) {
    const [item] = await db.update(news).set(data).where(eq(news.id, id)).returning();
    if (!item) throw new NotFoundError('News not found');
    return item;
  },
  async remove(id: number) {
    const [item] = await db.update(news).set({ deleted_at: new Date() }).where(eq(news.id, id)).returning();
    if (!item) throw new NotFoundError('News not found');
    return item;
  },
};
