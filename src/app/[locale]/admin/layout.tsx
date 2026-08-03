'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Loader2, LogOut, Menu, X } from 'lucide-react';
import {
  LayoutDashboard, Package, FolderTree, Building2, MessageSquare,
  Users, Star, Settings, FileText, Shield, ChevronDown,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Toaster } from '@/components/ui/sonner';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-br from-slate-900 via-blue-950 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-400 mx-auto" />
          <p className="mt-4 text-sm text-blue-300/70">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:sticky top-0 left-0 z-30',
            'flex flex-col',
            'w-60 min-h-screen shrink-0',
            'bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900',
            'transition-all duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          )}
        >
          {/* Brand */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Lionet Rides" className="h-8 w-auto" />
              <div>
                <span className="text-base font-bold text-white tracking-tight">Lionet Rides</span>
                <p className="text-[10px] text-blue-300/60 font-medium tracking-wider uppercase">管理后台</p>
              </div>
            </div>
            <button
              className="lg:hidden p-1 text-white/50 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {sidebarLinks
              .filter((link) => !user?.role || link.roles.includes(user.role))
              .map((link) => {
                const isActive = pathname === `/${currentLocale}${link.href}`;
                return (
                  <Link
                    key={link.href}
                    href={`/${currentLocale}${link.href}`}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-blue-500/15 text-blue-300 shadow-sm shadow-blue-500/5'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <link.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-blue-400')} />
                    <span>{link.label}</span>
                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />}
                  </Link>
                );
              })}
          </nav>

          {/* User info */}
          <div className="border-t border-white/10 px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                <p className="text-[10px] text-blue-300/50">
                  {user?.role === 'super_admin' && '超级管理员'}
                  {user?.role === 'admin' && '管理员'}
                  {user?.role === 'editor' && '编辑者'}
                  {user?.role === 'viewer' && '只读用户'}
                </p>
              </div>
              {user?.role && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  user.role === 'super_admin' && 'bg-purple-500/20 text-purple-300',
                  user.role === 'admin' && 'bg-blue-500/20 text-blue-300',
                  user.role === 'editor' && 'bg-green-500/20 text-green-300',
                  user.role === 'viewer' && 'bg-slate-500/20 text-slate-300',
                )}>
                  {user.role === 'super_admin' ? 'SA' : user.role === 'admin' ? 'AD' : user.role === 'editor' ? 'ED' : 'VW'}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors w-full px-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              退出登录
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-10 lg:hidden bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 py-3 flex items-center gap-3">
            <button
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white text-xs font-bold">
                L
              </div>
              <span className="text-sm font-bold text-slate-800">LionetRides</span>
            </div>
          </div>

          {/* Page content */}
          <div className="p-4 lg:p-8">
            {children}
            <Toaster />
          </div>
        </div>
      </div>
    </div>
  );
}