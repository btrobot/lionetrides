'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, UserPlus, UserCheck, UserX, Edit3, Shield, Mail, Phone, Building2, Calendar } from 'lucide-react';

interface AdminUser {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  role: 'customer' | 'admin' | 'super_admin' | 'editor' | 'viewer';
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const roleLabels: Record<string, string> = {
  super_admin: '超级管理',
  admin: '管理',
  editor: '编辑',
  viewer: '只读',
  customer: '客户',
};

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  editor: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-700',
  customer: 'bg-orange-100 text-orange-700',
};

export default function AdminUsers() {
  const { authFetch } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', name: '', role: 'editor' });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      const res = await authFetch(`/api/v1/admin/users?${params}`);
      if (!res) return;
      const d = await res.json();
      setUsers(d.data?.items ?? []);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  }, [authFetch, search]);

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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      if (!res) return;
      const d = await res.json();
      if (d.success) {
        setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, role: editRole as AdminUser['role'] } : u));
        setEditOpen(false);
        toast.success('用户角色已更新');
      }
    } catch (e) {
      console.error('Failed to update role:', e);
      toast.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: AdminUser) => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res) return;
      const d = await res.json();
      if (d.success) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !user.isActive } : u));
        toast.success(user.isActive ? '用户已禁用' : '用户已启用');
      }
    } catch (e) {
      console.error('Failed to toggle user status:', e);
      toast.error('状态切换失败');
    } finally {
      setSaving(false);
    }
  };

  const createUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.name) {
      toast.error('请填写所有必填项');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (!res) return;
      const d = await res.json();
      if (d.success) {
        setUsers(prev => [d.data, ...prev]);
        setCreateOpen(false);
        setCreateForm({ email: '', password: '', name: '', role: 'editor' });
        toast.success('用户已创建');
      } else {
        toast.error(d.error || '创建失败');
      }
    } catch (e) {
      console.error('Failed to create user:', e);
      toast.error('创建失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1" /> 刷新
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> 新建用户
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="搜索用户姓名或邮箱..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无用户</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-sm font-medium text-muted-foreground">
                <th className="py-3 px-4">用户</th>
                <th className="py-3 px-4 hidden md:table-cell">联系方式</th>
                <th className="py-3 px-4">角色</th>
                <th className="py-3 px-4">状态</th>
                <th className="py-3 px-4 hidden sm:table-cell">注册时间</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium">{user.name || '未填写'}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    {user.phone && <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" /> {user.phone}</div>}
                    {user.company && <div className="flex items-center gap-1 text-sm text-muted-foreground"><Building2 className="h-3 w-3" /> {user.company}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${roleColors[user.role] || ''}`}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? '正常' : '禁用'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(user)} disabled={saving}>
                        {user.isActive ? <UserX className="h-4 w-4 text-orange-500" /> : <UserCheck className="h-4 w-4 text-green-500" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户角色</DialogTitle>
            <DialogDescription>{selected?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">角色</label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">超级管理</SelectItem>
                  <SelectItem value="admin">管理</SelectItem>
                  <SelectItem value="editor">编辑</SelectItem>
                  <SelectItem value="viewer">只读</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
              <Button onClick={saveRole} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建用户</DialogTitle>
            <DialogDescription>创建后台管理用户（编辑/只读）</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">姓名 *</label>
              <Input
                value={createForm.name}
                onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                placeholder="输入姓名"
              />
            </div>
            <div>
              <label className="text-sm font-medium">邮箱 *</label>
              <Input
                type="email"
                value={createForm.email}
                onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                placeholder="输入邮箱"
              />
            </div>
            <div>
              <label className="text-sm font-medium">密码 *</label>
              <Input
                type="password"
                value={createForm.password}
                onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                placeholder="输入密码（至少6位）"
              />
            </div>
            <div>
              <label className="text-sm font-medium">角色</label>
              <Select value={createForm.role} onValueChange={v => setCreateForm(p => ({ ...p, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">编辑</SelectItem>
                  <SelectItem value="viewer">只读</SelectItem>
                  <SelectItem value="admin">管理</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
              <Button onClick={createUser} disabled={saving}>{saving ? '创建中...' : '创建'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}