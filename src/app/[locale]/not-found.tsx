import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function LocaleNotFound() {
  const t = useTranslations('common');
  const n = useTranslations('nav');

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* 404 大数字背景 */}
        <div className="relative mb-8">
          <div className="text-[10rem] sm:text-[12rem] font-bold leading-none text-blue-600/10 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-600/10 rounded-full p-6">
              <Search className="h-12 w-12 text-blue-600" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {t('not_found_title')}
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          {t('not_found_description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Home className="h-5 w-5" />
            {t('back_home')}
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-blue-600 hover:text-blue-600 transition-colors"
          >
            <Search className="h-5 w-5" />
            {n('products')}
          </Link>
        </div>
      </div>
    </div>
  );
}