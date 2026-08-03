'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');
  const n = useTranslations('nav');

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* 500 大数字背景 */}
        <div className="relative mb-8">
          <div className="text-[10rem] sm:text-[12rem] font-bold leading-none text-red-600/10 select-none">
            500
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-100 rounded-full p-6">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {t('error_title')}
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          {t('error_description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            <RefreshCw className="h-5 w-5" />
            {t('error_try_again')}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-blue-600 hover:text-blue-600 transition-colors"
          >
            <Home className="h-5 w-5" />
            {t('back_home')}
          </Link>
        </div>
      </div>
    </div>
  );
}