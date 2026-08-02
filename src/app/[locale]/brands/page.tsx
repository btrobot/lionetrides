'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Globe, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AnimatedSection from '@/components/shared/animated-section';
import type { Locale } from '@/i18n/routing';

const brands = [
  { name: 'RideCraft', country: 'China', founded: 2000, products: 200, desc: 'Premium amusement ride manufacturer with global presence', rating: 4.9 },
  { name: 'ThrillTech', country: 'Germany', founded: 1985, products: 150, desc: 'European leader in coaster technology and innovation', rating: 4.8 },
  { name: 'AquaFun', country: 'USA', founded: 1995, products: 80, desc: 'Specialized in water park attractions and aquatic rides', rating: 4.7 },
  { name: 'KidsJoy', country: 'Japan', founded: 2005, products: 60, desc: 'Focused on children\'s rides and family-friendly attractions', rating: 4.6 },
  { name: 'SkyRides', country: 'Italy', founded: 1978, products: 120, desc: 'Heritage brand known for Ferris wheels and observation towers', rating: 4.8 },
  { name: 'EcoPlay', country: 'Netherlands', founded: 2010, products: 40, desc: 'Sustainable ride solutions using eco-friendly materials', rating: 4.5 },
];

export default function BrandsPage() {
  const t = useTranslations('brands');
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
          {brands.map((brand) => (
            <Card key={brand.name} className="border-0 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">{brand.name[0]}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="text-xs font-medium">{brand.rating}</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{brand.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Globe className="h-3.5 w-3.5" />
                <span>{brand.country} · Est. {brand.founded}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{brand.desc}</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{brand.products} Products</Badge>
                <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
                  View Products <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}