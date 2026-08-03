import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import CategoryDetailPage from './page-client';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || '';

  // Try to fetch the category by slug for accurate metadata
  try {
    const res = await fetch(`${baseUrl}/api/v1/categories?pageSize=100`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    const items = data.data?.items || [];
    const category = items.find((c: { slug: string; name: string }) => c.slug === slug);
    if (category) {
      return {
        title: t('category_detail_title', { name: category.name }),
        description: t('category_detail_description', { name: category.name }),
      };
    }
  } catch {
    // Fallback to generic metadata
  }

  return {
    title: t('categories_title'),
    description: t('categories_description'),
  };
}

export default async function Page() {
  return <CategoryDetailPage />;
}