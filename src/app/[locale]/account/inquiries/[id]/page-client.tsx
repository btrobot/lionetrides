'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Mail, Phone, Building2, Calendar, Package, MessageSquare, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InquiryDetail {
  id: number;
  inquiry_no: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  company_name: string | null;
  product_id: number;
  quantity: number;
  message: string | null;
  status: 'pending' | 'processing' | 'replied' | 'closed';
  admin_notes: string | null;
  replied_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface HistoryItem {
  id: number;
  previous_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" /> },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: <RefreshCw className="w-4 h-4" /> },
  replied: { label: 'Replied', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-4 h-4" /> },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="w-4 h-4" /> },
};

export function InquiryDetailClient() {
  const t = useTranslations('account');
  const params = useParams();
  const router = useRouter();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id;
    if (!id) return;

    Promise.all([
      fetch(`/api/v1/inquiries/${id}`),
      fetch(`/api/v1/inquiries/${id}/history`),
    ])
      .then(async ([inqRes, histRes]) => {
        const inqData = await inqRes.json();
        const histData = await histRes.json();
        if (inqData.success) setInquiry(inqData.data);
        if (histData.success) setHistory(histData.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">{t('inquiry_not_found')}</p>
          <Button className="mt-4" onClick={() => router.push('/account/inquiries')}>
            {t('back_to_inquiries')}
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[inquiry.status] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            className="mb-4 text-gray-500 hover:text-gray-900"
            onClick={() => router.push('/account/inquiries')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> {t('back_to_inquiries')}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('inquiry_detail_title')}</h1>
              <p className="text-sm text-gray-500 mt-1 font-mono">{inquiry.inquiry_no}</p>
            </div>
            <Badge className={`${status.color} px-3 py-1`}>
              {status.icon}
              <span className="ml-1">{status.label}</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card className="border-0 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('contact_info')}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{inquiry.contact_name.charAt(0)}</span>
                </div>
                <span className="font-medium text-gray-900">{inquiry.contact_name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${inquiry.contact_email}`} className="hover:text-blue-600">{inquiry.contact_email}</a>
              </div>
              {inquiry.contact_phone && (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{inquiry.contact_phone}</span>
                </div>
              )}
              {inquiry.company_name && (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span>{inquiry.company_name}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Inquiry Details */}
          <Card className="border-0 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('inquiry_details')}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Package className="w-4 h-4 text-gray-400" />
                <span>{t('product_id')}: <strong>{inquiry.product_id}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="font-medium">{t('quantity')}:</span>
                <span>{inquiry.quantity}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{t('submitted_at')}: {new Date(inquiry.created_at).toLocaleString()}</span>
              </div>
              {inquiry.replied_at && (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>{t('replied_at')}: {new Date(inquiry.replied_at).toLocaleString()}</span>
                </div>
              )}
              {inquiry.closed_at && (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <XCircle className="w-4 h-4 text-gray-400" />
                  <span>{t('closed_at')}: {new Date(inquiry.closed_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Message */}
        {inquiry.message && (
          <Card className="border-0 p-6 shadow-sm mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <MessageSquare className="w-4 h-4 inline mr-2 text-blue-500" />
              {t('your_message')}
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">{inquiry.message}</p>
          </Card>
        )}

        {/* Admin Reply */}
        {inquiry.admin_notes && (
          <Card className="border-0 p-6 shadow-sm mt-6 bg-blue-50/50">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <MessageSquare className="w-4 h-4 inline mr-2 text-green-500" />
              {t('admin_reply')}
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap bg-white rounded-lg p-4">{inquiry.admin_notes}</p>
          </Card>
        )}

        {/* Status History Timeline */}
        <Card className="border-0 p-6 shadow-sm mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('status_history')}</h2>
          {history.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('no_history')}</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-6">
                {history.map((item) => {
                  const prevCfg = item.previous_status ? statusConfig[item.previous_status] : null;
                  const newCfg = statusConfig[item.new_status] || statusConfig.pending;
                  return (
                    <div key={item.id} className="relative pl-10">
                      <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-white border-2 border-blue-500" />
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">
                          {prevCfg && <span className="text-gray-400">{prevCfg.label} → </span>}
                          {newCfg.label}
                        </span>
                        <span className="text-gray-400 ml-2">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-sm text-gray-500 mt-1">{item.note}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}