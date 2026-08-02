'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Share2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NewsDetail {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  cover_image: string | null;
  category: string | null;
  author: string | null;
  published_at: string | null;
  view_count: number | null;
}

export default function NewsDetailPage() {
  const t = useTranslations('news');
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    const path = window.location.pathname;
    const parts = path.split('/');
    const last = parts[parts.length - 1];
    if (last) setSlug(last);
  }, []);

  const [news, setNews] = useState<NewsDetail | null>(null);
  const [related, setRelated] = useState<NewsDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    async function fetchData() {
      try {
        const res = await fetch(`/api/v1/news?limit=10`);
        const data = await res.json();
        const items: NewsDetail[] = data.data?.items || [];
        const current = items.find((n) => n.slug === slug || String(n.id) === slug);
        if (current) {
          setNews(current);
          setRelated(items.filter((n) => n.id !== current.id).slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load news:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-400 text-lg">{t('not_found')}</p>
        <Link href="/news" className="mt-4 text-blue-600 hover:underline">{t('back_to_list')}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/news" className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t('back_to_list')}
          </Link>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          {news.category && <Badge>{news.category}</Badge>}
          {news.published_at && (
            <span className="text-sm text-gray-400">{new Date(news.published_at).toLocaleDateString()}</span>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{news.title}</h1>

        {news.author && (
          <p className="text-gray-500 mb-8">{t('by')} {news.author}</p>
        )}

        {news.cover_image && (
          <div className="aspect-[2/1] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-8 flex items-center justify-center text-gray-400">
            {news.cover_image}
          </div>
        )}

        <div className="prose prose-gray max-w-none">
          {news.summary && <p className="text-lg text-gray-600 leading-relaxed mb-6">{news.summary}</p>}
          {news.content ? (
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">{news.content}</div>
          ) : (
            <p className="text-gray-500 italic">{t('content_unavailable')}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-12 pt-8 border-t">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" /> {t('share')}
          </Button>
        </div>
      </article>

      {related.length > 0 && (
        <section className="bg-white border-t py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('related')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link key={item.id} href={`/news/${item.slug}`}>
                  <div className="p-6 bg-gray-50 rounded-xl hover:shadow-md transition-all">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                    {item.summary && <p className="text-sm text-gray-500 line-clamp-2">{item.summary}</p>}
                    <span className="text-blue-600 text-sm font-medium flex items-center gap-1 mt-3">
                      {t('read_more')} <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}