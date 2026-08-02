'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';
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
import { Pagination } from '@/components/shared/pagination';
import { Search, Mail, Phone, Building2, Calendar, MoreHorizontal, CheckCircle2, XCircle, MessageSquare, RefreshCw } from 'lucide-react';

interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  product_name: string | null;
  quantity: number | null;
  message: string;
  status: 'pending' | 'processing' | 'replied' | 'closed';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'outline' | 'secondary' | 'default' | 'destructive' }> = {
  pending: { label: '待处理', variant: 'outline' },
  processing: { label: '处理中', variant: 'secondary' },
  replied: { label: '已回复', variant: 'default' },
  closed: { label: '已关闭', variant: 'destructive' },
};

export default function AdminInquiries() {
  const { authFetch } = useAdminAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/v1/inquiries?page=${page}&pageSize=${pageSize}`);
      if (!res) return;
      const d = await res.json();
      setInquiries(d.items ?? []);
      setTotal(d.total ?? 0);
      setTotalPages(d.totalPages ?? 0);
    } catch (e) {
      console.error('Failed to load inquiries:', e);
    } finally {
      setLoading(false);
    }
  }, [authFetch, page]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateStatus = async (id: number, status: string) => {
    setSaving(true);
    try {
      await authFetch(`/api/v1/inquiries/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: status as Inquiry['status'] } : i));
      setDetailOpen(false);
      toast.success('状态已更新');
    } catch (e) {
      console.error('Failed to update status:', e);
      toast.error('状态更新失败');
    } finally {
      setSaving(false);
    }
  };

  const submitReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSaving(true);
    try {
      await authFetch(`/api/v1/inquiries/${selected.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'replied', reply: replyText }),
      });
      setInquiries(prev => prev.map(i => i.id === selected.id ? { ...i, status: 'replied', admin_notes: replyText } : i));
      setReplyOpen(false);
      setReplyText('');
      setDetailOpen(false);
      toast.success('回复已发送');
    } catch (e) {
      console.error('Failed to reply:', e);
      toast.error('回复发送失败');
    } finally {
      setSaving(false);
    }
  };

  const filtered = inquiries.filter(i => {
    const q = search.toLowerCase();
    const matchesSearch = !q || i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || (i.company?.toLowerCase().includes(q) ?? false) || (i.message?.toLowerCase().includes(q) ?? false);
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <h1 className="text-2xl font-bold">询盘管理</h1>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-1" /> 刷新
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="搜索姓名、邮箱、公司、留言..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="replied">已回复</option>
          <option value="closed">已关闭</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无询盘</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-sm font-medium text-muted-foreground">
                <th className="py-3 px-4">客户</th>
                <th className="py-3 px-4 hidden md:table-cell">联系方式</th>
                <th className="py-3 px-4 hidden lg:table-cell">产品需求</th>
                <th className="py-3 px-4">状态</th>
                <th className="py-3 px-4 hidden sm:table-cell">时间</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(inquiry => (
                <tr key={inquiry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium">{inquiry.name}</div>
                    <div className="text-xs text-muted-foreground">{inquiry.company || '-'}</div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" /> {inquiry.email}</div>
                    {inquiry.phone && <div className="flex items-center gap-1 text-sm text-muted-foreground"><Phone className="h-3 w-3" /> {inquiry.phone}</div>}
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <div className="text-sm">{inquiry.product_name || '-'}</div>
                    {inquiry.quantity && <div className="text-xs text-muted-foreground">数量: {inquiry.quantity}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={STATUS_MAP[inquiry.status]?.variant || 'outline'}>
                      {STATUS_MAP[inquiry.status]?.label || inquiry.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-sm text-muted-foreground">
                    {new Date(inquiry.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setSelected(inquiry); setDetailOpen(true); }}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <Pagination page={page} pageSize={pageSize} total={total} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>询盘详情</DialogTitle>
            <DialogDescription>来自 {selected?.name} 的询盘</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">姓名</label>
                  <p className="font-medium">{selected.name}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">公司</label>
                  <p className="font-medium">{selected.company || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">邮箱</label>
                  <p className="font-medium">{selected.email}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">电话</label>
                  <p className="font-medium">{selected.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">产品需求</label>
                  <p className="font-medium">{selected.product_name || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">数量</label>
                  <p className="font-medium">{selected.quantity || '-'}</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">留言内容</label>
                <p className="mt-1 p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">{selected.message}</p>
              </div>
              {selected.admin_notes && (
                <div>
                  <label className="text-xs text-muted-foreground">回复内容</label>
                  <p className="mt-1 p-3 bg-blue-50 rounded-lg text-sm whitespace-pre-wrap">{selected.admin_notes}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">更新状态:</label>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={selected.status}
                    onChange={e => updateStatus(selected.id, e.target.value)}
                    disabled={saving}
                  >
                    <option value="pending">待处理</option>
                    <option value="processing">处理中</option>
                    <option value="replied">已回复</option>
                    <option value="closed">已关闭</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDetailOpen(false)}>关闭</Button>
                  {selected.status !== 'replied' && selected.status !== 'closed' && (
                    <Button onClick={() => { setReplyOpen(true); }}>
                      <MessageSquare className="h-4 w-4 mr-1" /> 回复
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>回复询盘</DialogTitle>
            <DialogDescription>回复给 {selected?.name}（{selected?.email}）</DialogDescription>
          </DialogHeader>
          <textarea
            className="min-h-[200px] w-full rounded-lg border border-input bg-background p-4 text-sm"
            placeholder="请输入回复内容..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setReplyOpen(false); setReplyText(''); }}>取消</Button>
            <Button onClick={submitReply} disabled={saving || !replyText.trim()}>
              {saving ? '发送中...' : '发送回复'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}