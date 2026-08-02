'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, CheckCircle2, ShieldCheck, Clock, Download, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInquiry } from '@/components/shared/inquiry-dialog';
import type { Locale } from '@/i18n/routing';

const product = {
  id: 1,
  name: 'Thunderbolt Coaster',
  category: 'Roller Coasters',
  sku: 'RC-001',
  brand: 'RideCraft',
  price: '$1,200,000',
  rating: 4.9,
  description: 'The Thunderbolt Coaster is a high-speed thrill ride featuring 3 inversions, a 90° vertical drop, and speeds reaching 90 km/h. Designed for maximum excitement while maintaining the highest safety standards, this coaster is perfect for theme parks looking to add a signature attraction.',
  specs: [
    { label: 'Height', value: '45m' },
    { label: 'Speed', value: '90 km/h' },
    { label: 'Track Length', value: '1,200m' },
    { label: 'Capacity', value: '24 passengers' },
    { label: 'Duration', value: '2.5 minutes' },
    { label: 'Weight', value: '120 tons' },
    { label: 'Power', value: '450 kW' },
    { label: 'Material', value: 'High-strength steel' },
    { label: 'Warranty', value: '5 years' },
    { label: 'Certification', value: 'CE, TUV, ASTM' },
  ],
  features: [
    '3 heart-pumping inversions including a corkscrew and loop',
    '90° vertical drop for maximum thrill',
    'State-of-the-art magnetic braking system',
    'LED lighting system for night operation',
    'Customizable train colors and themes',
    'Automated dispatch system with RFID tracking',
  ],
  images: ['/api/placeholder/800/500', '/api/placeholder/800/500', '/api/placeholder/800/500'],
};

const reviews = [
  { id: 1, customer: 'Ocean Paradise Theme Park', rating: 5, content: 'The Thunderbolt Coaster has been a game-changer for our park. Attendance increased by 30% after installation.', date: '2025-03-15' },
  { id: 2, customer: 'Adventure Land Resort', rating: 5, content: 'Exceptional quality and safety standards. The RideCraft team provided excellent support throughout the project.', date: '2024-12-20' },
];

export default function ProductDetailPage() {
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;
  const { openInquiry } = useInquiry();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/${currentLocale}/products`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Products
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-3 space-y-4">
            <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-gray-400 text-lg">
              {product.name} - Main Image
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.images.slice(1).map((img, i) => (
                <div key={i} className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                  View {i + 2}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info Panel */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <Badge className="mb-3">{product.category}</Badge>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>SKU: {product.sku}</span>
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                  {product.rating}
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-6">{product.price}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
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

              {/* Quick Specs */}
              <Card className="mt-6 border-0 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Specifications</h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.specs.slice(0, 4).map((spec) => (
                    <div key={spec.label} className="text-sm">
                      <span className="text-gray-500">{spec.label}:</span>{' '}
                      <span className="font-medium text-gray-900">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs: Description / Specifications / Reviews */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start border-b border-gray-200 rounded-none bg-transparent p-0">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent">Description</TabsTrigger>
              <TabsTrigger value="specifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent">Specifications</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="pt-6">
              <div className="max-w-3xl">
                <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
                <ul className="space-y-3">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="pt-6">
              <div className="max-w-2xl">
                <table className="w-full">
                  <tbody>
                    {product.specs.map((spec, i) => (
                      <tr key={spec.label} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700 w-1/3">{spec.label}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="pt-6">
              <div className="space-y-6 max-w-3xl">
                {reviews.map((review) => (
                  <Card key={review.id} className="border-0 bg-gray-50 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{review.customer}</h4>
                        <p className="text-xs text-gray-500">{review.date}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}