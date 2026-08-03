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
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { AdminPageHeader, AdminCard, AdminLoadingSkeleton } from '@/components/admin/admin-card';
import { AdminTable, AdminBadge, AdminSearchBar } from '@/components/admin/admin-table';
import type { Column } from '@/components/admin/admin-table';

interface Product {
  id: number;
  name: string;
  sku: string;
  category_id: number | null;
  brand_id: number | null;
  price: number;
  description: string | null;
  specifications: string | null;
  status: string;
  created_at: string;
}

interface Category { id: number; name: string }
interface Brand { id: number; name: string }

interface ProductForm {
  name: string;
  sku: string;
  category_id: string;
  brand_id: string;
  price: string;
  description: string;
  specifications: string;
  status: string;
}

const emptyForm: ProductForm = {
  name: '', sku: '', category_id: '', brand_id: '',
  price: '', description: '', specifications: '', status: 'active',
};

export default function AdminProducts() {
  const { authFetch } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    const [prodRes, catRes, brandRes] = await Promise.all([
      authFetch('/api/v1/products?limit=50'),
      fetch('/api/v1/categories'),
      fetch('/api/v1/brands'),
    ]);
    const [prodData, catData, brandData] = await Promise.all([
      prodRes?.json() ?? { items: [] },
      catRes.json(),
      brandRes.json(),
    ]);
    setProducts(prodData?.items ?? []);
    setCategories(catData?.data?.items ?? []);
    setBrands(brandData?.data ?? []);
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setEditing(null); setForm(emptyForm); setDialogOpen(true); }
  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name, sku: product.sku,
      category_id: product.category_id?.toString() ?? '',
      brand_id: product.brand_id?.toString() ?? '',
      price: product.price.toString(),
      description: product.description ?? '',
      specifications: product.specifications ?? '',
      status: product.status,
    });
    setDialogOpen(true);
  }
  function confirmDelete(product: Product) { setDeleting(product); setDeleteOpen(true); }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('请输入产品名称'); return; }
    if (!form.sku.trim()) { toast.error('请输入 SKU'); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(), sku: form.sku.trim(),
        category_id: form.category_id ? Number(form.category_id) : null,
        brand_id: form.brand_id ? Number(form.brand_id) : null,
        price: Number(form.price) || 0,
        description: form.description.trim(),
        specifications: form.specifications.trim(),
        status: form.status,
      };
      if (editing) {
        const res = await authFetch(`/api/v1/products/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '保存失败'); }
        toast.success('产品已更新');
      } else {
        const res = await authFetch('/api/v1/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '创建失败'); }
        toast.success('产品已创建');
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/products/${deleting.id}`, { method: 'DELETE' });
      if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '删除失败'); }
      toast.success('产品已删除');
      setDeleteOpen(false); setDeleting(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    } finally { setSaving(false); }
  }

  function updateForm(key: keyof ProductForm, value: string) { setForm((prev) => ({ ...prev, [key]: value })); }

  const columns: Column<Product>[] = [
    { key: 'name', header: '产品名称', render: (p) => <span className="font-medium text-slate-900">{p.name}</span> },
    { key: 'sku', header: 'SKU', render: (p) => <span className="text-slate-500 font-mono text-xs">{p.sku}</span> },
    { key: 'category', header: '分类', render: (p) => <span className="text-slate-600">{categories.find((c) => c.id === p.category_id)?.name ?? '—'}</span> },
    { key: 'price', header: '价格', render: (p) => <span className="text-slate-900 font-medium">¥{p.price}</span>, className: 'text-right' },
    { key: 'status', header: '状态', render: (p) => <AdminBadge status={p.status} label={p.status === 'active' ? '上架' : '下架'} />, className: 'text-center' },
    {
      key: 'actions', header: '操作', className: 'text-center',
      render: (p) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="编辑">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => confirmDelete(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="删除">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <AdminLoadingSkeleton rows={8} />;

  return (
    <div>
      <AdminPageHeader
        title="产品管理"
        description="管理产品目录、技术参数与上架状态"
        actions={
          <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20">
            <Plus className="w-4 h-4 mr-2" />新增产品
          </Button>
        }
      />

      <AdminCard padding={false}>
        <div className="p-4 border-b border-slate-100">
          <AdminSearchBar value={search} onChange={setSearch} placeholder="搜索产品名称或 SKU..." className="max-w-xs" />
        </div>
        <AdminTable
          columns={columns}
          data={filtered}
          keyField="id"
          emptyText="暂无产品，点击上方按钮新增"
        />
      </AdminCard>

      {/* 新增/编辑 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg" />
          <DialogHeader className="pt-2">
            <DialogTitle className="text-lg">{editing ? '编辑产品' : '新增产品'}</DialogTitle>
            <DialogDescription>{editing ? '修改产品信息' : '填写新产品信息'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">产品名称 *</Label>
                <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="产品名称" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">SKU *</Label>
                <Input value={form.sku} onChange={(e) => updateForm('sku', e.target.value)} placeholder="SKU" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">分类</Label>
                <select className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={form.category_id} onChange={(e) => updateForm('category_id', e.target.value)}>
                  <option value="">无</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">品牌</Label>
                <select className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={form.brand_id} onChange={(e) => updateForm('brand_id', e.target.value)}>
                  <option value="">无</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">价格</Label>
                <Input type="number" value={form.price} onChange={(e) => updateForm('price', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-700">状态</Label>
              <select className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                <option value="active">上架</option>
                <option value="inactive">下架</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-700">描述</Label>
              <Textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="产品描述" rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-700">规格参数 (JSON)</Label>
              <Textarea value={form.specifications} onChange={(e) => updateForm('specifications', e.target.value)} placeholder='{"高度": "30m", "速度": "90km/h"}' rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <span className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {editing ? '保存修改' : '创建'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-t-lg" />
          <AlertDialogHeader className="pt-2">
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除产品「<span className="font-medium text-slate-900">{deleting?.name}</span>」吗？此操作不可撤销。
            </AlertDialogDescription>
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