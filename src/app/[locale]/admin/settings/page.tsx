'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2, Save, RefreshCw, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { AdminPageHeader, AdminCard, AdminLoadingSkeleton } from '@/components/admin/admin-card';
import type { Locale } from '@/i18n/routing';

type FullSetting = {
  id: number; key: string; value: string | null; locale: string;
  type: string; section: string; label: string | null; sortOrder: number | null;
};

const SECTION_ORDER = ['brand', 'contact', 'social', 'seo', 'home', 'about'];
const SECTION_LABELS: Record<string, string> = {
  brand: '品牌', contact: '联系方式', social: '社交媒体',
  seo: 'SEO', home: '首页', about: '关于我们',
};

export default function AdminSettings() {
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;
  const { authFetch } = useAdminAuth();
  const [settings, setSettings] = useState<FullSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('brand');
  const [jsonEditor, setJsonEditor] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/site-settings?full=true&locale=en`);
      const data = await res.json();
      if (data.success) {
        const items = data.data as FullSetting[];
        const sorted = [...items].sort((a, b) => {
          const ai = SECTION_ORDER.indexOf(a.section);
          const bi = SECTION_ORDER.indexOf(b.section);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        });
        setSettings(sorted);
        if (sorted.length > 0) setActiveSection(sorted[0].section);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('加载设置失败');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const sections = Array.from(new Set(settings.map(s => s.section)))
    .sort((a, b) => { const ai = SECTION_ORDER.indexOf(a); const bi = SECTION_ORDER.indexOf(b); return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi); });

  const handleChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const filtered = activeSection ? settings.filter(s => s.section === activeSection) : settings;
      for (const setting of filtered) {
        const res = await authFetch('/api/v1/site-settings/update', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: setting.key, value: setting.value ?? '', locale: currentLocale === 'zh' ? 'zh' : 'en', type: setting.type, section: setting.section, label: setting.label, sortOrder: setting.sortOrder }),
        });
        if (!res) continue;
        const data = await res.json();
        if (!data.success) setError(`保存 ${setting.key} 失败`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('网络错误');
    } finally { setSaving(false); }
  };

  const handleJsonEdit = (key: string, currentValue: string | null) => {
    try { const parsed = JSON.parse(currentValue ?? '[]'); setJsonEditor(JSON.stringify(parsed, null, 2)); }
    catch { setJsonEditor(currentValue ?? '[]'); }
  };

  const handleJsonSave = (key: string) => {
    if (jsonEditor === null) return;
    try { JSON.parse(jsonEditor); handleChange(key, jsonEditor); setJsonEditor(null); }
    catch { alert('JSON 格式无效，请检查语法'); }
  };

  if (loading) return <AdminLoadingSkeleton rows={6} />;

  const filteredSettings = settings.filter(s => s.section === activeSection);

  const renderField = (setting: FullSetting) => {
    const isJson = setting.type === 'json' || (typeof setting.value === 'string' && (setting.value.startsWith('[') || setting.value.startsWith('{')));
    if (isJson) {
      const isEditing = jsonEditor !== null;
      return isEditing ? (
        <div className="space-y-2">
          <textarea value={jsonEditor} onChange={(e) => setJsonEditor(e.target.value)} rows={10}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleJsonSave(setting.key)}>保存 JSON</Button>
            <Button size="sm" variant="ghost" onClick={() => setJsonEditor(null)}>取消</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <div className="flex-1 bg-slate-50 rounded-lg p-3 text-xs font-mono text-slate-600 whitespace-pre-wrap max-h-32 overflow-y-auto">{setting.value ?? '[]'}</div>
          <Button size="sm" variant="outline" onClick={() => handleJsonEdit(setting.key, setting.value)} className="shrink-0"><Code className="h-3.5 w-3.5 mr-1" />编辑 JSON</Button>
        </div>
      );
    }
    if (setting.type === 'image' || (setting.value && (setting.value.startsWith('http') && (setting.value.endsWith('.png') || setting.value.endsWith('.jpg') || setting.value.endsWith('.svg'))))) {
      return (
        <div className="space-y-2">
          <input type="text" value={setting.value ?? ''} onChange={(e) => handleChange(setting.key, e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="https://..." />
          {setting.value && <img src={setting.value} alt={setting.label ?? setting.key} className="h-10 w-auto object-contain" />}
        </div>
      );
    }
    const isLongText = (setting.value?.length ?? 0) > 80;
    return isLongText ? (
      <textarea value={setting.value ?? ''} onChange={(e) => handleChange(setting.key, e.target.value)} rows={3}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
    ) : (
      <input type="text" value={setting.value ?? ''} onChange={(e) => handleChange(setting.key, e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
    );
  };

  return (
    <div>
      <AdminPageHeader title="系统设置" description="管理站点配置、品牌信息和 SEO 设置">
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
          {saved && <span className="text-xs text-emerald-600 font-medium">✓ 已保存</span>}
          <Button variant="outline" size="sm" onClick={fetchSettings}><RefreshCw className="h-3.5 w-3.5 mr-1" />刷新</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            保存
          </Button>
        </div>
      </AdminPageHeader>

      {/* Section Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        {sections.map(section => (
          <button key={section} onClick={() => { setActiveSection(section); setJsonEditor(null); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeSection === section ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {SECTION_LABELS[section] || section}
            <span className="ml-1.5 text-xs text-slate-400">({settings.filter(s => s.section === section).length})</span>
          </button>
        ))}
      </div>

      <AdminCard>
        {filteredSettings.length === 0 ? (
          <p className="text-slate-400 text-center py-8">此部分暂无设置项</p>
        ) : (
          <div className="space-y-6">
            {filteredSettings.map(setting => (
              <div key={setting.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {setting.label ?? setting.key}
                  <span className="ml-2 text-xs text-slate-400 font-mono">{setting.key}</span>
                </label>
                {renderField(setting)}
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}