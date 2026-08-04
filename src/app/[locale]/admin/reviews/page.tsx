'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AdminPageHeader, AdminCard, AdminLoadingSkeleton } from '@/components/admin/admin-card';
import { AdminTable, AdminBadge, AdminSearchBar, AdminFilterTabs, AdminPagination } from '@/components/admin/admin-table';
import type { Column } from '@/components/admin/admin-table';
import { Star, Trash2, CheckCircle2, EyeOff, Eye, MessageSquare } from 'lucide-react';

interface Review {
  id: number; customer_name: string; customer_email: string;
  product_name: string | null; rating: number; content: string;
  status: 'pending' | 'approved' | 'hidden';
  created_at: string; updated_at: string;
}

const statusTabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已审核' },
  { value: 'hidden', label: '已隐藏' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { authFetch } = useAdminAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Review | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/v1/reviews?page=${page}&pageSize=${pageSize}`);
      if (!res) return;
      const d = await res.json();
      setReviews(d.data?.items ?? d.data ?? d.items ?? []);
      setTotal(d.data?.total ?? d.total ?? 0);
      setTotalPages(d.data?.totalPages ?? d.totalPages ?? 0);
    } catch (e) { console.error('Failed to load reviews:', e);
    } finally { setLoading(false); }
  }, [authFetch, page]);
  useEffect(() => { loadData(); }, [loadData]);

  const updateStatus = async (id: number, status: string) => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/reviews/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      if (!res?.ok) throw new Error('操作失败');
      toast.success('状态已更新');
      loadData();
    } catch (_e) { toast.error('操作失败');
    } finally { setSaving(false); }
  };

  const deleteReview = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/reviews/${deleteConfirm.id}`, { method: 'DELETE' });
      if (!res?.ok) throw new Error('删除失败');
      toast.success('评价已删除');
      setDeleteConfirm(null);
      loadData();
    } catch (_e) { toast.error('删除失败');
    } finally { setSaving(false); }
  };

  const filtered = reviews.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.customer_name.toLowerCase().includes(q) || r.content.toLowerCase().includes(q);
    }
    return true;
  });

  const columns: Column<Review>[] = [
    { key: 'customer', header: '客户', render: (r) => <span className="font-medium text-slate-900">{r.customer_name}</span> },
    { key: 'product', header: '产品', render: (r) => <span className="text-slate-500 text-xs">{r.product_name || '—'}</span> },
    { key: 'rating', header: '评分', render: (r) => <StarRating rating={r.rating} /> },
    { key: 'content', header: '内容', render: (r) => <span className="text-slate-600 text-xs truncate max-w-[200px] inline-block">{r.content}</span> },
    { key: 'status', header: '状态', render: (r) => <AdminBadge status={r.status} />, className: 'text-center' },
    { key: 'date', header: '时间', render: (r) => <span className="text-slate-500 text-xs">{new Date(r.created_at).toLocaleDateString('zh-CN')}</span> },
    {
      key: 'actions', header: '操作', className: 'text-center',
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          {r.status === 'pending' && (
            <button onClick={() => updateStatus(r.id, 'approved')} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors" title="通过"><CheckCircle2 className="w-3.5 h-3.5" /></button>
          )}
          {r.status === 'approved' && (
            <button onClick={() => updateStatus(r.id, 'hidden')} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="隐藏"><EyeOff className="w-3.5 h-3.5" /></button>
          )}
          {r.status === 'hidden' && (
            <button onClick={() => updateStatus(r.id, 'approved')} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="显示"><Eye className="w-3.5 h-3.5" /></button>
          )}
          <button onClick={() => { setSelected(r); setDetailOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" title="查看"><MessageSquare className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteConfirm(r)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  if (loading && page === 1) return <AdminLoadingSkeleton rows={8} />;

  return (
    <div>
      <AdminPageHeader title="评价管理" description="管理产品评价" />
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <AdminSearchBar value={search} onChange={setSearch} placeholder="搜索客户/评价内容..." className="max-w-xs" />
        <AdminFilterTabs tabs={statusTabs} active={statusFilter} onChange={setStatusFilter} />
      </div>
      <AdminCard padding={false}>
        <AdminTable columns={columns} data={filtered} keyField="id" emptyText="暂无评价" loading={loading} />
      </AdminCard>
      <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />

      {/* 详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg" />
          <DialogHeader className="pt-2">
            <DialogTitle>评价详情</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-slate-900">{selected.customer_name}</p><p className="text-xs text-slate-500">{selected.customer_email}</p></div>
                <StarRating rating={selected.rating} />
              </div>
              {selected.product_name && <p className="text-xs text-slate-500">产品: {selected.product_name}</p>}
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">{selected.content}</div>
              <div className="flex items-center gap-2">
                <AdminBadge status={selected.status} />
                <span className="text-xs text-slate-400 ml-auto">{new Date(selected.created_at).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>此操作不可撤销，确定要删除这条评价吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={deleteReview} disabled={saving} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}