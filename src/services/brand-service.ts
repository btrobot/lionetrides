import { db } from '@/db';
import { brands } from '@/db/schema';
import { eq, isNull, asc } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';

export const brandService = {
  async list() {
    return db.select().from(brands).where(isNull(brands.deleted_at)).orderBy(asc(brands.sort_order));
  },
  async getById(id: number) {
    const [item] = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
    if (!item) throw new NotFoundError('Brand not found');
    return item;
  },
  async create(data: { name: string; slug: string; logoUrl?: string; description?: string; website?: string; country?: string }) {
    const [item] = await db.insert(brands).values({
      name: data.name, slug: data.slug, logo_url: data.logoUrl || null,
      description: data.description || null, website: data.website || null, country: data.country || null,
    }).returning();
    return item;
  },
  async update(id: number, data: Partial<typeof brands.$inferSelect>) {
    const [item] = await db.update(brands).set(data).where(eq(brands.id, id)).returning();
    if (!item) throw new NotFoundError('Brand not found');
    return item;
  },
  async remove(id: number) {
    const [item] = await db.update(brands).set({ deleted_at: new Date() }).where(eq(brands.id, id)).returning();
    if (!item) throw new NotFoundError('Brand not found');
    return item;
  },
};
