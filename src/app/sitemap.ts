import { db } from '@/db';
import { products } from '@/db/schema';
import { news } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

const BASE_URL = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://ridecraft.dev';

const LOCALES = ['en', 'zh', 'ja', 'ko', 'th', 'vi', 'id', 'ms', 'de', 'fr', 'es'];
const STATIC_PAGES = ['', 'products', 'categories', 'brands', 'news', 'about', 'contact', 'search'];

export default async function sitemap() {
  // Static pages for all locales
  const staticEntries = STATIC_PAGES.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}/${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'weekly' as const : 'weekly' as const,
      priority: page === '' ? 1.0 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [`/${l}`, `${BASE_URL}/${l}/${page}`])
        ),
      },
    }))
  );

  // Product detail pages (safe query - fallback to empty if DB unavailable at build time)
  let productEntries: SitemapEntry[] = [];
  try {
    const allProducts = await db
      .select({ id: products.id, slug: products.slug, updatedAt: products.updated_at })
      .from(products)
      .where(and(eq(products.status, 'published'), isNull(products.deleted_at)))
      .limit(1000);

    productEntries = allProducts.flatMap((p) =>
      LOCALES.map((locale) => ({
        url: `${BASE_URL}/${locale}/products/${p.id}`,
        lastModified: p.updatedAt || new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))
    );
  } catch {
    // DB not available (e.g., during Docker build), skip dynamic entries
  }

  // News detail pages
  let newsEntries: SitemapEntry[] = [];
  try {
    const allNews = await db
      .select({ id: news.id, updatedAt: news.updated_at })
      .from(news)
      .where(and(eq(news.is_published, true), isNull(news.deleted_at)))
      .limit(1000);

    newsEntries = allNews.flatMap((n) =>
      LOCALES.map((locale) => ({
        url: `${BASE_URL}/${locale}/news/${n.id}`,
        lastModified: n.updatedAt || new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    );
  } catch {
    // DB not available (e.g., during Docker build), skip dynamic entries
  }

  return [...staticEntries, ...productEntries, ...newsEntries];
}

type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: 'weekly' | 'monthly';
  priority: number;
  alternates?: {
    languages: Record<string, string>;
  };
};
}