import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Regression Test: i18n MISSING_MESSAGE Error
 *
 * 历史 Bug 复盘：
 * 首页使用 `useTranslations('home')`，但所有语言文件都没有 `home` 命名空间，
 * 导致 next-intl 报 `MISSING_MESSAGE: Could not resolve 'home'` 错误。
 *
 * 本测试验证：
 * 1. 所有页面使用的命名空间都存在于语言文件中
 * 2. 所有语言文件都包含相同的命名空间集合
 * 3. 没有遗漏的命名空间
 */

const MESSAGES_DIR = 'src/i18n/messages';
const LOCALES = ['en', 'zh', 'ar', 'de', 'es', 'fr', 'ja', 'ko', 'pt', 'ru', 'th'];

// 所有页面使用的命名空间（从 useTranslations() 调用中提取）
const USED_NAMESPACES = ['home', 'categories', 'products', 'news', 'brands', 'admin', 'auth', 'common', 'hero', 'stats', 'certifications', 'partners', 'footer'];

describe('Reg: i18n Namespace Coverage', () => {
  it('en.json contains all used namespaces', () => {
    const data = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'en.json'), 'utf-8'));
    const missing = USED_NAMESPACES.filter(ns => !(ns in data));
    expect(missing, `Missing namespaces in en.json: ${missing.join(', ')}`).toEqual([]);
  });

  it('zh.json contains all used namespaces', () => {
    const data = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'zh.json'), 'utf-8'));
    const missing = USED_NAMESPACES.filter(ns => !(ns in data));
    expect(missing, `Missing namespaces in zh.json: ${missing.join(', ')}`).toEqual([]);
  });

  it('all locales have the same top-level keys', () => {
    const enKeys = Object.keys(JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'en.json'), 'utf-8'))).sort();
    
    for (const locale of LOCALES) {
      if (locale === 'en') continue;
      const data = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), 'utf-8'));
      const keys = Object.keys(data).sort();
      expect(keys, `${locale}.json has different namespaces than en.json`).toEqual(enKeys);
    }
  });

  it('home namespace has all required keys', () => {
    const data = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'en.json'), 'utf-8'));
    const homeKeys = Object.keys(data.home);
    const requiredKeys = ['hero_title', 'hero_subtitle', 'explore_products', 'categories_title', 'featured_title', 'news_title'];
    const missing = requiredKeys.filter(k => !homeKeys.includes(k));
    expect(missing, `Missing keys in home namespace: ${missing.join(', ')}`).toEqual([]);
  });

  it('products namespace has all required keys', () => {
    const data = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'en.json'), 'utf-8'));
    const requiredKeys = ['title', 'subtitle', 'send_inquiry', 'loading', 'no_results'];
    const missing = requiredKeys.filter(k => !(k in data.products));
    expect(missing, `Missing keys in products namespace: ${missing.join(', ')}`).toEqual([]);
  });

  it('admin namespace has all section namespaces', () => {
    const data = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'en.json'), 'utf-8'));
    const requiredSections = ['sidebar', 'dashboard', 'products', 'categories', 'brands', 'inquiries', 'customers', 'reviews', 'settings'];
    const missing = requiredSections.filter(k => !(k in data.admin));
    expect(missing, `Missing sections in admin namespace: ${missing.join(', ')}`).toEqual([]);
  });
});
