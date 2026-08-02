'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
}

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.data?.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const gradientColors = [
    'from-blue-500 to-indigo-600',
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-teal-500 to-green-600',
    'from-pink-500 to-rose-600',
  ];

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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className={`h-48 bg-gradient-to-br ${gradientColors[i % gradientColors.length]} flex items-center justify-center`}>
                  {cat.image_url ? (
                    <Image src={cat.image_url} alt={cat.name} width={120} height={120} className="object-contain opacity-80" />
                  ) : (
                    <span className="text-6xl font-bold text-white/30">{cat.name.charAt(0)}</span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-gray-500 mt-2 text-sm">{cat.description}</p>
                  )}
                  <div className="flex items-center text-blue-600 font-medium mt-4 text-sm group-hover:gap-2 transition-all">
                    {t('view_all')} <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}