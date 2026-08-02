import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import ProductsPage from './page-client';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('products_title'),
    description: t('products_description'),
  };
}

export default async function Page() {
  return <ProductsPage />;
}