import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, locales } from '@/i18n/routing';
import { getSiteConfig } from '@/services/site-settings-service';
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import { InquiryProvider } from '@/components/shared/inquiry-dialog';
import { SiteConfigProvider } from '@/providers/site-config-provider';

const BASE_URL = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://lionetrides.com';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Omit<Props, 'children'>) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const siteConfig = await getSiteConfig(locale).catch(() => ({} as Record<string, string>));
  const siteName = siteConfig['site_name'] || t('title');

  // Generate hreflang alternates for the current path (root for layout)
  const alternates: Record<string, string> = {};
  for (const l of locales) {
    alternates[l] = `${BASE_URL}/${l}`;
  }

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteConfig['site_description'] || t('description'),
    keywords: siteConfig['site_keywords'] || t('keywords'),
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: alternates,
    },
    openGraph: {
      title: siteName,
      description: siteConfig['site_description'] || t('description'),
      type: 'website',
      siteName,
      locale: locale,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => `${l}_${l.toUpperCase()}`),
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: siteConfig['site_description'] || t('description'),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'theme-color': '#2563eb',
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
