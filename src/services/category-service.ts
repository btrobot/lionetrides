import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, ilike, isNull, asc, and } from 'drizzle-orm';
import { NotFoundError, paginatedResponse } from '@/lib/errors';

export const categoryService = {
  async list(params: { page?: number; pageSize?: number; search?: string }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 12));
    const conditions = [isNull(categories.deleted_at)];
    if (params.search) conditions.push(ilike(categories.name, `%${params.search}%`));
    const items = await db.select().from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.sort_order))
      .limit(pageSize).offset((page - 1) * pageSize);
    const total = await db.select({ count: categories.id }).from(categories)
      .where(and(...conditions));
    return paginatedResponse(items, total.length > 0 ? total[0].count : 0, { page, pageSize });
  },
  async getById(id: number) {
    const item = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!item[0]) throw new NotFoundError('Category not found');
    return item[0];
  },
  async create(data: { name: string; slug: string;  parentId?: number }) {
    const [item] = await db.insert(categories).values({
      name: data.name, slug: data.slug, 
     
    }).returning();
    return item;
  },
  async update(id: number, data: Partial<{ name: string; slug: string; sortOrder: number; isActive: boolean }>) {
    const [item] = await db.update(categories).set({
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug }),
      ...(data.sortOrder !== undefined && { sort_order: data.sortOrder }),
      ...(data.isActive !== undefined && { is_active: data.isActive }),
    }).where(eq(categories.id, id)).returning();
    if (!item) throw new NotFoundError('Category not found');
    return item;
  },
  async remove(id: number) {
    const [item] = await db.update(categories)
      .set({ deleted_at: new Date() }).where(eq(categories.id, id)).returning();
    if (!item) throw new NotFoundError('Category not found');
    return item;
  },
};
