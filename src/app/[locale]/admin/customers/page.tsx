'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AdminPageHeader, AdminCard, AdminLoadingSkeleton } from '@/components/admin/admin-card';
import { AdminTable, AdminBadge, AdminSearchBar } from '@/components/admin/admin-table';
import type { Column } from '@/components/admin/admin-table';

interface Customer {
  id: number; name: string | null; email: string; phone: string | null;
  company: string | null; role: string; isActive: boolean;
  createdAt: string; lastLoginAt: string | null;
}

export default function AdminCustomers() {
  const { authFetch } = useAdminAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', company: '' });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      const res = await authFetch(`/api/v1/customers?${params}`);
      if (!res) return;
      const d = await res.json();
      setCustomers(d.data?.items ?? []);
    } catch (e) { console.error('Failed to load customers:', e);
    } finally { setLoading(false); }
  }, [authFetch, search]);
  useEffect(() => { loadData(); }, [loadData]);

  const openEdit = (customer: Customer) => {
    setSelected(customer);
    setEditForm({ name: customer.name || '', phone: customer.phone || '', company: customer.company || '' });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/customers/${selected.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm),
      });
      if (!res) return;
      const d = await res.json();
      if (d.success) {
        setCustomers(prev => prev.map(c => c.id === selected.id ? { ...c, ...d.data } : c));
        setEditOpen(false);
        toast.success('客户信息已更新');
      }
    } catch (_e) { toast.error('更新失败');
    } finally { setSaving(false); }
  };

  const toggleActive = async (customer: Customer) => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/customers/${customer.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !customer.isActive }),
      });
      if (!res) return;
      const d = await res.json();
      if (d.success) {
        setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, isActive: !customer.isActive } : c));
        toast.success(customer.isActive ? '客户已禁用' : '客户已启用');
      }
    } catch (_e) { toast.error('状态切换失败');
    } finally { setSaving(false); }
  };

  const columns: Column<Customer>[] = [
    { key: 'name', header: '姓名', render: (c) => <span className="font-medium text-slate-900">{c.name || '—'}</span> },
    { key: 'email', header: '邮箱', render: (c) => <span className="text-slate-600 text-xs">{c.email}</span> },
    { key: 'company', header: '公司', render: (c) => <span className="text-slate-500 text-xs">{c.company || '—'}</span> },
    { key: 'status', header: '状态', render: (c) => <AdminBadge status={c.isActive ? 'active' : 'inactive'} label={c.isActive ? '活跃' : '禁用'} />, className: 'text-center' },
    { key: 'date', header: '注册时间', render: (c) => <span className="text-slate-500 text-xs">{new Date(c.createdAt).toLocaleDateString('zh-CN')}</span> },
    {
      key: 'actions', header: '操作', className: 'text-center',
      render: (c) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => openEdit(c)} className="p-1.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors text-xs">编辑</button>
          <button onClick={() => toggleActive(c)} className={`p-1.5 rounded-xl text-xs transition-colors ${c.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-600'}`}>
            {c.isActive ? '禁用' : '启用'}
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <AdminLoadingSkeleton rows={8} />;

  return (
    <div>
      <AdminPageHeader title="客户管理" description="管理注册客户信息" />
      <div className="mb-4"><AdminSearchBar value={search} onChange={setSearch} placeholder="搜索客户姓名/邮箱/公司..." className="max-w-xs" /></div>
      <AdminCard padding={false}>
        <AdminTable columns={columns} data={customers} keyField="id" emptyText="暂无客户" />
      </AdminCard>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg" />
          <DialogHeader className="pt-2">
            <DialogTitle>编辑客户信息</DialogTitle>
            <DialogDescription>修改客户基本资料</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label className="text-xs font-medium text-slate-700">姓名</Label><Input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label className="text-xs font-medium text-slate-700">电话</Label><Input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="space-y-2"><Label className="text-xs font-medium text-slate-700">公司</Label><Input value={editForm.company} onChange={(e) => setEditForm(f => ({ ...f, company: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={saveEdit} disabled={saving} className="bg-blue-500 hover:bg-blue-600">保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}