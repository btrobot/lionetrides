'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  country: string | null;
}

export default function BrandsPage() {
  const t = useTranslations('brands');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/brands')
      .then((res) => res.json())
      .then((data) => setBrands(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-blue-200 max-w-2xl">{t('subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">{t('no_results')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {brands.map((brand) => (
              <div key={brand.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-8">
                <div className="h-20 flex items-center justify-center mb-6">
                  {brand.logo_url ? (
                    <Image src={brand.logo_url} alt={brand.name} width={160} height={60} className="object-contain max-h-20" />
                  ) : (
                    <span className="text-3xl font-bold text-gray-300">{brand.name.charAt(0)}</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center">{brand.name}</h3>
                {brand.description && (
                  <p className="text-gray-500 text-center mt-2 text-sm">{brand.description}</p>
                )}
                {brand.country && (
                  <p className="text-gray-400 text-center mt-1 text-xs">{brand.country}</p>
                )}
                <div className="mt-6 text-center">
                  <Link
                    href={`/brands/${brand.slug}`}
                    className="inline-flex items-center text-blue-600 font-medium text-sm hover:gap-2 transition-all"
                  >
                    {t('view_products')} <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}