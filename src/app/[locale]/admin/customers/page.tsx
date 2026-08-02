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
import { Search, RefreshCw, UserCheck, UserX, AlertTriangle, Edit3, Mail, Phone, Building2, Calendar } from 'lucide-react';

interface Customer {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminCustomers() {
  const { authFetch } = useAdminAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', company: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
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
    } catch (e) {
      console.error('Failed to load customers:', e);
    } finally {
      setLoading(false);
    }
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res) return;
      const d = await res.json();
      if (d.success) {
        setCustomers(prev => prev.map(c => c.id === selected.id ? { ...c, ...d.data } : c));
        setEditOpen(false);
        toast.success('客户信息已更新');
      }
    } catch (e) {
      console.error('Failed to update customer:', e);
      toast.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (customer: Customer) => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !customer.isActive }),
      });
      if (!res) return;
      const d = await res.json();
      if (d.success) {
        setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, isActive: !customer.isActive } : c));
        toast.success(customer.isActive ? '客户已禁用' : '客户已启用');
      }
    } catch (e) {
      console.error('Failed to toggle customer status:', e);
      toast.error('状态切换失败');
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-2xl font-bold">客户管理</h1>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-1" /> 刷新
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="搜索客户姓名或邮箱..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无客户</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-sm font-medium text-muted-foreground">
                <th className="py-3 px-4">客户</th>
                <th className="py-3 px-4 hidden md:table-cell">联系方式</th>
                <th className="py-3 px-4">状态</th>
                <th className="py-3 px-4 hidden sm:table-cell">注册时间</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium">{customer.name || '未填写'}</div>
                    <div className="text-xs text-muted-foreground">{customer.email}</div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    {customer.phone && <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" /> {customer.phone}</div>}
                    {customer.company && <div className="flex items-center gap-1 text-sm text-muted-foreground"><Building2 className="h-3 w-3" /> {customer.company}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                      {customer.isActive ? '正常' : '禁用'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-sm text-muted-foreground">
                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(customer)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(customer)} disabled={saving}>
                        {customer.isActive ? <UserX className="h-4 w-4 text-orange-500" /> : <UserCheck className="h-4 w-4 text-green-500" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑客户信息</DialogTitle>
            <DialogDescription>{selected?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">姓名</label>
              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">电话</label>
              <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">公司</label>
              <Input value={editForm.company} onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
              <Button onClick={saveEdit} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}