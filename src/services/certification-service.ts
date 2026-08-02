import { db } from '@/db';
import { certifications } from '@/db/schema';
import { eq, isNull, asc } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';

export const certificationService = {
  async list() {
    return db.select().from(certifications).where(isNull(certifications.deleted_at)).orderBy(asc(certifications.sort_order));
  },
  async getById(id: number) {
    const [item] = await db.select().from(certifications).where(eq(certifications.id, id)).limit(1);
    if (!item) throw new NotFoundError('Certification not found');
    return item;
  },
  async create(data: any) {
    const [item] = await db.insert(certifications).values(data).returning();
    return item;
  },
  async update(id: number, data: any) {
    const [item] = await db.update(certifications).set(data).where(eq(certifications.id, id)).returning();
    if (!item) throw new NotFoundError('Certification not found');
    return item;
  },
  async remove(id: number) {
    const [item] = await db.update(certifications).set({ deleted_at: new Date() }).where(eq(certifications.id, id)).returning();
    if (!item) throw new NotFoundError('Certification not found');
    return item;
  },
};
