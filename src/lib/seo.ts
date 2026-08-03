import { routing, locales, type Locale } from '@/i18n/routing';
export type { Locale } from '@/i18n/routing';

const BASE_URL = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://ridecraft.dev';

/**
 * Generate hreflang alternate links for a given path.
 * Returns an object suitable for Next.js Metadata `alternates.languages`.
 */
export function generateAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of locales) {
    alternates[locale] = `${BASE_URL}/${locale}${path}`;
  }
  return alternates;
}

/**
 * Generate canonical URL for a given locale and path.
 */
export function generateCanonical(locale: Locale, path: string): string {
  return `${BASE_URL}/${locale}${path}`;
}

/**
 * Get the base URL.
 */
export function getBaseUrl(): string {
  return BASE_URL;
}

/**
 * Generate page metadata with hreflang alternates and canonical URL.
 * This is a helper to be used in each page's generateMetadata.
 */
export function generatePageSEO(locale: string, path: string, title: string, description: string) {
  return {
    title,
    description,
    alternates: {
      canonical: generateCanonical(locale as Locale, path),
      languages: generateAlternates(path),
    },
    openGraph: {
      title,
      description,
      locale: locale,
      alternateLocale: locales.filter((l) => l !== locale),
    },
  };
}

/**
 * Generate hreflang <link> tags as raw HTML string for use in <head>.
 */
export function generateHreflangLinks(path: string, includeXDefault: boolean = true): string {
  const links: string[] = [];

  if (includeXDefault) {
    links.push(`<link rel="alternate" hreflang="x-default" href="${BASE_URL}/${routing.defaultLocale}${path}" />`);
  }

  for (const locale of locales) {
    links.push(`<link rel="alternate" hreflang="${locale}" href="${BASE_URL}/${locale}${path}" />`);
  }

  return links.join('\n');
}

/**
 * Locale display names for SEO metadata.
 */
export const localeNames: Record<Locale, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  zh: { native: '中文', english: 'Chinese' },
  ar: { native: 'العربية', english: 'Arabic' },
  de: { native: 'Deutsch', english: 'German' },
  es: { native: 'Español', english: 'Spanish' },
  fr: { native: 'Français', english: 'French' },
  ja: { native: '日本語', english: 'Japanese' },
  ko: { native: '한국어', english: 'Korean' },
  pt: { native: 'Português', english: 'Portuguese' },
  ru: { native: 'Русский', english: 'Russian' },
  th: { native: 'ไทย', english: 'Thai' },
};
