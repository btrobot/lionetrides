'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function AdminInquiries() {
  const t = useTranslations('admin');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const tok = localStorage.getItem('token');
    fetch('/api/v1/inquiries?limit=50', {
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setItems(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">{t('inquiries.loading')}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('inquiries.title')}</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{t('inquiries.name')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('inquiries.company')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('inquiries.product')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('inquiries.status')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('inquiries.date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t('inquiries.no_results')}</td></tr>
            )}
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{i.name}</td>
                <td className="px-4 py-3 text-gray-600">{i.company || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{i.product_id || '—'}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-orange-50 text-orange-600">{i.status}</span></td>
                <td className="px-4 py-3 text-gray-600">{i.created_at ? new Date(i.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}