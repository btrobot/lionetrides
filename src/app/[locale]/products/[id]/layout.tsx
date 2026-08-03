import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateAlternates, generateCanonical, type Locale } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || '';
  const pagePath = `/products/${id}`;

  try {
    const res = await fetch(`${baseUrl}/api/v1/products/${id}`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    if (data.success && data.data) {
      const product = data.data;
      return {
        title: t('product_detail_title', { name: product.name }),
        description: product.meta_description || product.description?.substring(0, 160) || t('product_detail_description', { name: product.name }),
        alternates: {
          canonical: generateCanonical(locale as Locale, pagePath),
          languages: generateAlternates(pagePath),
        },
        openGraph: {
          title: product.name,
          description: product.description?.substring(0, 200) || '',
          type: 'website',
          images: product.main_image ? [{ url: product.main_image }] : undefined,
        },
      };
    }
  } catch {
    // Fallback
  }

  return {
    title: t('products_title'),
    alternates: {
      canonical: generateCanonical(locale as Locale, pagePath),
      languages: generateAlternates(pagePath),
    },
  };
}

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
