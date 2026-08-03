'use client';

import {
  Package, MessageSquare, Users as UsersIcon, Newspaper, Star,
  ArrowRight, TrendingUp, UserPlus, Layers
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

const statusLabelMap: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  replied: '已回复',
  closed: '已关闭',
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
  customer: '客户',
  admin: '管理员',
  editor: '编辑',
  viewer: '观察者',
  super_admin: '超级管理员',
};

export default function AdminDashboard() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] as Locale;
  const { authFetch } = useAdminAuth();
  const { data, loading, error } = useDashboardData(authFetch);

  const overviewCards = data
    ? [
        { label: '产品总数', value: data.overview.products, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/products' },
        { label: '询盘总数', value: data.overview.inquiries, icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50', href: '/admin/inquiries' },
        { label: '注册用户', value: data.overview.users, icon: UsersIcon, color: 'text-green-600', bg: 'bg-green-50', href: '/admin/customers' },
        { label: '新闻文章', value: data.overview.news, icon: Newspaper, color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/news' },
        { label: '客户评价', value: data.overview.reviews, icon: Star, color: 'text-rose-600', bg: 'bg-rose-50', href: '/admin/reviews' },
        { label: '产品分类', value: data.overview.categories, icon: Layers, color: 'text-teal-600', bg: 'bg-teal-50', href: '/admin/categories' },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">控制台</h1>
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <TrendingUp className="h-4 w-4" />
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
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
              className="flex items-center justify-between bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-3">
                <div className={`${a.color} p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors`}>
                  <a.icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-medium text-gray-900 block">{a.label}</span>
                  <span className="text-xs text-gray-500 mt-0.5 block">{a.desc}</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}