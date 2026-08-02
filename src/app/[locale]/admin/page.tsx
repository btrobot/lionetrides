'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Package, MessageSquare, Users as UsersIcon, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/routing';

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] as Locale;

  const [stats, setStats] = useState([
    { label: 'dashboard.total_products', value: '—', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'dashboard.pending_inquiries', value: '—', icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'dashboard.active_customers', value: '—', icon: UsersIcon, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'dashboard.monthly_revenue', value: '—', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/products?limit=1'),
      fetch('/api/v1/inquiries?limit=1'),
      fetch('/api/v1/customers?limit=1'),
    ]).then(async ([prod, inq, cust]) => {
      const p = await prod.json();
      const i = await inq.json();
      const c = await cust.json();
      setStats([
        { label: 'dashboard.total_products', value: String(p.total ?? '—'), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'dashboard.pending_inquiries', value: String(i.total ?? '—'), icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'dashboard.active_customers', value: String(c.total ?? '—'), icon: UsersIcon, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'dashboard.monthly_revenue', value: '—', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
      ]);
    }).catch(() => {});
  }, []);

  const quickActions = [
    { href: '/admin/products', label: 'dashboard.add_product', icon: Package, color: 'text-blue-600' },
    { href: '/admin/inquiries', label: 'dashboard.view_inquiries', icon: MessageSquare, color: 'text-orange-600' },
    { href: '/admin/categories', label: 'dashboard.manage_categories', icon: TrendingUp, color: 'text-green-600' },
    { href: '/admin/customers', label: 'dashboard.view_customers', icon: UsersIcon, color: 'text-purple-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-lg ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t(s.label)}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.quick_actions')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((a) => (
          <Link
            key={a.href}
            href={`/${locale}${a.href}`}
            className="flex items-center justify-between bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <a.icon className={`h-5 w-5 ${a.color}`} />
              <span className="font-medium text-gray-900">{t(a.label)}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}