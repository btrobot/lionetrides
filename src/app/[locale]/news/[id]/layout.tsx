import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateAlternates, generateCanonical, type Locale } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || '';
  const pagePath = `/news/${id}`;

  try {
    const res = await fetch(`${baseUrl}/api/v1/news/${id}`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    if (data.success && data.data) {
      const article = data.data;
      return {
        title: t('news_detail_title', { title: article.title }),
        description: article.summary || t('news_detail_description', { title: article.title }),
        alternates: {
          canonical: generateCanonical(locale as Locale, pagePath),
          languages: generateAlternates(pagePath),
        },
        openGraph: {
          title: article.title,
          description: article.summary || '',
          type: 'article',
          publishedTime: article.published_at,
          authors: article.author ? [article.author] : undefined,
          images: article.cover_image ? [{ url: article.cover_image }] : undefined,
        },
      };
    }
  } catch {
    // Fallback
  }

  return {
    title: t('news_title'),
    alternates: {
      canonical: generateCanonical(locale as Locale, pagePath),
      languages: generateAlternates(pagePath),
    },
  };
}

export default function NewsDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
