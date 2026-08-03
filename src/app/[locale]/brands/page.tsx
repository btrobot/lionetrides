import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import BrandsPage from './page-client';
import { generatePageSEO } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return generatePageSEO(locale, '/brands', t('brands_title'), t('brands_description'));
}

export default async function Page() {
  return <BrandsPage />;
}