'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Package, FolderTree, Building2, MessageSquare, Users, Star, Settings,
  TrendingUp, ShoppingCart, Eye, DollarSign
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

const stats = [
  { label: 'Total Products', value: '200', icon: Package, change: '+12%', positive: true },
  { label: 'Pending Inquiries', value: '24', icon: MessageSquare, change: '+8%', positive: true },
  { label: 'Active Customers', value: '156', icon: Users, change: '+15%', positive: true },
  { label: 'Monthly Revenue', value: '$2.4M', icon: DollarSign, change: '+22%', positive: true },
];

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-100 min-h-screen p-4">
          <div className="text-lg font-bold text-blue-600 mb-8 px-3">RideCraft Admin</div>
          <nav className="space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={`/${currentLocale}${link.href}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  link.href === '/admin'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-0 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <stat.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className={`text-xs font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="border-0 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href={`/${currentLocale}/admin/products`}>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Package className="h-4 w-4" /> Add Product
                </Button>
              </Link>
              <Link href={`/${currentLocale}/admin/inquiries`}>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MessageSquare className="h-4 w-4" /> View Inquiries
                </Button>
              </Link>
              <Link href={`/${currentLocale}/admin/categories`}>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FolderTree className="h-4 w-4" /> Manage Categories
                </Button>
              </Link>
              <Link href={`/${currentLocale}/admin/settings`}>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Inquiries</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 font-medium text-gray-500">Inquiry No.</th>
                    <th className="text-left py-3 font-medium text-gray-500">Customer</th>
                    <th className="text-left py-3 font-medium text-gray-500">Product</th>
                    <th className="text-left py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-medium">INQ-{String(1000 + i).slice(1)}</td>
                      <td className="py-3 text-gray-600">Customer {i}</td>
                      <td className="py-3 text-gray-600">Product {i}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          i <= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {i <= 2 ? 'Pending' : 'Replied'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">2025-06-{10 + i}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}