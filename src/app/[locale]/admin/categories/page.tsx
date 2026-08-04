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

interface Category { id: number; name: string; slug: string; description: string | null; }
interface CategoryForm { name: string; slug: string; description: string; }
const emptyForm: CategoryForm = { name: '', slug: '', description: '' };

export default function AdminCategories() {
  const { authFetch } = useAdminAuth();
  const { toast, ToastContainer } = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    const res = await authFetch('/api/v1/categories');
    const d = await res?.json();
    setItems(d?.data?.items ?? []);
    setLoading(false);
  }, [authFetch]);
  useEffect(() => { loadData(); }, [loadData]);

  const filtered = items.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditing(null); setForm(emptyForm); setDialogOpen(true); }
  function openEdit(cat: Category) { setEditing(cat); setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? '' }); setDialogOpen(true); }
  function confirmDelete(cat: Category) { setDeleting(cat); setDeleteOpen(true); }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('请输入分类名称'); return; }
    setSaving(true);
    try {
      const body = { name: form.name.trim(), slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, '-'), description: form.description.trim() };
      if (editing) {
        const res = await authFetch(`/api/v1/categories/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '保存失败'); }
        toast.success('分类已更新');
      } else {
        const res = await authFetch('/api/v1/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '创建失败'); }
        toast.success('分类已创建');
      }
      setDialogOpen(false); loadData();
    } catch (err) { toast.error(err instanceof Error ? err.message : '操作失败'); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/categories/${deleting.id}`, { method: 'DELETE' });
      if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '删除失败'); }
      toast.success('分类已删除'); setDeleteOpen(false); setDeleting(null); loadData();
    } catch (err) { toast.error(err instanceof Error ? err.message : '删除失败'); } finally { setSaving(false); }
  }

  const columns: Column<Category>[] = [
    { key: 'name', header: '分类名称', render: (c) => <span className="font-medium text-slate-900">{c.name}</span> },
    { key: 'slug', header: 'Slug', render: (c) => <span className="text-slate-500 font-mono text-xs">{c.slug}</span> },
    { key: 'description', header: '描述', render: (c) => <span className="text-slate-500">{c.description || '—'}</span> },
    {
      key: 'actions', header: '操作', className: 'text-center',
      render: (c) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => openEdit(c)} className="p-1.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => confirmDelete(c)} className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const formFields: FormField[] = [
    { name: 'name', label: '分类名称', type: 'text', required: true, placeholder: '分类名称' },
    { name: 'slug', label: 'Slug', type: 'text', placeholder: '自动生成' },
    { name: 'description', label: '描述', type: 'textarea', rows: 3, placeholder: '分类描述' },
  ];

  if (loading) return <AdminLoadingSkeleton rows={5} />;

  return (
    <div>
      <ToastContainer />
      <AdminPageHeader title="分类管理" description="管理产品分类与层级结构" actions={<Button onClick={openAdd} className="bg-blue-500 hover:bg-blue-600"><Plus className="w-4 h-4 mr-2" />新增分类</Button>} />
      <AdminCard padding={false}>
        <div className="p-4 border-b border-slate-100"><AdminSearchBar value={search} onChange={setSearch} placeholder="搜索分类..." className="max-w-xs" /></div>
        <AdminTable columns={columns} data={filtered} keyField="id" emptyText="暂无分类" />
      </AdminCard>

      <AdminDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? '编辑分类' : '新增分类'}
        description={editing ? '修改分类信息' : '填写新分类信息'}
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
        description={`确定要删除分类「${deleting?.name}」吗？`}
        onConfirm={handleDelete}
        confirmLabel="删除"
        confirmVariant="danger"
      />
    </div>
  );
}
