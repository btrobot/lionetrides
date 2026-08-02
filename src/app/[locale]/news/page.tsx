'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  cover_image: string | null;
  category: string | null;
  author: string | null;
  published_at: string | null;
}

export default function NewsPage() {
  const t = useTranslations('news');
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/news')
      .then((res) => res.json())
      .then((data) => setNewsList(data.data?.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((item) => (
              <Link key={item.id} href={`/news/${item.slug}`}>
                <Card className="border-0 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-sm">
                    {item.category}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                      {item.published_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(item.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                    {item.summary && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.summary}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {item.author && <span className="text-xs text-gray-400">By {item.author}</span>}
                      <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                        {t('read_more')} <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}