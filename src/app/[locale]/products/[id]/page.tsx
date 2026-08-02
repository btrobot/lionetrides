'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Star, CheckCircle2, Clock, Truck, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInquiry } from '@/components/shared/inquiry-dialog';

interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  specifications: string | null;
  features: string | null;
  main_image: string | null;
  images: string[];
  price: string | null;
  category_id: number | null;
  category: { id: number; name: string; slug: string } | null;
  brand: { id: number; name: string; slug: string } | null;
}

interface Review {
  id: number;
  customer_name: string;
  rating: number;
  content: string | null;
  created_at: string;
}

interface ProductCard {
  id: number;
  name: string;
  slug: string;
  main_image: string | null;
  price: string | null;
  category: { name: string } | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const { openInquiry } = useInquiry();

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    async function fetchData() {
      try {
        const [prodRes, revRes, relatedRes] = await Promise.all([
          fetch(`/api/v1/products/${id}`),
          fetch(`/api/v1/reviews?productId=${id}&limit=20`),
          fetch(`/api/v1/products?limit=6`),
        ]);
        const prod = await prodRes.json();
        if (prod.success) {
          setProduct(prod.data);
          document.title = `${prod.data.name} | RideCraft Industries`;
        }
        const rev = await revRes.json();
        if (rev.success) {
          const items = rev.data?.items ?? rev.items ?? [];
          setReviews(items);
        }
        const rel = await relatedRes.json();
        if (rel.success) {
          const items = rel.items ?? [];
          setRelated(items.filter((p: ProductCard) => p.id !== Number(id)).slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-6 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <Skeleton className="aspect-[16/10] rounded-2xl" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Product not found</p>
        <Link href="/products" className="text-blue-600 hover:underline">Back to Products</Link>
      </div>
    );
  }

  const specs = product.specifications ? JSON.parse(product.specifications) : [];
  const features = product.features ? JSON.parse(product.features) : [];
  const allImages = [product.main_image, ...(product.images || [])].filter(Boolean) as string[];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-blue-600">Products</Link>
            {product.category && (
              <>
                <span>/</span>
                <Link href={`/products?category=${product.category.id}`} className="hover:text-blue-600">
                  {product.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden group">
              {allImages.length > 0 ? (
                <>
                  <Image
                    src={allImages[currentImage]}
                    alt={`${product.name} - Image ${currentImage + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                    unoptimized
                  />
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImage((c) => (c - 1 + allImages.length) % allImages.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="h-5 w-5 text-gray-700" />
                      </button>
                      <button
                        onClick={() => setCurrentImage((c) => (c + 1) % allImages.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="h-5 w-5 text-gray-700" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-400 text-lg">
                  {product.name}
                </div>
              )}
              {allImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentImage ? 'bg-white w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all ${
                      i === currentImage ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="150px"
                      loading="lazy"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              {product.category && <Badge className="mb-3">{product.category.name}</Badge>}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>SKU: {product.sku}</span>
                {product.brand && <span>Brand: {product.brand.name}</span>}
                {avgRating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {avgRating} ({reviews.length})
                  </span>
                )}
              </div>
              {product.price && <p className="text-2xl font-bold text-blue-600 mb-6">{product.price}</p>}

              <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>CE / TUV / ASTM Certified</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>5 Years Warranty</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-green-500" />
                  <span>Worldwide Shipping</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openInquiry(product.id)}>
                  Send Inquiry
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <Download className="h-4 w-4" /> Download Brochure
                </Button>
              </div>

              {specs.length > 0 && (
                <Card className="mt-6 border-0 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Specifications</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {specs.slice(0, 4).map((spec: { label: string; value: string }, i: number) => (
                      <div key={i} className="text-sm">
                        <span className="text-gray-500">{spec.label}:</span>{' '}
                        <span className="font-medium text-gray-900">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start border-b border-gray-200 rounded-none bg-transparent p-0">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent">Description</TabsTrigger>
              {specs.length > 0 && (
                <TabsTrigger value="specifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent">Specifications</TabsTrigger>
              )}
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="pt-6">
              <div className="max-w-3xl">
                {product.description ? (
                  <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available.</p>
                )}
                {features.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
                    <ul className="space-y-3">
                      {features.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-gray-700">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </TabsContent>

            {specs.length > 0 && (
              <TabsContent value="specifications" className="pt-6">
                <div className="max-w-2xl">
                  <table className="w-full">
                    <tbody>
                      {specs.map((spec: { label: string; value: string }, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 w-1/3">{spec.label}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            )}

            <TabsContent value="reviews" className="pt-6">
              <div className="space-y-6 max-w-3xl">
                {reviews.length === 0 ? (
                  <p className="text-gray-500 italic">No reviews yet for this product.</p>
                ) : (
                  reviews.map((review) => (
                    <Card key={review.id} className="border-0 bg-gray-50 p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{review.customer_name}</h4>
                          <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      {review.content && <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16 border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((rel) => (
                <Link key={rel.id} href={`/products/${rel.id}`} className="group">
                  <Card className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {rel.main_image ? (
                        <Image
                          src={rel.main_image}
                          alt={rel.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, 25vw"
                          loading="lazy"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
                          {rel.name}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {rel.category && <p className="text-xs text-gray-500 mb-1">{rel.category.name}</p>}
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{rel.name}</h3>
                      {rel.price && <p className="text-sm text-blue-600 font-medium mt-1">{rel.price}</p>}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}