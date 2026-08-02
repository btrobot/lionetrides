'use client';

import { useTranslations } from 'next-intl';

export default function AdminSettings() {
  const t = useTranslations('admin');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('settings.title')}</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <p className="text-gray-400">{t('settings.coming_soon')}</p>
      </div>
    </div>
  );
}