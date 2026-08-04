'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Calendar, User } from 'lucide-react';
import { AdminPageHeader, AdminCard, AdminLoadingSkeleton } from '@/components/admin/admin-card';
import { AdminTable, AdminBadge, AdminSearchBar } from '@/components/admin/admin-table';
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

  if (loading) return <AdminLoadingSkeleton rows={5} />;

  return (
    <div>
      <AdminPageHeader title="新闻管理" description="管理行业资讯与公司动态" actions={<Button onClick={openAdd} className="bg-blue-500 hover:bg-blue-600"><Plus className="w-4 h-4 mr-2" />新增新闻</Button>} />
      <AdminCard padding={false}>
        <div className="p-4 border-b border-slate-100"><AdminSearchBar value={search} onChange={setSearch} placeholder="搜索新闻标题..." className="max-w-xs" /></div>
        <AdminTable columns={columns} data={filtered} keyField="id" emptyText="暂无新闻" />
      </AdminCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg" />
          <DialogHeader className="pt-2">
            <DialogTitle>{editing ? '编辑新闻' : '新增新闻'}</DialogTitle>
            <DialogDescription>{editing ? '修改新闻信息' : '填写新新闻信息'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-xs font-medium text-slate-700">标题 *</label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="新闻标题" /></div>
              <div className="space-y-2"><label className="text-xs font-medium text-slate-700">Slug</label><Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="自动生成" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-xs font-medium text-slate-700">分类</label><Input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} placeholder="行业动态" /></div>
              <div className="space-y-2"><label className="text-xs font-medium text-slate-700">作者</label><Input value={form.author} onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))} placeholder="作者名" /></div>
            </div>
            <div className="space-y-2"><label className="text-xs font-medium text-slate-700">摘要</label><Textarea value={form.summary} onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="新闻摘要" rows={2} /></div>
            <div className="space-y-2"><label className="text-xs font-medium text-slate-700">内容 (Markdown)</label><Textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} placeholder="新闻内容..." rows={8} /></div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm(f => ({ ...f, is_published: e.target.checked }))} className="rounded border-slate-300" />
              发布
            </label>
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
            <AlertDialogDescription>确定要删除新闻「<span className="font-medium text-slate-900">{deleting?.title}</span>」吗？</AlertDialogDescription>
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