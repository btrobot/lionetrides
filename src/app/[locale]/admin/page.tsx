'use client';

import { useEffect, useState } from 'react';
import {
  Package, MessageSquare, Users as UsersIcon, Newspaper, Star,
  ArrowRight, Clock, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import type { Locale } from '@/i18n/routing';

interface StatItem {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  href: string;
}

interface RecentInquiry {
  id: number;
  company: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  products?: { name: string };
}

interface RecentReview {
  id: number;
  rating: number;
  content: string;
  status: string;
  created_at: string;
  user_name: string;
  products?: { name: string };
}

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; class: string }> = {
    pending: { label: '待处理', class: 'bg-yellow-100 text-yellow-800' },
    processing: { label: '处理中', class: 'bg-blue-100 text-blue-800' },
    replied: { label: '已回复', class: 'bg-green-100 text-green-800' },
    closed: { label: '已关闭', class: 'bg-gray-100 text-gray-600' },
    approved: { label: '已审核', class: 'bg-green-100 text-green-800' },
    hidden: { label: '已隐藏', class: 'bg-gray-100 text-gray-600' },
  };
  const m = map[status] || { label: status, class: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.class}`}>{m.label}</span>;
};

export default function AdminDashboard() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] as Locale;
  const { authFetch } = useAdminAuth();

  const [stats, setStats] = useState<StatItem[]>([
    { label: '产品总数', value: '—', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/products' },
    { label: '待处理询盘', value: '—', icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50', href: '/admin/inquiries' },
    { label: '注册客户', value: '—', icon: UsersIcon, color: 'text-green-600', bg: 'bg-green-50', href: '/admin/customers' },
    { label: '新闻文章', value: '—', icon: Newspaper, color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/news' },
    { label: '客户评价', value: '—', icon: Star, color: 'text-rose-600', bg: 'bg-rose-50', href: '/admin/reviews' },
  ]);

  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, inqRes, custRes, newsRes, revRes] = await Promise.all([
          authFetch('/api/v1/products?limit=1'),
          authFetch('/api/v1/inquiries?page=1&pageSize=5'),
          authFetch('/api/v1/customers'),
          authFetch('/api/v1/news'),
          authFetch('/api/v1/reviews'),
        ]);

        if (!prodRes || !inqRes || !custRes || !newsRes || !revRes) return;

        const [prod, inq, cust, news, rev] = await Promise.all([
          prodRes.json(), inqRes.json(), custRes.json(), newsRes.json(), revRes.json(),
        ]);

        // Products: {success, items, total, ...}
        const productTotal = prod.total ?? 0;
        // Inquiries: {success, items, total, ...}
        const inquiryTotal = inq.total ?? 0;
        // Customers: {success, data: {items, total, ...}}
        const customerTotal = cust.data?.total ?? cust.data?.length ?? 0;
        // News: {success, data: {items, total, ...}}
        const newsTotal = news.data?.total ?? news.data?.length ?? 0;
        // Reviews: {success, data: {items, total, ...}}
        const reviewTotal = rev.data?.total ?? rev.data?.length ?? 0;

        setStats([
          { label: '产品总数', value: String(productTotal), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/products' },
          { label: '待处理询盘', value: String(inquiryTotal), icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50', href: '/admin/inquiries' },
          { label: '注册客户', value: String(customerTotal), icon: UsersIcon, color: 'text-green-600', bg: 'bg-green-50', href: '/admin/customers' },
          { label: '新闻文章', value: String(newsTotal), icon: Newspaper, color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/news' },
          { label: '客户评价', value: String(reviewTotal), icon: Star, color: 'text-rose-600', bg: 'bg-rose-50', href: '/admin/reviews' },
        ]);

        // Recent inquiries
        const inqItems = inq.items ?? [];
        setRecentInquiries(inqItems.slice(0, 5));

        // Recent reviews
        const revItems = rev.data?.items ?? [];
        setRecentReviews(revItems.slice(0, 5));
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authFetch]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">控制台</h1>
        <p className="text-sm text-gray-500">
          <Clock className="inline h-4 w-4 mr-1" />
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={`/${locale}${s.href}`}
            className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`${s.bg} p-2.5 rounded-lg ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">
              {loading ? (
                <span className="inline-block w-10 h-7 bg-gray-100 rounded animate-pulse" />
              ) : (
                s.value
              )}
            </p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Recent Inquiries */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-500" />
              最新询盘
            </h2>
            <Link
              href={`/${locale}/admin/inquiries`}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              查看全部 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded w-1/3 mb-1 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))
            ) : recentInquiries.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">暂无询盘</p>
              </div>
            ) : (
              recentInquiries.map((inq) => (
                <div key={inq.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {inq.company || inq.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{inq.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(inq.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Star className="h-4 w-4 text-rose-500" />
              最新评价
            </h2>
            <Link
              href={`/${locale}/admin/reviews`}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              查看全部 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded w-1/3 mb-1 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))
            ) : recentReviews.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">暂无评价</p>
              </div>
            ) : (
              recentReviews.map((rev) => (
                <div key={rev.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 bg-rose-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Star className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-900">{rev.user_name}</span>
                      <span className="text-xs text-yellow-500">
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{rev.content}</p>
                  </div>
                  <div>
                    {rev.status === 'pending' ? (
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> 待审核
                      </span>
                    ) : rev.status === 'approved' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
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
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}