'use client';

import {
  Package, MessageSquare, Users as UsersIcon, Newspaper, Star,
  ArrowRight, TrendingUp, Layers
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import {
  BarChart,
  AreaChart,
  StatusDonut,
  HorizontalBarChart,
  ActivityTimeline,
  StatCard,
} from '@/components/admin/dashboard-charts';
import type { Locale } from '@/i18n/routing';

export default function AdminDashboard() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] as Locale;
  const { authFetch } = useAdminAuth();
  const { data, loading, error } = useDashboardData(authFetch);

  const overviewCards = data
    ? [
        { label: '产品总数', value: data.overview.products, icon: Package, color: 'text-white', bg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', href: '/admin/products' },
        { label: '询盘总数', value: data.overview.inquiries, icon: MessageSquare, color: 'text-white', bg: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', href: '/admin/inquiries' },
        { label: '注册用户', value: data.overview.users, icon: UsersIcon, color: 'text-white', bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', href: '/admin/customers' },
        { label: '新闻文章', value: data.overview.news, icon: Newspaper, color: 'text-white', bg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', href: '/admin/news' },
        { label: '客户评价', value: data.overview.reviews, icon: Star, color: 'text-white', bg: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)', href: '/admin/reviews' },
        { label: '产品分类', value: data.overview.categories, icon: Layers, color: 'text-white', bg: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', href: '/admin/categories' },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-[22px] font-semibold text-slate-900">控制台</h1>
        <p className="text-sm text-slate-500 flex items-center gap-1">
          <TrendingUp className="h-4 w-4" />
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards - 6 columns on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {overviewCards.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Charts Row 1: Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data && (
          <>
            <BarChart
              data={data.monthlyInquiries}
              title="询盘趋势（近12月）"
              color="#f97316"
            />
            <AreaChart
              data={data.monthlyUsers}
              title="用户注册趋势（近12月）"
              color="#2563eb"
            />
          </>
        )}
      </div>

      {/* Charts Row 2: Status Distribution + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {data && (
          <>
            <StatusDonut
              data={data.inquiryStatusDistribution}
              title="询盘状态分布"
            />
            <StatusDonut
              data={data.productStatusDistribution}
              title="产品状态分布"
            />
            <StatusDonut
              data={data.userRoleDistribution.map((r) => ({
                status: r.role,
                count: r.count,
              }))}
              title="用户角色分布"
            />
          </>
        )}
      </div>

      {/* Charts Row 3: Top Products + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data && (
          <>
            <HorizontalBarChart
              data={data.topProducts.map((p) => ({ name: p.name, count: p.count }))}
              title="热门产品（询盘量 Top 10）"
              color="#a855f7"
            />
            <ActivityTimeline items={data.recentActivity} />
          </>
        )}
      </div>

      {/* Category Distribution */}
      {data && data.categoryDistribution.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChart
            data={data.categoryDistribution.map((c) => ({ month: c.name, count: c.count }))}
            title="产品分类分布"
            color="#14b8a6"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-[17px] font-semibold text-slate-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/admin/products', label: '添加产品', icon: Package, color: 'text-blue-600', desc: '管理产品目录与技术参数' },
            { href: '/admin/inquiries', label: '处理询盘', icon: MessageSquare, color: 'text-orange-600', desc: '查看并回复客户询盘' },
            { href: '/admin/news', label: '发布新闻', icon: Newspaper, color: 'text-purple-600', desc: '发布行业资讯与公司动态' },
            { href: '/admin/settings', label: '网站设置', icon: UsersIcon, color: 'text-green-600', desc: '配置品牌信息与SEO' },
          ].map((a) => (
            <Link
              key={a.href}
              href={`/${locale}${a.href}`}
              className="flex items-center justify-between bg-white rounded-xl p-5 border border-slate-200 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-3">
                <div className={`${a.color} p-2 rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors`}>
                  <a.icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-medium text-slate-900 block">{a.label}</span>
                  <span className="text-xs text-slate-500 mt-0.5 block">{a.desc}</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}