'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, Grid3X3, List, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useInquiry } from '@/components/shared/inquiry-dialog';
import AnimatedSection from '@/components/shared/animated-section';
import type { Locale } from '@/i18n/routing';

const allProducts = [
  { id: 1, name: 'Thunderbolt Coaster', category: 'Roller Coasters', slug: 'roller-coasters', image: '/api/placeholder/400/300', sku: 'RC-001', brand: 'RideCraft', weight: '120t', price: '$1,200,000', rating: 4.9, desc: 'High-speed thrill coaster with 3 inversions and 90° drop' },
  { id: 2, name: 'SkyView Ferris Wheel', category: 'Ferris Wheels', slug: 'ferris-wheels', image: '/api/placeholder/400/300', sku: 'FW-002', brand: 'RideCraft', weight: '450t', price: '$850,000', rating: 4.8, desc: 'Panoramic observation wheel with luxury cabins' },
  { id: 3, name: 'Dream Carousel', category: 'Carousels', slug: 'carousels', image: '/api/placeholder/400/300', sku: 'CR-003', brand: 'RideCraft', weight: '35t', price: '$280,000', rating: 4.7, desc: 'Classic carousel with hand-painted horses and LED lighting' },
  { id: 4, name: 'Bumper Circuit Pro', category: 'Bumper Cars', slug: 'bumper-cars', image: '/api/placeholder/400/300', sku: 'BC-004', brand: 'RideCraft', weight: '15t', price: '$180,000', rating: 4.6, desc: 'Professional bumper car arena with electric powered vehicles' },
  { id: 5, name: 'AquaBlast Slide', category: 'Water Park Rides', slug: 'water-rides', image: '/api/placeholder/400/300', sku: 'WP-005', brand: 'RideCraft', weight: '28t', price: '$450,000', rating: 4.9, desc: 'Multi-lane water slide with LED effects and splash pool' },
  { id: 6, name: 'Happy Swing Boat', category: "Kids' Rides", slug: 'kids-rides', image: '/api/placeholder/400/300', sku: 'KR-006', brand: 'RideCraft', weight: '8t', price: '$95,000', rating: 4.8, desc: 'Gentle swing boat ride for young children' },
  { id: 7, name: 'LoopMaster 360', category: 'Roller Coasters', slug: 'roller-coasters', image: '/api/placeholder/400/300', sku: 'RC-007', brand: 'RideCraft', weight: '180t', price: '$2,500,000', rating: 5.0, desc: 'Ultimate looping coaster with 360° spiral and zero-G roll' },
  { id: 8, name: 'Rainbow Carousel', category: 'Carousels', slug: 'carousels', image: '/api/placeholder/400/300', sku: 'CR-008', brand: 'RideCraft', weight: '28t', price: '$220,000', rating: 4.7, desc: 'Colorful carousel with diverse animal figures' },
  { id: 9, name: 'Tsunami Wave Pool', category: 'Water Park Rides', slug: 'water-rides', image: '/api/placeholder/400/300', sku: 'WP-009', brand: 'RideCraft', weight: '200t', price: '$1,800,000', rating: 4.8, desc: 'Large wave pool with programmable wave patterns' },
  { id: 10, name: 'Kiddie Coaster', category: "Kids' Rides", slug: 'kids-rides', image: '/api/placeholder/400/300', sku: 'KR-010', brand: 'RideCraft', weight: '12t', price: '$150,000', rating: 4.6, desc: 'Safe and fun roller coaster designed for children' },
  { id: 11, name: 'Spinning Tea Cups', category: "Kids' Rides", slug: 'kids-rides', image: '/api/placeholder/400/300', sku: 'KR-011', brand: 'RideCraft', weight: '6t', price: '$85,000', rating: 4.5, desc: 'Classic spinning tea cup ride with themed decoration' },
  { id: 12, name: 'Giant Discovery', category: 'Roller Coasters', slug: 'roller-coasters', image: '/api/placeholder/400/300', sku: 'RC-012', brand: 'RideCraft', weight: '95t', price: '$980,000', rating: 4.7, desc: 'Pendulum ride with 360° rotations and spectacular views' },
];

