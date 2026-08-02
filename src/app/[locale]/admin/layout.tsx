'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, Package, FolderTree, Building2, MessageSquare, Users, Star, Settings
} from 'lucide-react';
import type { Locale } from '@/i18n/routing';

const sidebarLinks = [
  { href: '/admin', key: 'sidebar.dashboard', icon: LayoutDashboard },
  { href: '/admin/products', key: 'sidebar.products', icon: Package },
  { href: '/admin/categories', key: 'sidebar.categories', icon: FolderTree },
  { href: '/admin/brands', key: 'sidebar.brands', icon: Building2 },
  { href: '/admin/inquiries', key: 'sidebar.inquiries', icon: MessageSquare },
  { href: '/admin/customers', key: 'sidebar.customers', icon: Users },
  { href: '/admin/reviews', key: 'sidebar.reviews', icon: Star },
  { href: '/admin/settings', key: 'sidebar.settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;
  const t = useTranslations('admin');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-100 min-h-screen p-4 shrink-0">
          <div className="text-lg font-bold text-blue-600 mb-8 px-3">{t('sidebar.brand')}</div>
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === `/${currentLocale}${link.href}`;
              return (
                <Link
                  key={link.href}
                  href={`/${currentLocale}${link.href}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {t(link.key)}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}