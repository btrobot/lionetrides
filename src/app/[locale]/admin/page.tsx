'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Package, FolderTree, MessageSquare, Users, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/routing';

const stats = [
  { label: 'Total Products', value: '200', icon: Package, change: '+12%', positive: true },
  { label: 'Pending Inquiries', value: '24', icon: MessageSquare, change: '+8%', positive: true },
  { label: 'Active Customers', value: '156', icon: Users, change: '+15%', positive: true },
  { label: 'Monthly Revenue', value: '$2.4M', icon: DollarSign, change: '+22%', positive: true },
];

export default function AdminDashboard() {
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

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

      <Card className="border-0 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href={`/${currentLocale}/admin/products`}>
            <Button variant="outline" className="w-full justify-start gap-2"><Package className="h-4 w-4" /> Add Product</Button>
          </Link>
          <Link href={`/${currentLocale}/admin/inquiries`}>
            <Button variant="outline" className="w-full justify-start gap-2"><MessageSquare className="h-4 w-4" /> View Inquiries</Button>
          </Link>
          <Link href={`/${currentLocale}/admin/categories`}>
            <Button variant="outline" className="w-full justify-start gap-2"><FolderTree className="h-4 w-4" /> Manage Categories</Button>
          </Link>
          <Link href={`/${currentLocale}/admin/customers`}>
            <Button variant="outline" className="w-full justify-start gap-2"><Users className="h-4 w-4" /> View Customers</Button>
          </Link>
        </div>
      </Card>
    </>
  );
}