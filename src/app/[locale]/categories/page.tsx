import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import CategoriesPage from './page-client';
import { generatePageSEO } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return generatePageSEO(locale, '/categories', t('categories_title'), t('categories_description'));
}

export default async function Page() {
  return <CategoriesPage />;
}