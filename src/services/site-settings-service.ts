import { db } from '@/db';
import { site_settings } from '@/db/schema';
import { eq, and, asc, isNull } from 'drizzle-orm';

export type SiteSetting = {
  id: number;
  key: string;
  value: string | null;
  locale: string;
  type: string;
  section: string;
  label: string | null;
  sortOrder: number | null;
  deletedAt: Date | string | null;
};

export type SiteConfig = Record<string, string>;

/**
 * Fetch all site settings for a given locale, flatten into a key→value map.
 */
export async function getSiteConfig(locale = 'en'): Promise<SiteConfig> {
  const rows = await db.select()
    .from(site_settings)
    .where(and(eq(site_settings.locale, locale), isNull(site_settings.deletedAt)))
    .orderBy(asc(site_settings.sortOrder));

  const config: SiteConfig = {};
  for (const row of rows) {
    config[row.key] = row.value ?? '';
  }
  return config;
}

/**
 * Get a single setting value by key + locale.
 */
export async function getSiteSetting(key: string, locale = 'en'): Promise<string | null> {
  const rows = await db.select()
    .from(site_settings)
    .where(and(eq(site_settings.key, key), eq(site_settings.locale, locale)))
    .limit(1);
  return rows[0]?.value ?? null;
}

/**
 * Update or insert a site setting.
 */
export async function upsertSiteSetting(data: {
  key: string;
  value: string;
  locale?: string;
  type?: string;
  section?: string;
  label?: string;
  sortOrder?: number;
}) {
  const existing = await db.select()
    .from(site_settings)
    .where(and(
      eq(site_settings.key, data.key),
      eq(site_settings.locale, data.locale ?? 'en'),
    ))
    .limit(1);

  if (existing[0]) {
    const [updated] = await db.update(site_settings)
      .set({
        value: data.value,
        type: data.type ?? existing[0].type,
        section: data.section ?? existing[0].section,
        label: data.label ?? existing[0].label,
        sortOrder: data.sortOrder ?? existing[0].sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(site_settings.id, existing[0].id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(site_settings).values({
    key: data.key,
    value: data.value,
    locale: data.locale ?? 'en',
    type: data.type ?? 'text',
    section: data.section ?? 'general',
    label: data.label ?? data.key,
    sortOrder: data.sortOrder ?? 0,
  }).returning();
  return created;
}

export const siteSettingsService = {
  getConfig: getSiteConfig,
  get: getSiteSetting,
  upsert: upsertSiteSetting,
};