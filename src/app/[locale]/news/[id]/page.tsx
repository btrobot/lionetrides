'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Share2, ArrowRight, Calendar, User, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
  const params = useParams();
  const idOrSlug = params?.id as string;

  const [news, setNews] = useState<NewsDetail | null>(null);
  const [related, setRelated] = useState<NewsDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idOrSlug) return;
    async function fetchData() {
      try {
        // Try fetching by ID first (numeric)
        const isNumeric = /^\d+$/.test(idOrSlug);
        let current: NewsDetail | null = null;

        if (isNumeric) {
          const res = await fetch(`/api/v1/news/${idOrSlug}`);
          const data = await res.json();
          if (data.success && data.data) {
            current = data.data;
          }
        }

        // Fallback: search by slug
        if (!current) {
          const res = await fetch(`/api/v1/news?limit=50`);
          const data = await res.json();
          const items: NewsDetail[] = data.data?.items || [];
          current = items.find((n) => n.slug === idOrSlug) || items.find((n) => String(n.id) === idOrSlug) || null;
          if (current) {
            setRelated(items.filter((n) => n.id !== current!.id).slice(0, 3));
          }
        } else {
          // Fetch related from list
          const listRes = await fetch(`/api/v1/news?limit=10`);
          const listData = await listRes.json();
          const items: NewsDetail[] = listData.data?.items || [];
          setRelated(items.filter((n) => n.id !== current!.id).slice(0, 3));
        }

        if (current) {
          setNews(current);
          document.title = `${current.title} | RideCraft Industries`;
        }
      } catch (err) {
        console.error('Failed to load news:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [idOrSlug]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: news?.title, url: window.location.href });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert(t('link_copied'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-6 w-24 mb-8" />
          <Skeleton className="h-4 w-20 mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-5 w-40 mb-8" />
          <Skeleton className="aspect-[2/1] rounded-xl mb-8" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
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
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/news" className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t('back_to_list')}
          </Link>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Meta */}
        <div className="flex items-center flex-wrap gap-3 mb-6">
          {news.category && <Badge>{news.category}</Badge>}
          {news.published_at && (
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(news.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          )}
          {news.author && (
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <User className="h-3.5 w-3.5" />
              {news.author}
            </span>
          )}
          {news.view_count !== null && news.view_count !== undefined && (
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <Eye className="h-3.5 w-3.5" />
              {news.view_count} views
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{news.title}</h1>

        {news.summary && (
          <p className="text-lg text-gray-600 leading-relaxed mb-8">{news.summary}</p>
        )}

        {/* Cover Image */}
        {news.cover_image ? (
          <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-8">
            <Image
              src={news.cover_image}
              alt={news.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
              unoptimized
            />
          </div>
        ) : null}

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          {news.content ? (
            <div className="text-gray-700 leading-relaxed whitespace-pre-line text-base">{news.content}</div>
          ) : (
            <p className="text-gray-500 italic">{t('content_unavailable')}</p>
          )}
        </div>

        {/* Share */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleShare}>
            <Share2 className="w-4 h-4" /> {t('share')}
          </Button>
        </div>
      </article>

      {/* Related News */}
      {related.length > 0 && (
        <section className="bg-white border-t border-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('related')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link key={item.id} href={`/news/${item.slug}`} className="group">
                  <div className="p-6 bg-gray-50 rounded-xl hover:shadow-md transition-all group-hover:bg-white">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
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