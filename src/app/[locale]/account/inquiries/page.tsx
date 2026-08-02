'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Filter, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Inquiry {
  id: number;
  inquiry_no: string;
  product_name: string;
  customer_name: string;
  email: string;
  quantity: number;
  status: 'pending' | 'replied' | 'closed';
  message: string | null;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  replied: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-600',
};

export default function AccountInquiriesPage() {
  const t = useTranslations('account');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/inquiries')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setInquiries(data.items || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('inquiries_title')}</h1>
          <p className="mt-2 text-gray-500">{t('inquiries_subtitle')}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder={t('search_inquiries')} className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> {t('filter')}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">{t('no_inquiries')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq) => (
              <Card key={inq.id} className="border-0 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-400">{inq.inquiry_no}</span>
                      <Badge className={statusStyles[inq.status]}>
                        {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{inq.product_name}</h3>
                    <p className="text-sm text-gray-500">
                      {inq.customer_name} · Qty: {inq.quantity} · {new Date(inq.created_at).toLocaleDateString()}
                    </p>
                    {inq.message && <p className="text-sm text-gray-600 mt-2 line-clamp-1">{inq.message}</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600 shrink-0">
                    {t('view_details')} <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}