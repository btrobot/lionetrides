'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import type { Locale } from '@/i18n/routing';

type SettingEntry = {
  key: string;
  value: string;
  locale: string;
  type: string;
  section: string;
  label: string;
  sortOrder: number;
};

const SECTIONS = [
  { id: 'brand', labelKey: 'settings.sections.brand' },
  { id: 'contact', labelKey: 'settings.sections.contact' },
  { id: 'social', labelKey: 'settings.sections.social' },
  { id: 'seo', labelKey: 'settings.sections.seo' },
];

export default function AdminSettings() {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;
  const { authFetch } = useAdminAuth();
  const [settings, setSettings] = useState<SettingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('brand');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both en and zh settings
      const [enRes] = await Promise.all([
        fetch(`/api/v1/site-settings?locale=en`),
      ]);
      const enData = await enRes.json();

      // Group by key to create entries
      const entryMap = new Map<string, SettingEntry>();
      for (const [key, value] of Object.entries(enData.data || {})) {
        if (key === 'site_keywords' || key === 'site_description' ||
            key === 'site_name' || key === 'site_tagline' ||
            key === 'contact_address' || key === 'contact_phone' || key === 'contact_email' ||
            key === 'social_linkedin' || key === 'social_youtube' || key === 'social_twitter' ||
            key === 'site_logo_url') {
          entryMap.set(key, {
            key,
            value: value as string,
            locale: 'en',
            type: 'text',
            section: getSectionForKey(key),
            label: getLabelForKey(key, 'en'),
            sortOrder: getSortOrderForKey(key),
          });
        }
      }

      const entries = Array.from(entryMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
      setSettings(entries);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      for (const setting of settings) {
        await authFetch('/api/v1/site-settings/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: setting.key,
            value: setting.value,
            locale: currentLocale === 'zh' ? 'zh' : 'en',
            type: setting.type,
            section: setting.section,
            label: setting.label,
            sortOrder: setting.sortOrder,
          }),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium">✓ Saved</span>
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
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {SECTIONS.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeSection === section.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(section.labelKey)}
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
                {setting.label}
              </label>
              {setting.type === 'image' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={setting.value}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="https://..."
                  />
                  {setting.value && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={setting.value}
                      alt={setting.label}
                      className="h-10 w-auto object-contain"
                    />
                  )}
                </div>
              ) : setting.type === 'textarea' || setting.key === 'site_description' || setting.key === 'site_keywords' ? (
                <textarea
                  value={setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <input
                  type="text"
                  value={setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getSectionForKey(key: string): string {
  if (key.startsWith('site_')) return 'brand';
  if (key.startsWith('contact_')) return 'contact';
  if (key.startsWith('social_')) return 'social';
  if (key.startsWith('site_description') || key.startsWith('site_keywords')) return 'seo';
  return 'general';
}

function getLabelForKey(key: string, _locale: string): string {
  const labels: Record<string, string> = {
    site_name: 'Company Name',
    site_logo_url: 'Logo URL',
    site_tagline: 'Tagline',
    site_description: 'Meta Description',
    site_keywords: 'Meta Keywords',
    contact_address: 'Address',
    contact_phone: 'Phone',
    contact_email: 'Email',
    social_linkedin: 'LinkedIn URL',
    social_youtube: 'YouTube URL',
    social_twitter: 'Twitter URL',
  };
  return labels[key] || key;
}

function getSortOrderForKey(key: string): number {
  const order: Record<string, number> = {
    site_name: 1,
    site_logo_url: 2,
    site_tagline: 3,
    contact_address: 4,
    contact_phone: 5,
    contact_email: 6,
    social_linkedin: 7,
    social_youtube: 8,
    social_twitter: 9,
    site_description: 10,
    site_keywords: 11,
  };
  return order[key] || 99;
}