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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
}

interface BrandForm {
  name: string;
  slug: string;
  description: string;
  website: string;
}

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

  const loadData = useCallback(async () => {
    const res = await authFetch('/api/v1/brands');
    const d = await res?.json();
    setItems(d?.data ?? []);
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(brand: Brand) {
    setEditing(brand);
    setForm({ name: brand.name, slug: brand.slug, description: brand.description ?? '', website: brand.website ?? '' });
    setDialogOpen(true);
  }

  function confirmDelete(brand: Brand) {
    setDeleting(brand);
    setDeleteOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('请输入品牌名称'); return; }
    if (!form.slug.trim()) { toast.error('请输入标识'); return; }
    setSaving(true);
    try {
      const body = { name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim(), website: form.website.trim() };
      if (editing) {
        const res = await authFetch(`/api/v1/brands/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '保存失败'); }
        toast.success('品牌已更新');
      } else {
        const res = await authFetch('/api/v1/brands', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '创建失败'); }
        toast.success('品牌已创建');
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/brands/${deleting.id}`, { method: 'DELETE' });
      if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '删除失败'); }
      toast.success('品牌已删除');
      setDeleteOpen(false);
      setDeleting(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">加载中...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">品牌管理</h1>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />新增品牌</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">名称</th>
              <th className="text-left px-4 py-3 font-medium">标识</th>
              <th className="text-left px-4 py-3 font-medium">网站</th>
              <th className="text-center px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无品牌。</td></tr>
            )}
            {items.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                <td className="px-4 py-3 text-gray-600">{b.slug}</td>
                <td className="px-4 py-3 text-gray-600">{b.website || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="编辑"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => confirmDelete(b)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑品牌' : '新增品牌'}</DialogTitle>
            <DialogDescription>{editing ? '修改品牌信息' : '填写新品牌信息'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>品牌名称 *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="品牌名称" />
            </div>
            <div className="space-y-2">
              <Label>标识 (slug) *</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="brand-slug" />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="品牌描述" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>官网</Label>
              <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://example.com" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? '保存修改' : '创建'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除品牌「{deleting?.name}」吗？此操作不可撤销。</AlertDialogDescription>
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