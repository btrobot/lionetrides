'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MapPin, Phone, Mail, Linkedin, Youtube, Twitter } from 'lucide-react';
import { type Locale } from '@/i18n/routing';

export default function Footer() {
  const t = useTranslations('footer');
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] as Locale;

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎢</span>
              <span className="text-xl font-bold text-white">RideCraft</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {t('contact_us')}
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-blue-400 shrink-0" />
                <span>{t('address')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-blue-400 shrink-0" />
                <span>{t('phone')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-blue-400 shrink-0" />
                <span>{t('email')}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-blue-600 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-blue-600 transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-blue-600 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('quick_links')}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={`/${currentLocale}/products`} className="hover:text-blue-400 transition-colors">
                  {t('products')}
                </Link>
              </li>
              <li>
                <Link href={`/${currentLocale}/categories`} className="hover:text-blue-400 transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href={`/${currentLocale}/brands`} className="hover:text-blue-400 transition-colors">
                  Brands
                </Link>
              </li>
              <li>
                <Link href={`/${currentLocale}/news`} className="hover:text-blue-400 transition-colors">
                  News
                </Link>
              </li>
              <li>
                <Link href={`/${currentLocale}/about`} className="hover:text-blue-400 transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('products')}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={`/${currentLocale}/products?category=roller-coasters`} className="hover:text-blue-400 transition-colors">
                  Roller Coasters
                </Link>
              </li>
              <li>
                <Link href={`/${currentLocale}/products?category=ferris-wheels`} className="hover:text-blue-400 transition-colors">
                  Ferris Wheels
                </Link>
              </li>
              <li>
                <Link href={`/${currentLocale}/products?category=carousels`} className="hover:text-blue-400 transition-colors">
                  Carousels
                </Link>
              </li>
              <li>
                <Link href={`/${currentLocale}/products?category=water-rides`} className="hover:text-blue-400 transition-colors">
                  Water Park Rides
                </Link>
              </li>
              <li>
                <Link href={`/${currentLocale}/products?category=kids-rides`} className="hover:text-blue-400 transition-colors">
                  Kids' Rides
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('support')}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={`/${currentLocale}/about`} className="hover:text-blue-400 transition-colors">
                  {t('contact_us')}
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">FAQ</a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">After-Sales Service</a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">Shipping & Logistics</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} RideCraft Industries. {t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}