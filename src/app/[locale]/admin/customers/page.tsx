'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function AdminCustomers() {
  const { authFetch } = useAdminAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/v1/customers?limit=50')
      .then((r) => r?.json())
      .then((d) => setItems(d?.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authFetch]);

  if (loading) return <p className="text-gray-500">加载中...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">客户管理</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">姓名</th>
              <th className="text-left px-4 py-3 font-medium">邮箱</th>
              <th className="text-left px-4 py-3 font-medium">电话</th>
              <th className="text-left px-4 py-3 font-medium">公司</th>
              <th className="text-left px-4 py-3 font-medium">角色</th>
              <th className="text-left px-4 py-3 font-medium">注册时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无客户。</td></tr>
            )}
            {items.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{u.company || '—'}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600">{u.role}</span></td>
                <td className="px-4 py-3 text-gray-600">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}