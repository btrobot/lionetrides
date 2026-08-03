import { products } from '@/db/schema';
import { news } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { locales } from '@/i18n/routing';

const BASE_URL = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://ridecraft.dev';

const STATIC_PAGES = ['', 'products', 'categories', 'brands', 'news', 'about', 'contact', 'search'];

// Dynamic sitemap: only run at request time, not during build
export const dynamic = 'force-dynamic';

type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: 'daily' | 'weekly' | 'monthly';
  priority: number;
  alternates?: {
    languages: Record<string, string>;
  };
};

/**
 * Generate hreflang alternates for a given page path.
 */
function generatePageAlternates(pagePath: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of locales) {
    alternates[locale] = `${BASE_URL}/${locale}${pagePath ? '/' + pagePath : ''}`;
  }
  return alternates;
}

export default async function sitemap() {
  // ─── Static pages for all locales ─────────────────────
  const staticEntries: SitemapEntry[] = STATIC_PAGES.flatMap((page) => {
    const pagePath = page ? `/${page}` : '';
    const alternates = generatePageAlternates(pagePath);

    return locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${pagePath}`,
      lastModified: new Date(),
      changeFrequency: (page === '' ? 'daily' : 'weekly') as SitemapEntry['changeFrequency'],
      priority: page === '' ? 1.0 : 0.8,
      alternates: { languages: alternates },
    }));
  });

  // ─── Dynamic pages (products + news) ──────────────────
  let productEntries: SitemapEntry[] = [];
  let newsEntries: SitemapEntry[] = [];

  try {
    const { db } = await import('@/db');

    // Product detail pages
    try {
      const allProducts = await db
        .select({ id: products.id, slug: products.slug, updatedAt: products.updated_at })
        .from(products)
        .where(and(eq(products.status, 'published'), isNull(products.deleted_at)))
        .limit(5000);

      productEntries = allProducts.flatMap((p) => {
        const productPath = `/products/${p.id}`;
        const alternates: Record<string, string> = {};
        for (const locale of locales) {
          alternates[locale] = `${BASE_URL}/${locale}${productPath}`;
        }

        return locales.map((locale) => ({
          url: `${BASE_URL}/${locale}${productPath}`,
          lastModified: p.updatedAt || new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
          alternates: { languages: alternates },
        }));
      });
    } catch {
      // DB not available, skip product entries
    }

    // News detail pages
    try {
      const allNews = await db
        .select({ id: news.id, updatedAt: news.updated_at })
        .from(news)
        .where(and(eq(news.is_published, true), isNull(news.deleted_at)))
        .limit(5000);

      newsEntries = allNews.flatMap((n) => {
        const newsPath = `/news/${n.id}`;
        const alternates: Record<string, string> = {};
        for (const locale of locales) {
          alternates[locale] = `${BASE_URL}/${locale}${newsPath}`;
        }

        return locales.map((locale) => ({
          url: `${BASE_URL}/${locale}${newsPath}`,
          lastModified: n.updatedAt || new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
          alternates: { languages: alternates },
        }));
      });
    } catch {
      // DB not available, skip news entries
    }
  } catch {
    // DB module not available (build time), skip dynamic entries
  }

  return [...staticEntries, ...productEntries, ...newsEntries];
}
