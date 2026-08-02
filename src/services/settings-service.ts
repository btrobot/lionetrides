import { db } from '@/db';
import { company_info, statistics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';

export const settingsService = {
  async getSettings() {
    const info = await db.select().from(company_info);
    const stats = await db.select().from(statistics);
    const result: Record<string, string> = {};
    info.forEach(i => { result[i.key] = i.value; });
    return { info: result, stats };
  },
  async updateSetting(key: string, value: string) {
    const [item] = await db.update(company_info).set({ value }).where(eq(company_info.key, key)).returning();
    if (!item) throw new NotFoundError(`Setting '${key}' not found`);
    return item;
  },
  async updateStats(id: number, data: Partial<{ label: string; value: string; suffix: string; icon: string }>) {
    const [item] = await db.update(statistics).set(data).where(eq(statistics.id, id)).returning();
    if (!item) throw new NotFoundError('Stat not found');
    return item;
  },
};
