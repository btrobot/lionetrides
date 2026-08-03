import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import BrandDetailPage from './page-client';
import { generateAlternates, generateCanonical, type Locale } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || '';
  const pagePath = `/brands/${slug}`;

  // Try to fetch the brand by slug for accurate metadata
  try {
    const res = await fetch(`${baseUrl}/api/v1/brands`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    const items = data.data || [];
    const brand = items.find((b: { slug: string; name: string }) => b.slug === slug);
    if (brand) {
      return {
        title: t('brand_detail_title', { name: brand.name }),
        description: t('brand_detail_description', { name: brand.name }),
        alternates: {
          canonical: generateCanonical(locale as Locale, pagePath),
          languages: generateAlternates(pagePath),
        },
      };
    }
  } catch {
    // Fallback to generic metadata
  }

  return {
    title: t('brands_title'),
    description: t('brands_description'),
    alternates: {
      canonical: generateCanonical(locale as Locale, pagePath),
      languages: generateAlternates(pagePath),
    },
  };
}

export default async function Page() {
  return <BrandDetailPage />;
}