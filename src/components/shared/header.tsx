'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X, Search, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { locales, type Locale } from '@/i18n/routing';
import { useSiteConfig } from '@/providers/site-config-provider';
import { useRouter } from 'next/navigation';

const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ar: 'العربية',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  ja: '日本語',
  ko: '한국어',
  pt: 'Português',
  ru: 'Русский',
  th: 'ไทย',
};

export default function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [langOpen, setLangOpen] = useState(false);
  const { config } = useSiteConfig();
  const router = useRouter();

  const siteName = config.site_name || 'RideCraft';
  const logoSrc = config.site_logo_url || '';

  const currentLocale = pathname.split('/')[1] as Locale;
  const isActive = (path: string) => pathname.includes(path);

  const navLinks = [
    { href: `/${currentLocale}`, label: t('home') },
    { href: `/${currentLocale}/products`, label: t('products') },
    { href: `/${currentLocale}/categories`, label: t('categories') },
    { href: `/${currentLocale}/brands`, label: t('brands') },
    { href: `/${currentLocale}/news`, label: t('news') },
    { href: `/${currentLocale}/about`, label: t('about') },
    { href: `/${currentLocale}/contact`, label: t('contact') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={`/${currentLocale}`}
            className="flex items-center gap-2 text-xl font-bold text-blue-600"
          >
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt={siteName} className="h-8 w-auto" />
            ) : (
              <span className="text-2xl">🎢</span>
            )}
            <span>{siteName}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive(link.href) && link.href !== `/${currentLocale}`
                    ? 'text-orange-500 bg-orange-50'
                    : link.href === `/${currentLocale}` && pathname === `/${currentLocale}`
                    ? 'text-orange-500 bg-orange-50'
                    : 'text-gray-700 hover:text-orange-500 hover:bg-orange-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex text-gray-600 hover:text-blue-600"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Language Switcher */}
            <div className="relative hidden sm:block">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-blue-600 gap-1"
                onClick={() => setLangOpen(!langOpen)}
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs">{currentLocale.toUpperCase()}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border bg-white p-1 shadow-lg">
                  {locales.map((locale) => (
                    <Link
                      key={locale}
                      href={pathname.replace(`/${currentLocale}`, `/${locale}`)}
                      className={cn(
                        'block px-3 py-2 text-sm rounded-lg hover:bg-gray-100',
                        locale === currentLocale && 'bg-blue-50 text-blue-600 font-medium'
                      )}
                      onClick={() => setLangOpen(false)}
                    >
                      {localeNames[locale]}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Auth */}
            <div className="hidden sm:flex items-center gap-2">
              <Link href={`/${currentLocale}/auth/login`}>
                <Button variant="ghost" size="sm" className="text-gray-700">
                  {t('login')}
                </Button>
              </Link>
              <Link href={`/${currentLocale}/auth/register`}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {t('register')}
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-600"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 space-y-1">
            {/* Mobile Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.target as HTMLFormElement).querySelector('input');
                if (input?.value.trim()) {
                  router.push(`/${currentLocale}/search?q=${encodeURIComponent(input.value.trim())}`);
                  setMobileOpen(false);
                }
              }}
              className="relative mb-3"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('search')}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block px-3 py-2 text-sm font-medium rounded-lg',
                  isActive(link.href) && link.href !== `/${currentLocale}`
                    ? 'text-orange-500 bg-orange-50'
                    : link.href === `/${currentLocale}` && pathname === `/${currentLocale}`
                    ? 'text-orange-500 bg-orange-50'
                    : 'text-gray-700 hover:text-orange-500 hover:bg-orange-50'
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-3 mt-3">
              {/* Mobile Language Switcher */}
              <div className="mb-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-3">Language</p>
                <div className="grid grid-cols-3 gap-1">
                  {locales.map((locale) => (
                    <Link
                      key={locale}
                      href={pathname.replace(`/${currentLocale}`, `/${locale}`)}
                      className={cn(
                        'px-2 py-1.5 text-xs rounded-lg text-center hover:bg-gray-100',
                        locale === currentLocale && 'bg-blue-50 text-blue-600 font-medium'
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      {localeNames[locale]}
                    </Link>
                  ))}
                </div>
              </div>
              <Link
                href={`/${currentLocale}/auth/login`}
                className="block px-3 py-2 text-sm font-medium text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                {t('login')}
              </Link>
              <Link
                href={`/${currentLocale}/auth/register`}
                className="block px-3 py-2 text-sm font-medium text-blue-600"
                onClick={() => setMobileOpen(false)}
              >
                {t('register')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {searchOpen && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <div className="mx-auto max-w-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/${currentLocale}/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchOpen(false);
                  setSearchQuery('');
                }
              }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search')}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}