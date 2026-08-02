'use client';

import { useTranslations } from 'next-intl';
import { ChevronRight, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const inquiries = [
  { id: 'INQ-0001', product: 'Thunderbolt Coaster', customer: 'Ocean Paradise Park', email: 'info@oceanparadise.com', quantity: 1, status: 'pending', date: '2025-06-15', message: 'Interested in purchasing for our new park expansion in Q1 2026.' },
  { id: 'INQ-0002', product: 'SkyView Ferris Wheel', customer: 'City Skyline Development', email: 'contact@cityskyline.com', quantity: 2, status: 'replied', date: '2025-06-12', message: 'Looking for a landmark attraction for our new urban complex.' },
  { id: 'INQ-0003', product: 'AquaBlast Slide', customer: 'Splash World Resort', email: 'purchase@splashworld.com', quantity: 3, status: 'closed', date: '2025-06-08', message: 'Need water slides for our new water park expansion.' },
  { id: 'INQ-0004', product: 'Dream Carousel', customer: 'Happy Kids Theme Park', email: 'info@happykids.com', quantity: 1, status: 'pending', date: '2025-06-05', message: 'Classic carousel for our family-friendly zone.' },
  { id: 'INQ-0005', product: 'Bumper Circuit Pro', customer: 'Fun Center Group', email: 'info@funcenter.com', quantity: 2, status: 'replied', date: '2025-06-01', message: 'Upgrading our existing bumper car arena.' },
];

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  replied: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-600',
};

export default function AccountInquiriesPage() {
  const t = useTranslations('account');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('inquiries_title')}</h1>
          <p className="mt-2 text-gray-500">{t('inquiries_subtitle')}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder={t('search_inquiries')} className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> {t('filter')}
          </Button>
        </div>

        {/* Inquiries List */}
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <Card key={inq.id} className="border-0 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-400">{inq.id}</span>
                    <Badge className={statusStyles[inq.status]}>
                      {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{inq.product}</h3>
                  <p className="text-sm text-gray-500">
                    {inq.customer} · Qty: {inq.quantity} · {inq.date}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-1">{inq.message}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 shrink-0">
                  View Details <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}