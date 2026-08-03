import { getTranslations } from 'next-intl/server';
import { InquiryDetailClient } from './page-client';

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ locale: string }> }) {
  const { locale } = await paramsPromise;
  const t = await getTranslations({ locale, namespace: 'account' });
  return {
    title: t('inquiry_detail_title'),
  };
}

export default function InquiryDetailPage() {
  return <InquiryDetailClient />;
}