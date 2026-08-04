'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AdminPageHeader, AdminCard, AdminLoadingSkeleton } from '@/components/admin/admin-card';
import { AdminTable, AdminSearchBar } from '@/components/admin/admin-table';
import { AdminForm, type FormField } from '@/components/admin/admin-form';
import { AdminDialog } from '@/components/admin/admin-dialog';
import { useToast } from '@/components/admin/toast';
import type { Column } from '@/components/admin/admin-table';

interface Brand { id: number; name: string; slug: string; description: string | null; website: string | null; }
interface BrandForm { name: string; slug: string; description: string; website: string; }
const emptyForm: BrandForm = { name: '', slug: '', description: '', website: '' };

export default function AdminBrands() {
  const { authFetch } = useAdminAuth();
  const { toast, ToastContainer } = useToast();
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

  const formFields: FormField[] = [
    { name: 'name', label: '品牌名称', type: 'text', required: true, placeholder: '品牌名称' },
    { name: 'slug', label: 'Slug', type: 'text', placeholder: '自动生成' },
    { name: 'description', label: '描述', type: 'textarea', rows: 3, placeholder: '品牌描述' },
    { name: 'website', label: '官网', type: 'text', placeholder: 'https://...' },
  ];

  if (loading) return <AdminLoadingSkeleton rows={5} />;

  return (
    <div>
      <ToastContainer />
      <AdminPageHeader title="品牌管理" description="管理合作品牌与制造商信息" actions={<Button onClick={openAdd} className="bg-blue-500 hover:bg-blue-600"><Plus className="w-4 h-4 mr-2" />新增品牌</Button>} />
      <AdminCard padding={false}>
        <div className="p-4 border-b border-slate-100"><AdminSearchBar value={search} onChange={setSearch} placeholder="搜索品牌..." className="max-w-xs" /></div>
        <AdminTable columns={columns} data={filtered} keyField="id" emptyText="暂无品牌" />
      </AdminCard>

      <AdminDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? '编辑品牌' : '新增品牌'}
        description={editing ? '修改品牌信息' : '填写新品牌信息'}
        onConfirm={handleSave}
        confirmLabel={saving ? '保存中...' : editing ? '保存修改' : '创建'}
        confirmDisabled={saving}
      >
        <AdminForm fields={formFields} values={form} onChange={setForm} />
      </AdminDialog>

      <AdminDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleting(null); }}
        title="确认删除"
        description={`确定要删除品牌「${deleting?.name}」吗？`}
        onConfirm={handleDelete}
        confirmLabel="删除"
        confirmVariant="danger"
      />
    </div>
  );
}
