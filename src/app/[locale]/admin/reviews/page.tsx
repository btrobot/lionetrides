'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Star, Trash2, CheckCircle2, EyeOff, Eye, MessageSquare, RefreshCw, AlertTriangle } from 'lucide-react';

interface Review {
  id: number;
  customer_name: string;
  customer_email: string;
  product_name: string | null;
  rating: number;
  content: string;
  status: 'pending' | 'approved' | 'hidden';
  created_at: string;
  updated_at: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'outline' | 'secondary' | 'default' | 'destructive' }> = {
  pending: { label: '待审核', variant: 'outline' },
  approved: { label: '已审核', variant: 'default' },
  hidden: { label: '已隐藏', variant: 'destructive' },
};

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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/v1/reviews');
      if (!res) return;
      const d = await res.json();
      const items = d.data?.items ?? d.data ?? d.items ?? [];
      setReviews(items);
    } catch (e) {
      console.error('Failed to load reviews:', e);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  const approveReview = async (id: number) => {
    setSaving(true);
    try {
      await authFetch(`/api/v1/reviews/${id}/approve`, { method: 'PUT' });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    } catch (e) {
      console.error('Failed to approve review:', e);
    } finally {
      setSaving(false);
    }
  };

  const hideReview = async (id: number) => {
    setSaving(true);
    try {
      await authFetch(`/api/v1/reviews/${id}/hide`, { method: 'PUT' });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'hidden' } : r));
    } catch (e) {
      console.error('Failed to hide review:', e);
    } finally {
      setSaving(false);
    }
  };

  const deleteReview = async (id: number) => {
    setSaving(true);
    try {
      await authFetch(`/api/v1/reviews/${id}`, { method: 'DELETE' });
      setReviews(prev => prev.filter(r => r.id !== id));
      setDeleteConfirm(null);
    } catch (e) {
      console.error('Failed to delete review:', e);
    } finally {
      setSaving(false);
    }
  };

  const filtered = reviews.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch = !q || r.customer_name.toLowerCase().includes(q) || r.customer_email.toLowerCase().includes(q) || (r.product_name?.toLowerCase().includes(q) ?? false) || r.content.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">评价管理</h1>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-1" /> 刷新
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="搜索客户姓名、产品、评价内容..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已审核</option>
          <option value="hidden">已隐藏</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无评价</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-sm font-medium text-muted-foreground">
                <th className="py-3 px-4">客户</th>
                <th className="py-3 px-4 hidden md:table-cell">产品</th>
                <th className="py-3 px-4">评分</th>
                <th className="py-3 px-4 hidden lg:table-cell">评价</th>
                <th className="py-3 px-4">状态</th>
                <th className="py-3 px-4 hidden sm:table-cell">时间</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(review => (
                <tr key={review.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium">{review.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{review.customer_email}</div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-sm">{review.product_name || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <p className="text-sm truncate max-w-[200px]">{review.content}</p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={STATUS_MAP[review.status]?.variant || 'outline'}>
                      {STATUS_MAP[review.status]?.label || review.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(review); setDetailOpen(true); }}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      {review.status === 'pending' && (
                        <Button variant="ghost" size="sm" onClick={() => approveReview(review.id)} disabled={saving}>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                      {review.status === 'approved' && (
                        <Button variant="ghost" size="sm" onClick={() => hideReview(review.id)} disabled={saving}>
                          <EyeOff className="h-4 w-4 text-orange-500" />
                        </Button>
                      )}
                      {review.status === 'hidden' && (
                        <Button variant="ghost" size="sm" onClick={() => approveReview(review.id)} disabled={saving}>
                          <Eye className="h-4 w-4 text-blue-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(review)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>评价详情</DialogTitle>
            <DialogDescription>{selected?.customer_name} 的评价</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">客户姓名</label>
                  <p className="font-medium">{selected.customer_name}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">邮箱</label>
                  <p className="font-medium">{selected.customer_email}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">产品</label>
                  <p className="font-medium">{selected.product_name || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">评分</label>
                  <div className="flex items-center gap-0.5 mt-0.5">{renderStars(selected.rating)}</div>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">评价内容</label>
                <p className="mt-1 p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">{selected.content}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <Badge variant={STATUS_MAP[selected.status]?.variant || 'outline'}>
                  {STATUS_MAP[selected.status]?.label || selected.status}
                </Badge>
                <div className="flex gap-2">
                  {selected.status === 'pending' && (
                    <Button size="sm" onClick={() => { approveReview(selected.id); setDetailOpen(false); }} disabled={saving}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> 审核通过
                    </Button>
                  )}
                  {selected.status === 'approved' && (
                    <Button size="sm" variant="outline" onClick={() => { hideReview(selected.id); setDetailOpen(false); }} disabled={saving}>
                      <EyeOff className="h-4 w-4 mr-1" /> 隐藏
                    </Button>
                  )}
                  {selected.status === 'hidden' && (
                    <Button size="sm" variant="outline" onClick={() => { approveReview(selected.id); setDetailOpen(false); }} disabled={saving}>
                      <Eye className="h-4 w-4 mr-1" /> 恢复显示
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)}>关闭</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> 确认删除评价
            </AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 {deleteConfirm?.customer_name} 的评价吗？该操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirm && deleteReview(deleteConfirm.id)}
              disabled={saving}
            >
              {saving ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}