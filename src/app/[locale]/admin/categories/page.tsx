'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Category {
  id: number; name: string; slug: string; description: string | null;
}

export default function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/categories')
      .then(r => r.json()).then(d => { if (d.success) setItems(d.data ?? []); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Add Category</Button>
      </div>
      <Card className="border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr><th className="px-4 py-3 font-medium text-gray-600">Name</th><th className="px-4 py-3 font-medium text-gray-600">Slug</th><th className="px-4 py-3 font-medium text-gray-600">Description</th><th className="px-4 py-3 font-medium text-gray-600">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No categories found.</td></tr>
              ) : items.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{c.description || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4" /></Button>
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