'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, CheckCircle2, Clock, Truck, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  category: { name: string } | null;
  brand: { name: string } | null;
}

interface Review {
  id: number;
  customer_name: string;
  rating: number;
  content: string | null;
  created_at: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { openInquiry } = useInquiry();

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    async function fetchData() {
      try {
        const [prodRes, revRes] = await Promise.all([
          fetch(`/api/v1/products/${id}`),
          fetch('/api/v1/reviews?limit=10'),
        ]);
        const prod = await prodRes.json();
        if (prod.success) setProduct(prod.data);
        const rev = await revRes.json();
        if (rev.success) setReviews(rev.items || []);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-400 text-lg">Product not found</p>
        <Link href="/products" className="mt-4 text-blue-600 hover:underline">Back to Products</Link>
      </div>
    );
  }

  const specs = product.specifications ? JSON.parse(product.specifications) : [];
  const features = product.features ? JSON.parse(product.features) : [];
  const allImages = product.images?.length ? product.images : [product.main_image].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Products
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-3 space-y-4">
            <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-gray-400 text-lg">
              {product.main_image || `${product.name} - Main Image`}
            </div>
            {allImages.length > 1 && (
              <div className="grid grid-cols-3 gap-4">
                {allImages.slice(1, 4).map((img, i) => (
                  <div key={i} className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                    {img?.substring(0, 30) || `View ${i + 2}`}
                  </div>
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
              </div>
              {product.price && <p className="text-2xl font-bold text-blue-600 mb-6">{product.price}</p>}

              <div className="space-y-3 mb-6">
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
                  <p className="text-gray-500 italic">No reviews yet.</p>
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
      </div>
    </div>
  );
}