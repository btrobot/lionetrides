import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getSiteConfig } from '@/services/site-settings-service';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import { InquiryProvider } from '@/components/shared/inquiry-dialog';
import { SiteConfigProvider } from '@/providers/site-config-provider';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Omit<Props, 'children'>) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const siteConfig = await getSiteConfig(locale).catch(() => ({} as Record<string, string>));
  const siteName = siteConfig['site_name'] || t('title');

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteConfig['site_description'] || t('description'),
    keywords: siteConfig['site_keywords'] || t('keywords'),
    openGraph: {
      title: siteName,
      description: siteConfig['site_description'] || t('description'),
      type: 'website',
      siteName,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const siteConfig = await getSiteConfig(locale).catch(() => ({}));

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SiteConfigProvider locale={locale} initialConfig={siteConfig}>
        <InquiryProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </InquiryProvider>
      </SiteConfigProvider>
    </NextIntlClientProvider>
  );
}
