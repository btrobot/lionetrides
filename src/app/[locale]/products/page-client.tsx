'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Search, SlidersHorizontal, Grid3X3, List, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInquiry } from '@/components/shared/inquiry-dialog';
import { Pagination } from '@/components/shared/pagination';

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

interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
}

export default function ProductsPage() {
  const t = useTranslations('products');
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { openInquiry } = useInquiry();

  const currentPage = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const sortBy = searchParams.get('sort') || 'newest';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), pageSize: '12' });
      if (search) params.set('search', search);
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (selectedBrand) params.set('brandId', selectedBrand);
      if (sortBy === 'price-asc') { params.set('sortBy', 'price'); params.set('sortOrder', 'asc'); }
      else if (sortBy === 'price-desc') { params.set('sortBy', 'price'); params.set('sortOrder', 'desc'); }
      else if (sortBy === 'name') { params.set('sortBy', 'name'); params.set('sortOrder', 'asc'); }
      else { params.set('sortBy', 'id'); params.set('sortOrder', 'desc'); }

      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch(`/api/v1/products?${params.toString()}`),
        fetch('/api/v1/categories'),
        fetch('/api/v1/brands'),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      const brandData = await brandRes.json();

      setProducts(prodData.items?.filter((p: Product) => p.status === 'published') || []);
      setTotal(prodData.total || 0);
      setTotalPages(prodData.totalPages || 0);
      setCategories(catData.data?.items || []);
      setBrands(brandData.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, selectedCategory, selectedBrand, sortBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams();
    // carry over existing params
    const keys = ['q', 'category', 'brand', 'sort', 'page'];
    for (const key of keys) {
      const val = searchParams.get(key);
      if (val) params.set(key, val);
    }
    // apply updates
    for (const [key, val] of Object.entries(updates)) {
      if (val) params.set(key, val);
      else params.delete(key);
    }
    // Reset to page 1 when filters change
    if (!('page' in updates)) params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('?');
  };

  const hasActiveFilters = search || selectedCategory || selectedBrand;

  function ProductCardItem({ product }: { product: Product }) {
    return (
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl">
        <Link href={`/products/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-gray-100">
          {product.main_image ? (
            <Image
              src={product.main_image}
              alt={product.name}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
            <Image src={product.main_image} alt={product.name} fill loading="lazy" sizes="128px" className="object-cover" />
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
                defaultValue={search}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateParams({ q: (e.target as HTMLInputElement).value || null });
                  }
                }}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory || 'all'} onValueChange={(val) => updateParams({ category: val === 'all' ? null : val })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('all_categories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_categories')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedBrand || 'all'} onValueChange={(val) => updateParams({ brand: val === 'all' ? null : val })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={String(brand.id)}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(val) => updateParams({ sort: val })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Filters:</span>
              {search && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateParams({ q: null })}>
                  &ldquo;{search}&rdquo; <X className="w-3 h-3" />
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateParams({ category: null })}>
                  {categories.find(c => String(c.id) === selectedCategory)?.name || `Category #${selectedCategory}`}
                  <X className="w-3 h-3" />
                </Badge>
              )}
              {selectedBrand && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateParams({ brand: null })}>
                  {brands.find(b => String(b.id) === selectedBrand)?.name || `Brand #${selectedBrand}`}
                  <X className="w-3 h-3" />
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="text-xs text-gray-500" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Results info */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-4">
            {total > 0 ? `Showing ${products.length} of ${total} products` : 'No products found'}
          </p>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search or filter criteria</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCardItem key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <ProductListItem key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              page={currentPage}
              pageSize={12}
              total={total}
              totalPages={totalPages}
              onPageChange={(page) => updateParams({ page: String(page) })}
            />
          </div>
        )}
      </div>
    </div>
  );
}