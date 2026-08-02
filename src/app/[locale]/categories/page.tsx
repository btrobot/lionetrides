'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Package, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AnimatedSection from '@/components/shared/animated-section';
import type { Locale } from '@/i18n/routing';

const categories = [
  { name: 'Roller Coasters', slug: 'roller-coasters', count: 8, gradient: 'from-blue-500 to-cyan-500', icon: '🎢', desc: 'High-speed thrill rides with inversions, drops, and twists' },
  { name: 'Ferris Wheels', slug: 'ferris-wheels', count: 6, gradient: 'from-purple-500 to-pink-500', icon: '🎡', desc: 'Panoramic observation wheels with luxury cabins' },
  { name: 'Carousels', slug: 'carousels', count: 5, gradient: 'from-rose-500 to-orange-500', icon: '🎠', desc: 'Classic merry-go-rounds with hand-painted figures' },
  { name: 'Bumper Cars', slug: 'bumper-cars', count: 4, gradient: 'from-amber-500 to-red-500', icon: '🏎️', desc: 'Electric bumper car arenas for family fun' },
  { name: 'Water Park Rides', slug: 'water-rides', count: 7, gradient: 'from-teal-500 to-emerald-500', icon: '🌊', desc: 'Water slides, wave pools, and aquatic attractions' },
  { name: "Kids' Rides", slug: 'kids-rides', count: 6, gradient: 'from-green-500 to-lime-500', icon: '🎪', desc: 'Safe and fun rides designed for young children' },
];

export default function CategoriesPage() {
  const t = useTranslations('categories');
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/${currentLocale}/products?category=${cat.slug}`}>
              <Card className="group border-0 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`} />
                <div className="relative">
                  <span className="text-4xl mb-4 block">{cat.icon}</span>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{cat.name}</h3>
                  <p className="text-sm text-gray-500 mt-2 mb-4">{cat.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{cat.count} Models</span>
                    <span className="text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Explore <ArrowRight className="h-3 w-3" />
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