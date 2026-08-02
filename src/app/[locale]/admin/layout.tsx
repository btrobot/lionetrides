'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Loader2, LogOut } from 'lucide-react';
import {
  LayoutDashboard, Package, FolderTree, Building2, MessageSquare, Users, Star, Settings
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
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
  const { checked, user } = useAdminAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = `/${currentLocale}/auth/login`;
  };

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-100 min-h-screen p-4 shrink-0">
          <div className="flex items-center justify-between mb-8 px-3">
            <span className="text-lg font-bold text-blue-600">{t('sidebar.brand')}</span>
          </div>
          <nav className="space-y-1 flex-1">
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
          <div className="border-t border-gray-100 pt-4 px-3">
            <div className="text-xs text-gray-400 mb-2 truncate">{user?.email}</div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors w-full"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </aside>
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}