'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function AdminCustomers() {
  const t = useTranslations('admin');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tok = localStorage.getItem('token');
    fetch('/api/v1/customers?limit=50', {
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setItems(d.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">{t('customers.loading')}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('customers.title')}</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{t('customers.name')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('customers.email')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('customers.phone')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('customers.company')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('customers.role')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('customers.joined')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t('customers.no_results')}</td></tr>
            )}
            {items.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{u.company || '—'}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600">{u.role}</span></td>
                <td className="px-4 py-3 text-gray-600">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}