'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Search, SlidersHorizontal, Grid3X3, List, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInquiry } from '@/components/shared/inquiry-dialog';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  main_image: string | null;
  price: string | null;
  category_id: number | null;
  brand_id: number | null;
  is_featured: boolean;
  status: string;
  category_name?: string;
  brand_name?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export default function ProductsPage() {
  const t = useTranslations('products');
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { openInquiry } = useInquiry();

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/v1/products?limit=100'),
          fetch('/api/v1/categories'),
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        setProducts(prodData.items || []);
        setCategories(catData.data?.items || []);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = products
    .filter((p) => p.status === 'published')
    .filter((p) => selectedCategory === 'all' || p.category_id === Number(selectedCategory))
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-asc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price-desc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.id - a.id;
    });

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val && val !== 'all') params.set('category', val);
    else params.delete('category');
    router.replace(`?${params.toString()}`);
  };

  function ProductCardItem({ product }: { product: Product }) {
    return (
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl">
        <Link href={`/products/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-gray-100">
          {product.main_image ? (
            <Image
              src={product.main_image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl font-bold">
              {product.name.charAt(0)}
            </div>
          )}
          {product.is_featured && (
            <Badge className="absolute top-3 left-3 bg-orange-500 hover:bg-orange-600">
              <Star className="w-3 h-3 mr-1 fill-white" /> Featured
            </Badge>
          )}
        </Link>
        <CardContent className="p-5">
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{product.name}</h3>
          </Link>
          {product.short_description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.short_description}</p>
          )}
          {product.price && (
            <p className="text-lg font-bold text-blue-600 mt-2">${Number(product.price).toLocaleString()}</p>
          )}
        </CardContent>
        <CardFooter className="px-5 pb-5 pt-0">
          <Button
            variant="outline"
            className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
            onClick={() => { openInquiry(product.id, product.name); }}
          >
            {t('send_inquiry')}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  function ProductListItem({ product }: { product: Product }) {
    return (
      <div className="flex gap-4 p-4 border rounded-xl hover:shadow-md transition-shadow bg-white">
        <Link href={`/products/${product.slug}`} className="relative w-32 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {product.main_image ? (
            <Image src={product.main_image} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl font-bold">
              {product.name.charAt(0)}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">{product.name}</h3>
          </Link>
          {product.short_description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{product.short_description}</p>
          )}
          {product.price && (
            <p className="text-base font-bold text-blue-600 mt-1">${Number(product.price).toLocaleString()}</p>
          )}
        </div>
        <div className="shrink-0 flex items-center">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => { openInquiry(product.id, product.name); }}
          >
            {t('send_inquiry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-blue-200 max-w-2xl">{t('subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('all_categories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_categories')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('newest')}</SelectItem>
                <SelectItem value="price-asc">{t('price_low')}</SelectItem>
                <SelectItem value="price-desc">{t('price_high')}</SelectItem>
                <SelectItem value="name">{t('name')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-4">{t('loading')}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">{t('no_results')}</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setSelectedCategory('all'); }}>
              {t('clear_filters')}
            </Button>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <ProductCardItem key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* List */}
        {!loading && filtered.length > 0 && viewMode === 'list' && (
          <div className="space-y-4">
            {filtered.map((product) => (
              <ProductListItem key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      </div>
  );
}