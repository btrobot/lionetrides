'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Calendar, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AnimatedSection from '@/components/shared/animated-section';
import type { Locale } from '@/i18n/routing';

const newsList = [
  { id: 1, title: 'RideCraft Unveils Next-Gen Roller Coaster Technology at IAAPA 2025', date: '2025-06-15', category: 'Technology', author: 'RideCraft Team', summary: 'Our latest innovation features magnetic propulsion, real-time health monitoring, and AI-powered predictive maintenance systems.' },
  { id: 2, title: 'Expanding Global Footprint: New Partnership with Middle East Theme Parks', date: '2025-05-28', category: 'Company', author: 'RideCraft Team', summary: 'Strategic partnership to deliver 15 custom rides for a major entertainment complex in Dubai.' },
  { id: 3, title: 'Industry Insights: Trends in Water Park Design for 2025-2026', date: '2025-05-10', category: 'Industry', author: 'Industry Insights', summary: 'An analysis of emerging trends in water park attractions, including hybrid rides, immersive theming, and sustainable design.' },
  { id: 4, title: 'RideCraft Achieves ISO 45001:2023 Certification', date: '2025-04-22', category: 'Company', author: 'RideCraft Team', summary: 'We are proud to announce certification for our occupational health and safety management system.' },
  { id: 5, title: 'How Virtual Reality is Transforming Amusement Ride Experiences', date: '2025-04-08', category: 'Technology', author: 'Tech Review', summary: 'Explore how VR integration is creating new possibilities for ride experiences and park attractions.' },
  { id: 6, title: 'RideCraft at IAAPA Expo Asia 2025: Product Showcase', date: '2025-03-15', category: 'Company', author: 'RideCraft Team', summary: 'Join us at IAAPA Expo Asia as we showcase our latest ride innovations and technologies.' },
];

export default function NewsPage() {
  const t = useTranslations('news');
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.map((item) => (
            <Link key={item.id} href={`/${currentLocale}/news/${item.id}`}>
              <Card className="border-0 hover:shadow-lg transition-all duration-300 h-full">
                <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-sm">
                  {item.category}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.summary}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">By {item.author}</span>
                    <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                      Read More <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}