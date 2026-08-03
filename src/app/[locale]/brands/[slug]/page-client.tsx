'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Search, Star, Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/shared/pagination';
import { useInquiry } from '@/components/shared/inquiry-dialog';

interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  country: string | null;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  main_image: string | null;
  price: string | null;
  is_featured: boolean;
  status: string;
  category_name?: string;
  brand_name?: string;
}

export default function BrandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('brands');
  const pT = useTranslations('products');
  const { openInquiry } = useInquiry();

  const slug = params?.slug as string;
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [notFound, setNotFound] = useState(false);

  // Fetch brand info by slug
  useEffect(() => {
    if (!slug) return;
    async function fetchBrand() {
      try {
        const res = await fetch('/api/v1/brands');
        const data = await res.json();
        const items = data.data || [];
        const found = items.find((b: Brand) => b.slug === slug);
        if (found) {
          setBrand(found);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Failed to load brand:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchBrand();
  }, [slug]);

  // Fetch products when brand is found or page changes
  useEffect(() => {
    if (!brand) return;
    const br = brand;
    setProductsLoading(true);
    async function fetchProducts() {
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: '12',
          brandId: String(br.id),
          sortBy: 'sort_order',
          sortOrder: 'asc',
        });
        const res = await fetch(`/api/v1/products?${params.toString()}`);
        const data = await res.json();
        setProducts(data.items?.filter((p: Product) => p.status === 'published') || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setProductsLoading(false);
      }
    }
    fetchProducts();
  }, [brand, currentPage, brand?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <Skeleton className="h-10 w-64 bg-white/10 mb-4" />
            <Skeleton className="h-6 w-96 bg-white/10" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !brand) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Brand not found</p>
        <Link href="/brands" className="text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Brands
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <Link
            href="/brands"
            className="inline-flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Brands
          </Link>
          <div className="flex items-center gap-6">
            {brand.logo_url ? (
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white/10 shrink-0 flex items-center justify-center p-3">
                <Image
                  src={brand.logo_url}
                  alt={brand.name}
                  width={96}
                  height={96}
                  className="object-contain max-w-full max-h-full"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <span className="text-4xl font-bold text-white/30">{brand.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{brand.name}</h1>
              {brand.description && (
                <p className="text-xl text-blue-200 max-w-2xl">{brand.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-blue-300 text-sm">
                {brand.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {brand.country}
                  </span>
                )}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-200 hover:text-white transition-colors"
                  >
                    <Globe className="w-4 h-4" /> Website
                  </a>
                )}
                <span>
                  {total > 0 ? `${total} products` : 'Loading products...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href="/brands" className="hover:text-blue-600">Brands</Link>
            <span>/</span>
            <span className="text-gray-900">{brand.name}</span>
          </nav>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {productsLoading ? (
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
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{pT('no_results')}</h3>
            <p className="text-gray-400 mb-6">No products available for this brand yet.</p>
            <Button variant="outline" onClick={() => router.push('/products')}>
              Browse All Products
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                Showing {products.length} of {total} products
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl">
                  <Link href={`/products/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {product.main_image ? (
                      <Image
                        src={product.main_image}
                        alt={product.name}
                        fill
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
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
                      {pT('send_inquiry')}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  page={currentPage}
                  pageSize={12}
                  total={total}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}