'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Loader2, LogOut, Menu, X } from 'lucide-react';
import {
  LayoutDashboard, Package, FolderTree, Building2, MessageSquare, Users, Star, Settings, FileText, Shield
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Toaster } from '@/components/ui/sonner';
import type { Locale } from '@/i18n/routing';

const sidebarLinks = [
  { href: '/admin', label: '控制台', icon: LayoutDashboard, roles: ['admin', 'super_admin', 'editor', 'viewer'] },
  { href: '/admin/products', label: '产品管理', icon: Package, roles: ['admin', 'super_admin', 'editor', 'viewer'] },
  { href: '/admin/categories', label: '分类管理', icon: FolderTree, roles: ['admin', 'super_admin', 'editor', 'viewer'] },
  { href: '/admin/brands', label: '品牌管理', icon: Building2, roles: ['admin', 'super_admin', 'editor', 'viewer'] },
  { href: '/admin/inquiries', label: '询盘管理', icon: MessageSquare, roles: ['admin', 'super_admin', 'editor', 'viewer'] },
  { href: '/admin/news', label: '新闻管理', icon: FileText, roles: ['admin', 'super_admin', 'editor', 'viewer'] },
  { href: '/admin/customers', label: '客户管理', icon: Users, roles: ['admin', 'super_admin', 'viewer'] },
  { href: '/admin/reviews', label: '评价管理', icon: Star, roles: ['admin', 'super_admin', 'editor', 'viewer'] },
  { href: '/admin/users', label: '用户管理', icon: Shield, roles: ['super_admin'] },
  { href: '/admin/settings', label: '系统设置', icon: Settings, roles: ['super_admin'] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;
  const { checked, user } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-30
            lg:flex lg:flex-col
            w-64 bg-white border-r border-gray-100 min-h-screen p-4 shrink-0
            transition-transform duration-200
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="flex items-center justify-between mb-8 px-3">
            <span className="text-lg font-bold text-blue-600">RideCraft 管理后台</span>
            <button
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-1 flex-1">
            {sidebarLinks
              .filter((link) => !user?.role || link.roles.includes(user.role))
              .map((link) => {
              const isActive = pathname === `/${currentLocale}${link.href}`;
              return (
                <Link
                  key={link.href}
                  href={`/${currentLocale}${link.href}`}
                  onClick={() => setSidebarOpen(false)}
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
          <div className="border-t border-gray-100 pt-4 px-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs text-gray-400 truncate flex-1">{user?.email}</div>
              {user?.role === 'super_admin' && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">超级管理</span>}
              {user?.role === 'admin' && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">管理</span>}
              {user?.role === 'editor' && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">编辑</span>}
              {user?.role === 'viewer' && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">只读</span>}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors w-full"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-10 lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <button
              className="p-1 text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-blue-600">RideCraft 管理后台</span>
          </div>

          <div className="p-4 lg:p-8">
            {children}
            <Toaster />
          </div>
        </div>
      </div>
    </div>
  );
}