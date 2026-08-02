'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, FolderTree, Building2, MessageSquare, Users, Star, Settings
} from 'lucide-react';
import type { Locale } from '@/i18n/routing';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/brands', label: 'Brands', icon: Building2 },
  { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-100 min-h-screen p-4 shrink-0">
          <div className="text-lg font-bold text-blue-600 mb-8 px-3">RideCraft Admin</div>
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
                  {link.label}
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