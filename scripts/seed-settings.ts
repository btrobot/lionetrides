import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { site_settings } from '@/db/schema';

const defaultSettings = [
  // ── Brand ──
  { key: 'site_name', value: 'RideCraft Industries', locale: 'en', type: 'text', section: 'brand', label: 'Company Name', sortOrder: 1 },
  { key: 'site_name', value: '瑞德 Craft 实业', locale: 'zh', type: 'text', section: 'brand', label: '公司名称', sortOrder: 1 },
  { key: 'site_logo_url', value: '', locale: 'en', type: 'image', section: 'brand', label: 'Logo URL', sortOrder: 2 },
  { key: 'site_tagline', value: 'Engineering Thrills, Building Trust', locale: 'en', type: 'text', section: 'brand', label: 'Tagline', sortOrder: 3 },
  { key: 'site_tagline', value: '打造惊险，铸就信任', locale: 'zh', type: 'text', section: 'brand', label: '标语', sortOrder: 3 },

  // ── Contact ──
  { key: 'contact_address', value: 'No. 88, Industrial Avenue, Guangzhou, China', locale: 'en', type: 'text', section: 'contact', label: 'Address', sortOrder: 1 },
  { key: 'contact_address', value: '广州市工业大道88号', locale: 'zh', type: 'text', section: 'contact', label: '地址', sortOrder: 1 },
  { key: 'contact_phone', value: '+86 20-8888-8888', locale: 'en', type: 'text', section: 'contact', label: 'Phone', sortOrder: 2 },
  { key: 'contact_phone', value: '+86 20-8888-8888', locale: 'zh', type: 'text', section: 'contact', label: '电话', sortOrder: 2 },
  { key: 'contact_email', value: 'info@ridecraft.com', locale: 'en', type: 'text', section: 'contact', label: 'Email', sortOrder: 3 },
  { key: 'contact_email', value: 'info@ridecraft.com', locale: 'zh', type: 'text', section: 'contact', label: '邮箱', sortOrder: 3 },

  // ── Social ──
  { key: 'social_linkedin', value: 'https://linkedin.com/company/ridecraft', locale: 'en', type: 'text', section: 'social', label: 'LinkedIn URL', sortOrder: 1 },
  { key: 'social_linkedin', value: 'https://linkedin.com/company/ridecraft', locale: 'zh', type: 'text', section: 'social', label: 'LinkedIn 链接', sortOrder: 1 },
  { key: 'social_youtube', value: 'https://youtube.com/@ridecraft', locale: 'en', type: 'text', section: 'social', label: 'YouTube URL', sortOrder: 2 },
  { key: 'social_youtube', value: 'https://youtube.com/@ridecraft', locale: 'zh', type: 'text', section: 'social', label: 'YouTube 链接', sortOrder: 2 },
  { key: 'social_twitter', value: 'https://twitter.com/ridecraft', locale: 'en', type: 'text', section: 'social', label: 'Twitter URL', sortOrder: 3 },
  { key: 'social_twitter', value: 'https://twitter.com/ridecraft', locale: 'zh', type: 'text', section: 'social', label: 'Twitter 链接', sortOrder: 3 },

  // ── SEO ──
  { key: 'site_description', value: 'Leading manufacturer of amusement rides since 1995. Roller coasters, Ferris wheels, carousels, water park rides and more. B2B manufacturing for theme parks worldwide.', locale: 'en', type: 'text', section: 'seo', label: 'Meta Description', sortOrder: 1 },
  { key: 'site_description', value: '自1995年以来的领先游乐设施制造商。过山车、摩天轮、旋转木马、水上乐园设备等。面向全球主题乐园的B2B制造。', locale: 'zh', type: 'text', section: 'seo', label: 'Meta 描述', sortOrder: 1 },
  { key: 'site_keywords', value: 'amusement rides, roller coaster manufacturer, ferris wheel, carousel, water park equipment, theme park rides, B2B, ride manufacturer', locale: 'en', type: 'text', section: 'seo', label: 'Meta Keywords', sortOrder: 2 },
  { key: 'site_keywords', value: '游乐设施, 过山车制造商, 摩天轮, 旋转木马, 水上乐园设备, 主题乐园, B2B, 游乐设备', locale: 'zh', type: 'text', section: 'seo', label: 'Meta 关键词', sortOrder: 2 },
];

async function main() {
  console.log('🔧 Seeding site settings...\n');

  for (const s of defaultSettings) {
    // Use Drizzle SQL template tag for parameterized queries
    const existing = await db.execute(
      sql`SELECT id FROM ${site_settings} WHERE key = ${s.key} AND locale = ${s.locale} LIMIT 1`
    );

    if (existing.rows.length > 0) {
      await db.execute(
        sql`UPDATE ${site_settings} 
            SET value = ${s.value}, type = ${s.type}, section = ${s.section}, 
                label = ${s.label}, sort_order = ${s.sortOrder}, updated_at = NOW()
            WHERE key = ${s.key} AND locale = ${s.locale}`
      );
    } else {
      await db.execute(
        sql`INSERT INTO ${site_settings} (key, value, locale, type, section, label, sort_order)
            VALUES (${s.key}, ${s.value}, ${s.locale}, ${s.type}, ${s.section}, ${s.label}, ${s.sortOrder})`
      );
    }
    console.log(`  ${s.key} (${s.locale}): ${s.value}`);
  }

  console.log('\n✅ Site settings seeded successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});