const categories = ['Roller Coasters', 'Ferris Wheels', 'Carousels', 'Bumper Cars', 'Water Park Rides', "Kids' Rides"];

export default function ProductsPage() {
  const t = useTranslations('products');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = pathname.split('/')[1] as Locale;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const activeCategory = searchParams.get('category') || '';

  const filtered = allProducts
    .filter((p) => !activeCategory || p.slug === activeCategory)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'price-asc' ? a.price.localeCompare(b.price) : sortBy === 'price-desc' ? b.price.localeCompare(a.price) : b.rating - a.rating);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'bg-blue-50 text-blue-600' : ''}>
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : ''}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-blue-50 text-blue-600' : ''}>
              <List className="h-4 w-4" />
            </Button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="newest">{t('sort_newest')}</option>
              <option value="price-asc">{t('sort_price_asc')}</option>
              <option value="price-desc">{t('sort_price_desc')}</option>
            </select>
          </div>
        </div>

        {/* Category Filters */}
        {showFilters && (
          <AnimatedSection className="mb-8 p-4 bg-white rounded-xl border border-gray-100">
            <div className="flex flex-wrap gap-2">
              <Link href={`/${currentLocale}/products`}>
                <Button variant={!activeCategory ? 'default' : 'outline'} size="sm" className={!activeCategory ? 'bg-blue-600' : ''}>
                  {t('all')}
                </Button>
              </Link>
              {categories.map((cat) => (
                <Link key={cat} href={`/${currentLocale}/products?category=${cat.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}`}>
                  <Button variant={activeCategory === cat.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '') ? 'default' : 'outline'} size="sm" className={activeCategory === cat.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '') ? 'bg-blue-600' : ''}>
                    {cat}
                  </Button>
                </Link>
              ))}
            </div>
          </AnimatedSection>
        )}

        {/* Results Count */}
        <p className="text-sm text-gray-500 mb-4">{filtered.length} {t('products_found')}</p>

        {/* Products Grid / List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <ProductCardItem key={product.id} product={product} locale={currentLocale} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((product) => (
              <ProductListItem key={product.id} product={product} locale={currentLocale} />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">{t('no_products')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCardItem({ product, locale }: { product: typeof allProducts[0]; locale: string }) {
  const { openInquiry } = useInquiry();
  return (
    <Link href={`/${locale}/products/${product.id}`}>
      <Card className="group border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">{product.category}</div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 space-y-1">
                <p className="text-xs text-gray-600"><span className="font-medium">SKU:</span> {product.sku}</p>
                <p className="text-xs text-gray-600"><span className="font-medium">Brand:</span> {product.brand}</p>
                <p className="text-xs text-gray-600"><span className="font-medium">Weight:</span> {product.weight}</p>
                <p className="text-xs text-gray-600"><span className="font-medium">Price:</span> {product.price}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{product.name}</h3>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs font-medium">{product.rating}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-3">{product.category}</p>
          <Button
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={(e) => {
              e.preventDefault();
              openInquiry(product.id);
            }}
          >
            Send Inquiry
          </Button>
        </div>
      </Card>
    </Link>
  );
}

function ProductListItem({ product, locale }: { product: typeof allProducts[0]; locale: string }) {
  const { openInquiry } = useInquiry();
  return (
    <Card className="border-0 p-4 hover:shadow-lg transition-all duration-300">
      <div className="flex gap-4">
        <div className="w-32 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs shrink-0">
          {product.category}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.category} | {product.brand}</p>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs font-medium">{product.rating}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-1 mb-2">{product.desc}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>SKU: {product.sku}</span>
            <span>Weight: {product.weight}</span>
            <span className="font-semibold text-blue-600">{product.price}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 justify-center">
          <Link href={`/${locale}/products/${product.id}`}>
            <Button variant="outline" size="sm">Details</Button>
          </Link>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openInquiry(product.id)}>Inquiry</Button>
        </div>
      </div>
    </Card>
  );
}