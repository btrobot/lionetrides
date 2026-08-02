import { db } from '@/db';
import { partners } from '@/db/schema';
import { eq, isNull, asc } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';

export const partnerService = {
  async list() {
    return db.select().from(partners).where(isNull(partners.deleted_at)).orderBy(asc(partners.sort_order));
  },
  async getById(id: number) {
    const [item] = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
    if (!item) throw new NotFoundError('Partner not found');
    return item;
  },
  async create(data: typeof partners.$inferInsert) {
    const [item] = await db.insert(partners).values(data).returning();
    return item;
  },
  async update(id: number, data: Partial<typeof partners.$inferInsert>) {
    const [item] = await db.update(partners).set(data).where(eq(partners.id, id)).returning();
    if (!item) throw new NotFoundError('Partner not found');
    return item;
  },
  async remove(id: number) {
    const [item] = await db.update(partners).set({ deleted_at: new Date() }).where(eq(partners.id, id)).returning();
    if (!item) throw new NotFoundError('Partner not found');
    return item;
  },
};
