import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import NewsPage from './page-client';
import { generatePageSEO } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return generatePageSEO(locale, '/news', t('news_title'), t('news_description'));
}

export default async function Page() {
  return <NewsPage />;
}