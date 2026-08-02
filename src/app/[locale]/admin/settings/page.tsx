'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Loader2, Save, RefreshCw, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import type { Locale } from '@/i18n/routing';

type FullSetting = {
  id: number;
  key: string;
  value: string | null;
  locale: string;
  type: string;
  section: string;
  label: string | null;
  sortOrder: number | null;
};

const SECTION_ORDER = ['brand', 'contact', 'social', 'seo', 'home', 'about'];

export default function AdminSettings() {
  const t = useTranslations('admin');
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
        // Reorder: ensure brand section comes first for the active tab
        const sorted = [...items].sort((a, b) => {
          const ai = SECTION_ORDER.indexOf(a.section);
          const bi = SECTION_ORDER.indexOf(b.section);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        });
        setSettings(sorted);
        if (sorted.length > 0) {
          setActiveSection(sorted[0].section);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Auto-detect sections from data
  const sections = Array.from(new Set(settings.map(s => s.section)))
    .sort((a, b) => {
      const ai = SECTION_ORDER.indexOf(a);
      const bi = SECTION_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const handleChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const filtered = activeSection
        ? settings.filter(s => s.section === activeSection)
        : settings;

      for (const setting of filtered) {
        const res = await authFetch('/api/v1/site-settings/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: setting.key,
            value: setting.value ?? '',
            locale: currentLocale === 'zh' ? 'zh' : 'en',
            type: setting.type,
            section: setting.section,
            label: setting.label,
            sortOrder: setting.sortOrder,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(`Failed to save ${setting.key}`);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleJsonEdit = (key: string, currentValue: string | null) => {
    try {
      const parsed = JSON.parse(currentValue ?? '[]');
      setJsonEditor(JSON.stringify(parsed, null, 2));
    } catch {
      setJsonEditor(currentValue ?? '[]');
    }
  };

  const handleJsonSave = (key: string) => {
    if (jsonEditor === null) return;
    try {
      // Validate JSON
      JSON.parse(jsonEditor);
      handleChange(key, jsonEditor);
      setJsonEditor(null);
    } catch {
      // Invalid JSON, keep editor open
      alert('Invalid JSON format. Please check your syntax.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const filteredSettings = settings.filter(s => s.section === activeSection);

  const renderField = (setting: FullSetting) => {
    const isJson = setting.type === 'json' || (
      typeof setting.value === 'string' &&
      (setting.value.startsWith('[') || setting.value.startsWith('{'))
    );

    if (isJson) {
      const isEditing = jsonEditor !== null;
      return (
        <div className="space-y-2">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={jsonEditor}
                onChange={(e) => setJsonEditor(e.target.value)}
                rows={10}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleJsonSave(setting.key)}
                >
                  Save JSON
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setJsonEditor(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {setting.value ?? '[]'}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleJsonEdit(setting.key, setting.value)}
                className="shrink-0"
              >
                <Code className="h-3.5 w-3.5 mr-1" />
                Edit JSON
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (setting.type === 'image' || (setting.value && (setting.value.startsWith('http') && (setting.value.endsWith('.png') || setting.value.endsWith('.jpg') || setting.value.endsWith('.svg'))))) {
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={setting.value ?? ''}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="https://..."
          />
          {setting.value && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={setting.value}
              alt={setting.label ?? setting.key}
              className="h-10 w-auto object-contain"
            />
          )}
        </div>
      );
    }

    const isLongText = (setting.value?.length ?? 0) > 80;
    if (isLongText) {
      return (
        <textarea
          value={setting.value ?? ''}
          onChange={(e) => handleChange(setting.key, e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      );
    }

    return (
      <input
        type="text"
        value={setting.value ?? ''}
        onChange={(e) => handleChange(setting.key, e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm text-red-600 font-medium">{error}</span>
          )}
          {saved && (
            <span className="text-sm text-green-600 font-medium">✓ {t('settings.save')}</span>
          )}
          <Button variant="outline" size="sm" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {t('settings.save')}
          </Button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {sections.map(section => (
          <button
            key={section}
            onClick={() => { setActiveSection(section); setJsonEditor(null); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeSection === section
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {section === 'brand' ? t('settings.sections.brand')
              : section === 'contact' ? t('settings.sections.contact')
              : section === 'social' ? t('settings.sections.social')
              : section === 'seo' ? t('settings.sections.seo')
              : section === 'home' ? t('settings.sections.home')
              : section === 'about' ? t('settings.sections.about')
              : section}
            <span className="ml-1.5 text-xs text-gray-400">
              ({filteredSettings.length})
            </span>
          </button>
        ))}
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
        {filteredSettings.length === 0 ? (
          <p className="text-gray-400 text-center py-8">{t('settings.no_settings')}</p>
        ) : (
          filteredSettings.map(setting => (
            <div key={setting.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {setting.label ?? setting.key}
                <span className="ml-2 text-xs text-gray-400 font-mono">{setting.key}</span>
              </label>
              {renderField(setting)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}