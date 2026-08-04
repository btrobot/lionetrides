'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ChevronRight, History } from 'lucide-react';
import { AdminPageHeader, AdminCard, AdminLoadingSkeleton } from '@/components/admin/admin-card';
import { AdminTable, AdminBadge, AdminSearchBar, AdminFilterTabs, AdminPagination } from '@/components/admin/admin-table';
import type { Column } from '@/components/admin/admin-table';

interface Inquiry {
  id: number; name: string; email: string; phone: string | null;
  company: string | null; product_name: string | null; quantity: number | null;
  message: string; status: 'pending' | 'processing' | 'replied' | 'closed';
  admin_notes: string | null; created_at: string; updated_at: string;
}

const statusTabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'replied', label: '已回复' },
  { value: 'closed', label: '已关闭' },
];

export default function AdminInquiries() {
  const { authFetch } = useAdminAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [history, setHistory] = useState<Array<{ id: number; previous_status: string | null; new_status: string; note: string | null; created_at: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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
    } catch (e) { console.error('Failed to load inquiries:', e);
    } finally { setLoading(false); }
  }, [authFetch, page]);
  useEffect(() => { loadData(); }, [loadData]);

  const loadHistory = async (id: number) => {
    setHistoryLoading(true);
    try {
      const res = await authFetch(`/api/v1/inquiries/${id}/history`);
      const d = await res?.json();
      setHistory(d?.data ?? []);
    } finally { setHistoryLoading(false); }
  };

  const openDetail = (inq: Inquiry) => {
    setSelected(inq);
    setDetailOpen(true);
    loadHistory(inq.id);
  };

  const updateStatus = async (id: number, status: string) => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/inquiries/${id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: replyText || null }),
      });
      if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '更新失败'); }
      toast.success('状态已更新');
      setReplyOpen(false); setReplyText('');
      loadData();
      if (selected?.id === id) loadHistory(id);
    } catch (err) { toast.error(err instanceof Error ? err.message : '更新失败');
    } finally { setSaving(false); }
  };

  const filtered = inquiries.filter((i) => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q) || (i.company?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  const columns: Column<Inquiry>[] = [
    { key: 'name', header: '联系人', render: (i) => <span className="font-medium text-slate-900">{i.name}</span> },
    { key: 'company', header: '公司', render: (i) => <span className="text-slate-500 text-xs">{i.company || '—'}</span> },
    { key: 'product', header: '产品', render: (i) => <span className="text-slate-600 text-xs">{i.product_name || '—'}</span> },
    { key: 'status', header: '状态', render: (i) => <AdminBadge status={i.status} />, className: 'text-center' },
    { key: 'date', header: '时间', render: (i) => <span className="text-slate-500 text-xs">{new Date(i.created_at).toLocaleDateString('zh-CN')}</span> },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (i) => (
        <button onClick={() => openDetail(i)} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1 ml-auto">
          详情 <ChevronRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  if (loading && page === 1) return <AdminLoadingSkeleton rows={8} />;

  return (
    <div>
      <AdminPageHeader title="询盘管理" description="查看并处理客户询盘" />

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <AdminSearchBar value={search} onChange={setSearch} placeholder="搜索联系人/邮箱/公司..." className="max-w-xs" />
        <AdminFilterTabs tabs={statusTabs} active={statusFilter} onChange={setStatusFilter} />
      </div>

      <AdminCard padding={false}>
        <AdminTable
          columns={columns}
          data={filtered}
          keyField="id"
          emptyText="暂无询盘"
          loading={loading}
        />
      </AdminCard>

      <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />

      {/* 详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg" />
          <DialogHeader className="pt-2">
            <DialogTitle>询盘详情</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500 text-xs">联系人</span><p className="font-medium text-slate-900">{selected.name}</p></div>
                <div><span className="text-slate-500 text-xs">邮箱</span><p className="text-slate-700">{selected.email}</p></div>
                <div><span className="text-slate-500 text-xs">电话</span><p className="text-slate-700">{selected.phone || '—'}</p></div>
                <div><span className="text-slate-500 text-xs">公司</span><p className="text-slate-700">{selected.company || '—'}</p></div>
                <div><span className="text-slate-500 text-xs">产品</span><p className="text-slate-700">{selected.product_name || '—'}</p></div>
                <div><span className="text-slate-500 text-xs">数量</span><p className="text-slate-700">{selected.quantity ?? '—'}</p></div>
              </div>
              <div><span className="text-slate-500 text-xs">留言</span><p className="text-sm text-slate-700 mt-1 bg-slate-50 rounded-xl p-3">{selected.message}</p></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">状态</span>
                <AdminBadge status={selected.status} />
                <span className="text-xs text-slate-400 ml-auto">{new Date(selected.created_at).toLocaleString('zh-CN')}</span>
              </div>

              {/* 状态流转 */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">状态历史</span>
                </div>
                {historyLoading ? (
                  <div className="text-xs text-slate-400">加载中...</div>
                ) : history.length === 0 ? (
                  <div className="text-xs text-slate-400">暂无历史记录</div>
                ) : (
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div key={h.id} className="flex items-start gap-2 text-xs">
                        <div className="w-2 h-2 mt-1 rounded-full bg-blue-400 shrink-0" />
                        <div>
                          <span className="font-medium text-slate-700">
                            {h.previous_status ? <><AdminBadge status={h.previous_status} /> <span className="text-slate-400 mx-1">→</span></> : ''}
                            <AdminBadge status={h.new_status} />
                          </span>
                          {h.note && <p className="text-slate-500 mt-0.5">{h.note}</p>}
                          <p className="text-slate-400 mt-0.5">{new Date(h.created_at).toLocaleString('zh-CN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              {selected.status !== 'closed' && (
                <div className="flex gap-2 pt-2">
                  {selected.status === 'pending' && (
                    <Button size="sm" onClick={() => updateStatus(selected.id, 'processing')} className="bg-blue-500 hover:bg-blue-600">开始处理</Button>
                  )}
                  {selected.status === 'processing' && (
                    <Button size="sm" onClick={() => { setReplyOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700">标记已回复</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => updateStatus(selected.id, 'closed')} className="text-slate-600">关闭</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 回复/备注 Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="max-w-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-t-lg" />
          <DialogHeader className="pt-2">
            <DialogTitle>回复备注</DialogTitle>
            <DialogDescription>添加回复备注信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700">备注内容</Label>
            <textarea
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[120px]"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="请输入回复内容或备注..."
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setReplyOpen(false)}>取消</Button>
            <Button onClick={() => selected && updateStatus(selected.id, 'replied')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? '保存中...' : '确认回复'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}