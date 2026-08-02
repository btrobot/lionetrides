'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function AdminReviews() {
  const { authFetch } = useAdminAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/v1/reviews?limit=50')
      .then((r) => r?.json())
      .then((d) => setItems(d?.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authFetch]);

  if (loading) return <p className="text-gray-500">加载中...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">评价管理</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">客户</th>
              <th className="text-left px-4 py-3 font-medium">评分</th>
              <th className="text-left px-4 py-3 font-medium">内容</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">日期</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无评价。</td></tr>
            )}
            {items.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.name || '—'}</td>
                <td className="px-4 py-3">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.content}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-600">{r.status}</span></td>
                <td className="px-4 py-3 text-gray-600">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}