'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Tag, Share2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Locale } from '@/i18n/routing';

const newsItem = {
  id: 1,
  title: 'RideCraft Unveils Next-Gen Roller Coaster Technology at IAAPA 2025',
  date: '2025-06-15',
  category: 'Technology',
  author: 'RideCraft Team',
  content: `
    <p>RideCraft Industries today unveiled its next-generation roller coaster technology at the IAAPA 2025 Expo, marking a significant leap forward in amusement ride innovation.</p>
    
    <h2>Magnetic Propulsion System</h2>
    <p>The new system features an advanced magnetic propulsion technology that delivers smoother acceleration, higher speeds, and significantly reduced energy consumption compared to traditional chain lift systems.</p>
    
    <h2>Real-Time Health Monitoring</h2>
    <p>Every ride is equipped with IoT sensors that provide real-time structural health monitoring. The system can detect potential issues before they become problems, ensuring unprecedented safety standards.</p>
    
    <h2>AI-Powered Predictive Maintenance</h2>
    <p>Our new AI platform analyzes ride data to predict maintenance needs, reducing downtime by up to 40% and extending the lifespan of all components.</p>
    
    <h2>Sustainability Features</h2>
    <p>The new design incorporates energy recovery systems that capture and reuse energy from braking, making our coasters up to 30% more energy-efficient than previous models.</p>
  `,
  related: [
    { id: 2, title: 'Expanding Global Footprint: New Partnership with Middle East Theme Parks' },
    { id: 3, title: 'Industry Insights: Trends in Water Park Design for 2025-2026' },
  ],
};

export default function NewsDetailPage() {
  const t = useTranslations('news');
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/${currentLocale}/news`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to News
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm">
          <Badge className="mb-4">{newsItem.category}</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">{newsItem.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {newsItem.date}</span>
            <span className="flex items-center gap-1"><User className="h-4 w-4" /> {newsItem.author}</span>
            <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>

          <div className="aspect-[16/7] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-8 flex items-center justify-center text-gray-400">
            Featured Image
          </div>

          <div 
            className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-headings:mt-8 prose-headings:mb-4"
            dangerouslySetInnerHTML={{ __html: newsItem.content }}
          />
        </div>

        {/* Related Articles */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {newsItem.related.map((item) => (
              <Link key={item.id} href={`/${currentLocale}/news/${item.id}`}>
                <Card className="border-0 p-6 hover:shadow-lg transition-all duration-300">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                    Read More <ArrowRight className="h-3 w-3" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}