import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import NewsPage from './page-client';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('news_title'),
    description: t('news_description'),
  };
}

export default async function Page() {
  return <NewsPage />;
}