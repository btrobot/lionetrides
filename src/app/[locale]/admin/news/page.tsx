'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Calendar, User } from 'lucide-react';
import { AdminPageHeader, AdminCard, AdminLoadingSkeleton } from '@/components/admin/admin-card';
import { AdminTable, AdminBadge, AdminSearchBar } from '@/components/admin/admin-table';
import { AdminForm, type FormField } from '@/components/admin/admin-form';
import { AdminDialog } from '@/components/admin/admin-dialog';
import { useToast } from '@/components/admin/toast';
import type { Column } from '@/components/admin/admin-table';

interface NewsItem {
  id: number; title: string; slug: string; summary: string | null;
  content: string | null; cover_image: string | null; category: string | null;
  author: string | null; is_published: boolean; published_at: string | null;
  created_at: string;
}

interface NewsForm {
  title: string; slug: string; summary: string; content: string;
  category: string; author: string; is_published: boolean;
}

const emptyForm: NewsForm = { title: '', slug: '', summary: '', content: '', category: '', author: '', is_published: false };

export default function AdminNews() {
  const { authFetch } = useAdminAuth();
  const { toast, ToastContainer } = useToast();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [deleting, setDeleting] = useState<NewsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NewsForm>(emptyForm);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    const res = await authFetch('/api/v1/news?limit=50');
    const d = await res?.json();
    setItems(d?.data?.items ?? []);
    setLoading(false);
  }, [authFetch]);
  useEffect(() => { loadData(); }, [loadData]);

  const filtered = items.filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditing(null); setForm(emptyForm); setDialogOpen(true); }
  function openEdit(item: NewsItem) {
    setEditing(item);
    setForm({ title: item.title, slug: item.slug, summary: item.summary ?? '', content: item.content ?? '', category: item.category ?? '', author: item.author ?? '', is_published: item.is_published });
    setDialogOpen(true);
  }
  function confirmDelete(item: NewsItem) { setDeleting(item); setDeleteOpen(true); }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('请输入新闻标题'); return; }
    setSaving(true);
    try {
      const body = { ...form, slug: form.slug.trim() || form.title.trim().toLowerCase().replace(/\s+/g, '-') };
      if (editing) {
        const res = await authFetch(`/api/v1/news/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '保存失败'); }
        toast.success('新闻已更新');
      } else {
        const res = await authFetch('/api/v1/news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '创建失败'); }
        toast.success('新闻已创建');
      }
      setDialogOpen(false); loadData();
    } catch (err) { toast.error(err instanceof Error ? err.message : '操作失败'); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/news/${deleting.id}`, { method: 'DELETE' });
      if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '删除失败'); }
      toast.success('新闻已删除'); setDeleteOpen(false); setDeleting(null); loadData();
    } catch (err) { toast.error(err instanceof Error ? err.message : '删除失败'); } finally { setSaving(false); }
  }

  const columns: Column<NewsItem>[] = [
    { key: 'title', header: '标题', render: (n) => <span className="font-medium text-slate-900">{n.title}</span> },
    { key: 'category', header: '分类', render: (n) => <span className="text-slate-500 text-xs">{n.category || '—'}</span> },
    { key: 'author', header: '作者', render: (n) => <span className="text-slate-500 text-xs flex items-center gap-1"><User className="w-3 h-3" />{n.author || '—'}</span> },
    { key: 'published', header: '状态', render: (n) => <AdminBadge status={n.is_published ? 'published' : 'draft'} label={n.is_published ? '已发布' : '草稿'} />, className: 'text-center' },
    { key: 'date', header: '日期', render: (n) => <span className="text-slate-500 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(n.created_at).toLocaleDateString('zh-CN')}</span> },
    {
      key: 'actions', header: '操作', className: 'text-center',
      render: (n) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => openEdit(n)} className="p-1.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => confirmDelete(n)} className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const formFields: FormField[] = [
    { name: 'title', label: '标题', type: 'text', required: true, placeholder: '新闻标题' },
    { name: 'slug', label: 'Slug', type: 'text', placeholder: '自动生成' },
    { name: 'category', label: '分类', type: 'text', placeholder: '行业动态' },
    { name: 'author', label: '作者', type: 'text', placeholder: '作者名' },
    { name: 'summary', label: '摘要', type: 'textarea', rows: 2, placeholder: '新闻摘要' },
    { name: 'content', label: '内容 (Markdown)', type: 'textarea', rows: 8, placeholder: '新闻内容...' },
    { name: 'is_published', label: '发布', type: 'checkbox' },
  ];

  if (loading) return <AdminLoadingSkeleton rows={5} />;

  return (
    <div>
      <ToastContainer />
      <AdminPageHeader title="新闻管理" description="管理行业资讯与公司动态" actions={<Button onClick={openAdd} className="bg-blue-500 hover:bg-blue-600"><Plus className="w-4 h-4 mr-2" />新增新闻</Button>} />
      <AdminCard padding={false}>
        <div className="p-4 border-b border-slate-100"><AdminSearchBar value={search} onChange={setSearch} placeholder="搜索新闻标题..." className="max-w-xs" /></div>
        <AdminTable columns={columns} data={filtered} keyField="id" emptyText="暂无新闻" />
      </AdminCard>

      <AdminDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? '编辑新闻' : '新增新闻'}
        description={editing ? '修改新闻信息' : '填写新新闻信息'}
        onConfirm={handleSave}
        confirmLabel={saving ? '保存中...' : editing ? '保存修改' : '创建'}
        confirmDisabled={saving}
      >
        <AdminForm
          fields={formFields}
          values={form}
          onChange={setForm}
        />
      </AdminDialog>

      <AdminDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleting(null); }}
        title="确认删除"
        description={`确定要删除新闻「${deleting?.title}」吗？`}
        onConfirm={handleDelete}
        confirmLabel="删除"
        confirmVariant="danger"
      />
    </div>
  );
}
