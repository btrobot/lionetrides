'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function AdminCategories() {
  const { authFetch } = useAdminAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/v1/categories')
      .then((r) => r?.json())
      .then((d) => setItems(d?.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authFetch]);

  if (loading) return <p className="text-gray-500">加载中...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">分类管理</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">名称</th>
              <th className="text-left px-4 py-3 font-medium">标识</th>
              <th className="text-left px-4 py-3 font-medium">描述</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">暂无分类。</td></tr>
            )}
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.slug}</td>
                <td className="px-4 py-3 text-gray-600">{c.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}