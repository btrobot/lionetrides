'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AdminPageHeader, AdminCard, AdminLoadingSkeleton } from '@/components/admin/admin-card';
import { AdminTable, AdminBadge, AdminSearchBar, AdminPagination } from '@/components/admin/admin-table';
import type { Column } from '@/components/admin/admin-table';

interface AdminUser {
  id: number; email: string; name: string | null; role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  isActive: boolean; createdAt: string; lastLoginAt: string | null;
}

const roleLabels: Record<string, string> = {
  super_admin: '超级管理员', admin: '管理员', editor: '编辑', viewer: '查看者',
};

export default function AdminUsers() {
  const { authFetch } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editRole, setEditRole] = useState<string>('viewer');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set('search', search);
      const res = await authFetch(`/api/v1/admin/users?${params}`);
      if (!res) return;
      const d = await res.json();
      setUsers(d.data?.items ?? []);
      setTotal(d.data?.total ?? 0);
      setTotalPages(d.data?.totalPages ?? 0);
    } catch (e) { console.error('Failed to load users:', e);
    } finally { setLoading(false); }
  }, [authFetch, search, page]);
  useEffect(() => { loadData(); }, [loadData]);

  const openEdit = (user: AdminUser) => {
    setSelected(user);
    setEditRole(user.role);
    setEditOpen(true);
  };

  const saveRole = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/admin/users/${selected.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: editRole }),
      });
      if (!res) return;
      const d = await res.json();
      if (d.success) {
        setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, role: editRole as AdminUser['role'] } : u));
        setEditOpen(false);
        toast.success('用户角色已更新');
      }
    } catch (_e) { toast.error('更新失败');
    } finally { setSaving(false); }
  };

  const toggleActive = async (user: AdminUser) => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/admin/users/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res) return;
      const d = await res.json();
      if (d.success) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !user.isActive } : u));
        toast.success(user.isActive ? '用户已禁用' : '用户已启用');
      }
    } catch (_e) { toast.error('状态切换失败');
    } finally { setSaving(false); }
  };

  const columns: Column<AdminUser>[] = [
    { key: 'name', header: '姓名', render: (u) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
          {(u.name || u.email)[0].toUpperCase()}
        </div>
        <div><span className="font-medium text-slate-900">{u.name || '—'}</span><p className="text-xs text-slate-500">{u.email}</p></div>
      </div>
    )},
    { key: 'role', header: '角色', render: (u) => <AdminBadge status={u.role} />, className: 'text-center' },
    { key: 'status', header: '状态', render: (u) => <AdminBadge status={u.isActive ? 'active' : 'inactive'} label={u.isActive ? '活跃' : '禁用'} />, className: 'text-center' },
    { key: 'date', header: '注册时间', render: (u) => <span className="text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</span> },
    { key: 'lastLogin', header: '最后登录', render: (u) => <span className="text-slate-400 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('zh-CN') : '从未'}</span> },
    {
      key: 'actions', header: '操作', className: 'text-center',
      render: (u) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors text-xs">编辑角色</button>
          <button onClick={() => toggleActive(u)} className={`p-1.5 rounded-lg text-xs transition-colors ${u.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-600'}`}>
            {u.isActive ? '禁用' : '启用'}
          </button>
        </div>
      ),
    },
  ];

  if (loading && page === 1) return <AdminLoadingSkeleton rows={8} />;

  return (
    <div>
      <AdminPageHeader title="用户管理" description="管理后台用户和角色权限" />
      <div className="mb-4"><AdminSearchBar value={search} onChange={setSearch} placeholder="搜索用户姓名/邮箱..." className="max-w-xs" /></div>
      <AdminCard padding={false}>
        <AdminTable columns={columns} data={users} keyField="id" emptyText="暂无用户" />
      </AdminCard>
      <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-t-lg" />
          <DialogHeader className="pt-2">
            <DialogTitle>编辑用户角色</DialogTitle>
            <DialogDescription>修改 {selected?.name || selected?.email} 的角色权限</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-700">角色</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="w-full">
                  <SelectValue>{roleLabels[editRole]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">超级管理员</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="editor">编辑</SelectItem>
                  <SelectItem value="viewer">查看者</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
              <p className="font-medium text-slate-700">角色权限说明：</p>
              <p>🔵 超级管理员 - 所有权限</p>
              <p>🟣 管理员 - 管理+编辑权限</p>
              <p>🟢 编辑 - 内容编辑权限</p>
              <p>⚪ 查看者 - 仅查看权限</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={saveRole} disabled={saving} className="bg-purple-600 hover:bg-purple-700">保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

