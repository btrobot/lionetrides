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

interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

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

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id?.toString() ?? '',
      brand_id: product.brand_id?.toString() ?? '',
      price: product.price.toString(),
      description: product.description ?? '',
      specifications: product.specifications ?? '',
      status: product.status,
    });
    setDialogOpen(true);
  }

  function confirmDelete(product: Product) {
    setDeleting(product);
    setDeleteOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('请输入产品名称'); return; }
    if (!form.sku.trim()) { toast.error('请输入 SKU'); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category_id: form.category_id ? Number(form.category_id) : null,
        brand_id: form.brand_id ? Number(form.brand_id) : null,
        price: Number(form.price) || 0,
        description: form.description.trim(),
        specifications: form.specifications.trim(),
        status: form.status,
      };
      if (editing) {
        const res = await authFetch(`/api/v1/products/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '保存失败'); }
        toast.success('产品已更新');
      } else {
        const res = await authFetch('/api/v1/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '创建失败'); }
        toast.success('产品已创建');
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
      const res = await authFetch(`/api/v1/products/${deleting.id}`, { method: 'DELETE' });
      if (!res?.ok) { const e = await res?.json(); throw new Error(e?.error || '删除失败'); }
      toast.success('产品已删除');
      setDeleteOpen(false);
      setDeleting(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    } finally {
      setSaving(false);
    }
  }

  function updateForm(key: keyof ProductForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <p className="text-gray-500">加载中...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">产品管理</h1>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />新增产品</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">名称</th>
              <th className="text-left px-4 py-3 font-medium">SKU</th>
              <th className="text-left px-4 py-3 font-medium">分类</th>
              <th className="text-right px-4 py-3 font-medium">价格</th>
              <th className="text-center px-4 py-3 font-medium">状态</th>
              <th className="text-center px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无产品。</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.sku}</td>
                <td className="px-4 py-3 text-gray-600">
                  {categories.find((c) => c.id === p.category_id)?.name ?? p.category_id ?? '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-900">¥{p.price}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status === 'active' ? '上架' : '下架'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="编辑"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => confirmDelete(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新增/编辑 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑产品' : '新增产品'}</DialogTitle>
            <DialogDescription>{editing ? '修改产品信息' : '填写新产品信息'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>产品名称 *</Label>
                <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="产品名称" />
              </div>
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input value={form.sku} onChange={(e) => updateForm('sku', e.target.value)} placeholder="SKU" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>分类</Label>
                <select className="w-full h-9 rounded-md border border-gray-200 px-3 text-sm bg-white" value={form.category_id} onChange={(e) => updateForm('category_id', e.target.value)}>
                  <option value="">无</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>品牌</Label>
                <select className="w-full h-9 rounded-md border border-gray-200 px-3 text-sm bg-white" value={form.brand_id} onChange={(e) => updateForm('brand_id', e.target.value)}>
                  <option value="">无</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>价格</Label>
                <Input type="number" value={form.price} onChange={(e) => updateForm('price', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>状态</Label>
                <select className="w-full h-9 rounded-md border border-gray-200 px-3 text-sm bg-white" value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                  <option value="active">上架</option>
                  <option value="inactive">下架</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="产品描述" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>规格参数 (JSON)</Label>
              <Textarea value={form.specifications} onChange={(e) => updateForm('specifications', e.target.value)} placeholder='{"高度": "30m", "速度": "90km/h"}' rows={3} />
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

      {/* 删除确认 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除产品「{deleting?.name}」吗？此操作不可撤销。
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