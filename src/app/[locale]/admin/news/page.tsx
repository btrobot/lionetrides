'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, RefreshCw, Edit3, Trash2, Eye, EyeOff, AlertTriangle, Calendar, User, FileText } from 'lucide-react';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  cover_image: string | null;
  category: string | null;
  author: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

const CATEGORIES = [
  { value: 'company', label: '公司新闻' },
  { value: 'industry', label: '行业动态' },
  { value: 'technology', label: '技术前沿' },
];

const defaultForm = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  cover_image: '',
  category: 'company',
  author: '',
  is_published: false,
};

export default function AdminNews() {
  const { authFetch } = useAdminAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<NewsItem | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (search) params.set('search', search);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const res = await authFetch(`/api/v1/news?${params}`);
      if (!res) return;
      const d = await res.json();
      setItems(d.data?.items ?? d.data ?? []);
    } catch (e) {
      console.error('Failed to load news:', e);
    } finally {
      setLoading(false);
    }
  }, [authFetch, search, categoryFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...defaultForm, slug: `news-${Date.now()}` });
    setDialogOpen(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      slug: item.slug,
      summary: item.summary || '',
      content: item.content || '',
      cover_image: item.cover_image || '',
      category: item.category || 'company',
      author: item.author || '',
      is_published: item.is_published,
    });
    setDialogOpen(true);
  };

  const saveItem = async () => {
    if (!form.title.trim() || !form.slug.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const res = await authFetch(`/api/v1/news/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res) return;
        await res.json();
      } else {
        const res = await authFetch('/api/v1/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res) return;
        await res.json();
      }
      setDialogOpen(false);
      loadData();
    } catch (e) {
      console.error('Failed to save news:', e);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      await authFetch(`/api/v1/news/${deleteConfirm.id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (e) {
      console.error('Failed to delete news:', e);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: NewsItem) => {
    try {
      const res = await authFetch(`/api/v1/news/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !item.is_published }),
      });
      if (!res) return;
      const d = await res.json();
      if (d.success) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_published: !item.is_published } : i));
      }
    } catch (e) {
      console.error('Failed to toggle publish:', e);
    }
  };

  const generateSlug = (title: string) => {
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100);
    setForm(p => ({ ...p, slug }));
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">新闻管理</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1" /> 刷新
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> 新建新闻
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="搜索新闻标题..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">全部分类</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无新闻</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>创建第一篇新闻</Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-sm font-medium text-muted-foreground">
                <th className="py-3 px-4">标题</th>
                <th className="py-3 px-4 hidden md:table-cell">分类</th>
                <th className="py-3 px-4 hidden lg:table-cell">作者</th>
                <th className="py-3 px-4">状态</th>
                <th className="py-3 px-4 hidden sm:table-cell">时间</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[300px]">{item.slug}</div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <Badge variant="outline">{CATEGORIES.find(c => c.value === item.category)?.label || item.category}</Badge>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><User className="h-3 w-3" /> {item.author || '-'}</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={item.is_published ? 'default' : 'secondary'}>
                      {item.is_published ? '已发布' : '草稿'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(item.created_at).toLocaleDateString('zh-CN')}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => togglePublish(item)}>
                        {item.is_published ? <EyeOff className="h-4 w-4 text-orange-500" /> : <Eye className="h-4 w-4 text-green-500" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(item)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑新闻' : '新建新闻'}</DialogTitle>
            <DialogDescription>{editing ? `ID: ${editing.id}` : '创建一篇新新闻文章'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">标题 *</label>
                <Input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); generateSlug(e.target.value); }} placeholder="新闻标题" />
              </div>
              <div>
                <label className="text-sm font-medium">Slug *</label>
                <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="news-slug" />
              </div>
              <div>
                <label className="text-sm font-medium">分类</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">摘要</label>
                <Textarea value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} rows={2} placeholder="文章摘要..." />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">内容</label>
                <Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={8} placeholder="文章内容..." />
              </div>
              <div>
                <label className="text-sm font-medium">封面图片 URL</label>
                <Input value={form.cover_image} onChange={e => setForm(p => ({ ...p, cover_image: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium">作者</label>
                <Input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} placeholder="作者名" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={form.is_published}
                  onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="is_published" className="text-sm">发布</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={saveItem} disabled={saving || !form.title.trim() || !form.slug.trim()}>
                {saving ? '保存中...' : (editing ? '保存修改' : '创建')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> 确认删除新闻
            </AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteConfirm?.title}」吗？该操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteItem} disabled={saving}>
              {saving ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}