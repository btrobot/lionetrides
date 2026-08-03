import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import ContactPage from './page-client';
import { generatePageSEO } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return generatePageSEO(locale, '/contact', t('contact_title'), t('contact_description'));
}

export default async function Page() {
  return <ContactPage />;
}