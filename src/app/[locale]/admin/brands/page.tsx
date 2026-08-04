'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AdminPageHeader, AdminCard, AdminLoadingSkeleton } from '@/components/admin/admin-card';
import { AdminTable, AdminSearchBar } from '@/components/admin/admin-table';
import type { Column } from '@/components/admin/admin-table';

interface Brand { id: number; name: string; slug: string; description: string | null; website: string | null; }
interface BrandForm { name: string; slug: string; description: string; website: string; }
const emptyForm: BrandForm = { name: '', slug: '', description: '', website: '' };

export default function AdminBrands() {
  const { authFetch } = useAdminAuth();
  const [items, setItems] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    const res = await authFetch('/api/v1/brands');
    const d = await res?.json();
    setItems(d?.data ?? []);
    setLoading(false);
  }, [authFetch]);
  useEffect(() => { loadData(); }, [loadData]);

  const filtered = items.filter((b) => !search || b.name.toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditing(null); setForm(emptyForm); setDialogOpen(true); }
  function openEdit(brand: Brand) { setEditing(brand); setForm({ name: brand.name, slug: brand.slug, description: brand.description ?? '', website: brand.website ?? '' }); setDialogOpen(true); }
  function confirmDelete(brand: Brand) { setDeleting(brand); setDeleteOpen(true); }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('请输入品牌名称'); return; }
    setSaving(true);
    try {
      const body = { name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim(), website: form.website.trim() };
      if (editing) {
        const res = await authFetch(`/api/v1/brands/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '保存失败'); }
        toast.success('品牌已更新');
      } else {
        const res = await authFetch('/api/v1/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '创建失败'); }
        toast.success('品牌已创建');
      }
      setDialogOpen(false); loadData();
    } catch (err) { toast.error(err instanceof Error ? err.message : '操作失败'); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/brands/${deleting.id}`, { method: 'DELETE' });
      if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '删除失败'); }
      toast.success('品牌已删除'); setDeleteOpen(false); setDeleting(null); loadData();
    } catch (err) { toast.error(err instanceof Error ? err.message : '删除失败'); } finally { setSaving(false); }
  }

  const columns: Column<Brand>[] = [
    { key: 'name', header: '品牌名称', render: (b) => <span className="font-medium text-slate-900">{b.name}</span> },
    { key: 'slug', header: 'Slug', render: (b) => <span className="text-slate-500 font-mono text-xs">{b.slug}</span> },
    { key: 'website', header: '官网', render: (b) => b.website ? <span className="text-blue-600 text-xs">{b.website}</span> : <span className="text-slate-400">—</span> },
    {
      key: 'actions', header: '操作', className: 'text-center',
      render: (b) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => openEdit(b)} className="p-1.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => confirmDelete(b)} className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  if (loading) return <AdminLoadingSkeleton rows={5} />;

  return (
    <div>
      <AdminPageHeader title="品牌管理" description="管理合作品牌与制造商信息" actions={<Button onClick={openAdd} className="bg-blue-500 hover:bg-blue-600"><Plus className="w-4 h-4 mr-2" />新增品牌</Button>} />
      <AdminCard padding={false}>
        <div className="p-4 border-b border-slate-100"><AdminSearchBar value={search} onChange={setSearch} placeholder="搜索品牌..." className="max-w-xs" /></div>
        <AdminTable columns={columns} data={filtered} keyField="id" emptyText="暂无品牌" />
      </AdminCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg" />
          <DialogHeader className="pt-2">
            <DialogTitle>{editing ? '编辑品牌' : '新增品牌'}</DialogTitle>
            <DialogDescription>{editing ? '修改品牌信息' : '填写新品牌信息'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label className="text-xs font-medium text-slate-700">品牌名称 *</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="品牌名称" /></div>
            <div className="space-y-2"><Label className="text-xs font-medium text-slate-700">Slug *</Label><Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="brand-slug" /></div>
            <div className="space-y-2"><Label className="text-xs font-medium text-slate-700">描述</Label><Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="品牌描述" rows={3} /></div>
            <div className="space-y-2"><Label className="text-xs font-medium text-slate-700">官网</Label><Input value={form.website} onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://example.com" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-500 hover:bg-blue-600">{saving ? '保存中...' : editing ? '保存修改' : '创建'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-t-lg" />
          <AlertDialogHeader className="pt-2">
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除品牌「<span className="font-medium text-slate-900">{deleting?.name}</span>」吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleting(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}