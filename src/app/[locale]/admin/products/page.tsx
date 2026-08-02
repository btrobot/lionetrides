'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function AdminProducts() {
  const { authFetch } = useAdminAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/v1/products?limit=50')
      .then((r) => r?.json())
      .then((d) => setProducts(d?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authFetch]);

  if (loading) return <p className="text-gray-500">加载中...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">产品管理</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">名称</th>
              <th className="text-left px-4 py-3 font-medium">SKU</th>
              <th className="text-left px-4 py-3 font-medium">分类</th>
              <th className="text-right px-4 py-3 font-medium">价格</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无产品。</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.sku}</td>
                <td className="px-4 py-3 text-gray-600">{p.category_id ?? '—'}</td>
                <td className="px-4 py-3 text-right text-gray-900">¥{p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}