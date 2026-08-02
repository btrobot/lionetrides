'use client';

import { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Inquiry {
  id: number; name: string; email: string; company: string | null; status: string;
  product_name: string | null; message: string | null; created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  quoted: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function AdminInquiries() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/v1/inquiries?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setItems(d.data ?? d.items ?? []); })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
      </div>
      <Card className="border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr><th className="px-4 py-3 font-medium text-gray-600">Name</th><th className="px-4 py-3 font-medium text-gray-600">Company</th><th className="px-4 py-3 font-medium text-gray-600">Product</th><th className="px-4 py-3 font-medium text-gray-600">Status</th><th className="px-4 py-3 font-medium text-gray-600">Date</th><th className="px-4 py-3 font-medium text-gray-600">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No inquiries found.</td></tr>
              ) : items.map((inq) => (
                <tr key={inq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{inq.name}</td>
                  <td className="px-4 py-3 text-gray-500">{inq.company || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{inq.product_name || '-'}</td>
                  <td className="px-4 py-3"><Badge className={statusColors[inq.status] || 'bg-gray-100'}>{inq.status}</Badge></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(inq.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-green-500"><CheckCircle className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500"><XCircle className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}