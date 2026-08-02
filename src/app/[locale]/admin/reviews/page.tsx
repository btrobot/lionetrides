'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Review {
  id: number; customer_name: string; rating: number; content: string | null; status: string; created_at: string;
}

export default function AdminReviews() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/v1/reviews?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setItems(d.data ?? d.items ?? []); })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
      </div>
      <Card className="border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr><th className="px-4 py-3 font-medium text-gray-600">Customer</th><th className="px-4 py-3 font-medium text-gray-600">Rating</th><th className="px-4 py-3 font-medium text-gray-600">Content</th><th className="px-4 py-3 font-medium text-gray-600">Status</th><th className="px-4 py-3 font-medium text-gray-600">Date</th><th className="px-4 py-3 font-medium text-gray-600">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No reviews found.</td></tr>
              ) : items.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.customer_name}</td>
                  <td className="px-4 py-3">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{r.content || '-'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-1 rounded ${r.status === 'approved' ? 'bg-green-50 text-green-700' : r.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="text-green-500"><CheckCircle className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500"><XCircle className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
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