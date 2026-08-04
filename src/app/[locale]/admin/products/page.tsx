'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Download, Upload, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { AdminCard, AdminPageHeader, AdminLoadingSkeleton } from '@/components/admin/admin-card';
import { AdminTable, type Column, AdminBadge, AdminSearchBar } from '@/components/admin/admin-table';
import { AdminForm, type FormField } from '@/components/admin/admin-form';
import { AdminDialog } from '@/components/admin/admin-dialog';
import { toast } from '@/components/admin/toast';

interface Product {
  id: number; name: string; slug: string; sku: string;
  category_id: number | null; brand_id: number | null;
  price: number; status: 'active' | 'inactive';
  description: string | null; specifications: string | null;
}

interface Category { id: number; name: string; }
interface Brand { id: number; name: string; }

interface ProductForm {
  name: string; sku: string; category_id: string; brand_id: string;
  price: string; description: string; specifications: string; status: string;
}

interface ImportResult {
  total: number; created: number; updated: number; skipped: number;
  errors: { row: number; field: string; message: string }[];
}

export default function ProductsPage() {
  const { authFetch } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<'create' | 'upsert'>('create');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductForm>({
    name: '', sku: '', category_id: '', brand_id: '',
    price: '0', description: '', specifications: '', status: 'active',
  });

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, cRes, bRes] = await Promise.all([
        authFetch('/api/v1/products'),
        authFetch('/api/v1/categories'),
        authFetch('/api/v1/brands'),
      ]);
      if (pRes?.ok) setProducts(await pRes.json());
      if (cRes?.ok) setCategories(await cRes.json());
      if (bRes?.ok) setBrands(await bRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm({ name: '', sku: '', category_id: '', brand_id: '', price: '0', description: '', specifications: '', status: 'active' });
    setDialogOpen(true);
  }

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

  // ─── Export Handler ──────────────────────────────────
  async function handleExport() {
    setExporting(true);
    try {
      const res = await authFetch('/api/v1/products/export?format=csv');
      if (!res?.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `products-export-${timestamp}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('产品数据已导出');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '导出失败');
    } finally {
      setExporting(false);
    }
  }

  // ─── Import Handler ──────────────────────────────────
  async function handleImport(file: File) {
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch(`/api/v1/products/import?mode=${importMode}`, {
        method: 'POST',
        body: formData,
      });
      if (!res?.ok) {
        const e = await res?.json();
        throw new Error(e?.error || 'Import failed');
      }
      const json = await res.json();
      setImportResult(json.data);
      if (json.data.created > 0 || json.data.updated > 0) {
        loadData();
      }
      if (json.data.errors.length === 0) {
        toast.success(`导入完成：新增 ${json.data.created}，更新 ${json.data.updated}`);
      } else {
        toast.warning(`导入完成，但有 ${json.data.errors.length} 条错误`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '导入失败');
    } finally {
      setImporting(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
  }

  // ─── Download CSV Template ───────────────────────────
  function downloadTemplate() {
    const headers = 'SKU，产品名称/Name,Slug，描述/Description，简短描述/Short Description，分类/Category，品牌/Brand，价格/Price，重量/Weight，尺寸/Dimensions，材质/Material，容量/Capacity，功率/Power，保修/Warranty，认证/Certification，最小起订量/MOQ，主图 URL/Main Image，状态/Status (draft/published/archived)，推荐/Featured (true/false),SEO 标题/Meta Title,SEO 描述/Meta Description';
    const example = 'RC-001,Double Loop Coaster,double-loop-coaster,Exciting double loop roller coaster...,High-thrill coaster，过山车,ThrillRides,150000,5000kg,120x30x40m,Steel,40 riders,200kW,2 years,CE/ISO,1,https://example.com/img.jpg,published,true,Double Loop Coaster | Lionet Rides,Buy double loop coaster from Lionet Rides';
    const csv = `${headers}\n${example}`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product-import-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

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
          <button onClick={() => openEdit(p)} className="p-1.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors" title="编辑">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => confirmDelete(p)} className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 transition-colors" title="删除">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const formFields: FormField[] = [
    { key: 'name', label: '产品名称', type: 'text', required: true, placeholder: '产品名称' },
    { key: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'SKU' },
    { key: 'category_id', label: '分类', type: 'select', options: [{ value: '', label: '无' }, ...categories.map((c) => ({ value: c.id.toString(), label: c.name }))] },
    { key: 'brand_id', label: '品牌', type: 'select', options: [{ value: '', label: '无' }, ...brands.map((b) => ({ value: b.id.toString(), label: b.name }))] },
    { key: 'price', label: '价格', type: 'number', placeholder: '0' },
    { key: 'status', label: '状态', type: 'select', options: [{ value: 'active', label: '上架' }, { value: 'inactive', label: '下架' }] },
    { key: 'description', label: '描述', type: 'textarea', placeholder: '产品描述', rows: 3 },
    { key: 'specifications', label: '规格参数 (JSON)', type: 'textarea', placeholder: '{"高度": "30m", "速度": "90km/h"}', rows: 3 },
  ];

  if (loading) return <AdminLoadingSkeleton rows={8} />;

  return (
    <div>
      <AdminPageHeader
        title="产品管理"
        description="管理产品目录、技术参数与上架状态"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              导出 CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => { setImportResult(null); setImportOpen(true); }}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              批量导入
            </Button>
            <Button onClick={openAdd} className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <Plus className="w-4 h-4 mr-2" />新增产品
            </Button>
          </div>
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
      <AdminDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? '编辑产品' : '新增产品'}
        description={editing ? '修改产品信息' : '填写新产品信息'}
        onConfirm={handleSave}
        confirmText={editing ? '保存修改' : '创建'}
        loading={saving}
      >
        <AdminForm
          fields={formFields}
          values={form}
          onChange={updateForm}
        />
      </AdminDialog>

      {/* 删除确认 */}
      <AdminDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="确认删除"
        description={`确定要删除产品「${deleting?.name}」吗？此操作不可撤销。`}
        onConfirm={handleDelete}
        confirmText="删除"
        confirmVariant="danger"
        loading={saving}
      />

      {/* 批量导入 Dialog */}
      <AdminDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="批量导入产品"
        description="通过 CSV 文件批量导入或更新产品数据"
        showFooter={false}
      >
        <div className="space-y-4">
          {/* 导入模式 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">导入模式</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setImportMode('create')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  importMode === 'create'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-medium text-slate-900">仅新增</div>
                <div className="text-xs text-slate-500 mt-0.5">跳过已存在的 SKU</div>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('upsert')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  importMode === 'upsert'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-medium text-slate-900">新增 + 更新</div>
                <div className="text-xs text-slate-500 mt-0.5">已存在的 SKU 会被覆盖</div>
              </button>
            </div>
          </div>

          {/* 下载模板 */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600 flex-1">首次导入？先下载模板文件，按格式填写后上传</span>
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0"
            >
              下载模板
            </button>
          </div>

          {/* 文件上传 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">选择 CSV 文件</label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-import-input"
              />
              <label
                htmlFor="csv-import-input"
                className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
              >
                {importing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="text-sm text-slate-500">正在导入...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-sm text-slate-500">点击选择或拖拽 CSV 文件</span>
                    <span className="text-xs text-slate-400">支持 .csv 格式</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* 导入结果 */}
          {importResult && (
            <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                {importResult.errors.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <span className="text-sm font-medium text-slate-900">导入结果</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded bg-white border border-slate-100">
                  <div className="text-lg font-bold text-slate-900">{importResult.total}</div>
                  <div className="text-xs text-slate-500">总计</div>
                </div>
                <div className="p-2 rounded bg-white border border-emerald-100">
                  <div className="text-lg font-bold text-emerald-600">{importResult.created}</div>
                  <div className="text-xs text-slate-500">新增</div>
                </div>
                <div className="p-2 rounded bg-white border border-blue-100">
                  <div className="text-lg font-bold text-blue-600">{importResult.updated}</div>
                  <div className="text-xs text-slate-500">更新</div>
                </div>
                <div className="p-2 rounded bg-white border border-slate-100">
                  <div className="text-lg font-bold text-slate-500">{importResult.skipped}</div>
                  <div className="text-xs text-slate-500">跳过</div>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  <div className="text-xs font-medium text-slate-700 mb-1">错误详情：</div>
                  {importResult.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="text-xs text-red-600 py-0.5">
                      行 {err.row}: [{err.field}] {err.message}
                    </div>
                  ))}
                  {importResult.errors.length > 10 && (
                    <div className="text-xs text-slate-400">...还有 {importResult.errors.length - 10} 条错误</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setImportOpen(false)}>关闭</Button>
          </div>
        </div>
      </AdminDialog>
    </div>
  );
}
