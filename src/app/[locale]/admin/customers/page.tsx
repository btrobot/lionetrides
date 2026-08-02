'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Customer {
  id: number; name: string; email: string; phone: string | null; company: string | null;
  role: string; created_at: string;
}

export default function AdminCustomers() {
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/v1/customers', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setItems(d.data ?? []); })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
      </div>
      <Card className="border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr><th className="px-4 py-3 font-medium text-gray-600">Name</th><th className="px-4 py-3 font-medium text-gray-600">Email</th><th className="px-4 py-3 font-medium text-gray-600">Phone</th><th className="px-4 py-3 font-medium text-gray-600">Company</th><th className="px-4 py-3 font-medium text-gray-600">Role</th><th className="px-4 py-3 font-medium text-gray-600">Joined</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No customers found.</td></tr>
              ) : items.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1 text-gray-500"><Mail className="h-3 w-3" /> {c.email}</span></td>
                  <td className="px-4 py-3">{c.phone ? <span className="flex items-center gap-1 text-gray-500"><Phone className="h-3 w-3" /> {c.phone}</span> : '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.company || '-'}</td>
                  <td className="px-4 py-3"><span className="capitalize text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-700">{c.role}</span></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}