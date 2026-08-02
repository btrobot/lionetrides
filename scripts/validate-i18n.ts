/**
 * i18n 语言文件一致性校验脚本
 *
 * 以 en.json 为真相源，递归比较所有语言文件：
 * - 缺失键（en.json 有但目标文件没有）
 * - 多余键（目标文件有但 en.json 没有）
 * - 空值键（值为空字符串）
 * - 未翻译键（值仍为英文，与 en.json 完全相同）
 *
 * 用法: npx tsx scripts/validate-i18n.ts [--fix]
 * --fix: 自动填充缺失键为 "[TODO: translate <key>]"
 */

import * as fs from 'fs';
import * as path from 'path';

const LOCALES = ['en', 'zh', 'ar', 'de', 'es', 'fr', 'ja', 'ko', 'pt', 'ru', 'th'] as const;
const MESSAGES_DIR = path.resolve(__dirname, '../src/i18n/messages');

type Messages = Record<string, string | Record<string, unknown>>;

function flatten(obj: Messages, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) {
      Object.assign(result, flatten(v as Messages, key));
    } else {
      result[key] = v as string;
    }
  }
  return result;
}

function unflatten(flat: Record<string, string>): Messages {
  const root: Messages = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Messages;
    }
    current[parts[parts.length - 1]] = value;
  }
  return root;
}

function loadMessages(locale: string): Messages {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveMessages(locale: string, messages: Messages): void {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2) + '\n', 'utf-8');
}

function main() {
  const args = process.argv.slice(2);
  const fixMode = args.includes('--fix');

  const en = loadMessages('en');
  const enFlat = flatten(en);
  const enKeys = new Set(Object.keys(enFlat));

  let hasErrors = false;
  let totalMissing = 0;
  let totalExtra = 0;
  let totalEmpty = 0;
  let totalUntranslated = 0;

  for (const locale of LOCALES) {
    if (locale === 'en') continue;

    const messages = loadMessages(locale);
    const flat = flatten(messages);
    const keys = new Set(Object.keys(flat));

    // 缺失键
    const missing: string[] = [];
    for (const k of enKeys) {
      if (!keys.has(k)) {
        missing.push(k);
        totalMissing++;
      }
    }

    // 多余键
    const extra: string[] = [];
    for (const k of keys) {
      if (!enKeys.has(k)) {
        extra.push(k);
        totalExtra++;
      }
    }

    // 空值 / 未翻译
    const empty: string[] = [];
    const untranslated: string[] = [];
    for (const k of enKeys) {
      if (keys.has(k) && flat[k] === '') {
        empty.push(k);
        totalEmpty++;
      }
      if (keys.has(k) && flat[k] === enFlat[k] && locale !== 'zh') {
        // 非中文语言，如果值与英文完全相同，视为未翻译
        untranslated.push(k);
        totalUntranslated++;
      }
    }

    // 报告
    if (missing.length === 0 && extra.length === 0 && empty.length === 0 && untranslated.length === 0) {
      console.log(`  ✅ ${locale}.json — 完全一致`);
      continue;
    }

    hasErrors = true;
    console.log(`\n  ❌ ${locale}.json`);

    if (missing.length > 0) {
      console.log(`     缺失 ${missing.length} 个键:`);
      missing.forEach(k => console.log(`       - ${k}`));
    }
    if (extra.length > 0) {
      console.log(`     多余 ${extra.length} 个键:`);
      extra.forEach(k => console.log(`       - ${k}`));
    }
    if (empty.length > 0) {
      console.log(`     空值 ${empty.length} 个:`);
      empty.forEach(k => console.log(`       - ${k}`));
    }
    if (untranslated.length > 0) {
      console.log(`     未翻译 ${untranslated.length} 个（值与 en.json 相同）:`);
      untranslated.forEach(k => console.log(`       - ${k}`));
    }

    // --fix 模式：自动填充
    if (fixMode && missing.length > 0) {
      for (const k of missing) {
        flat[k] = `[TODO: translate] ${enFlat[k]}`;
      }
      saveMessages(locale, unflatten(flat));
      console.log(`     → 已填充 ${missing.length} 个缺失键`);
    }
  }

  console.log(`\n--- 汇总 ---`);
  console.log(`语言文件: ${LOCALES.length} 个（en 为真相源，${LOCALES.length - 1} 个待校验）`);
  console.log(`总键数: ${enKeys.size}`);
  console.log(`缺失键: ${totalMissing}`);
  console.log(`多余键: ${totalExtra}`);
  console.log(`空值: ${totalEmpty}`);
  console.log(`未翻译（值同英文）: ${totalUntranslated}`);

  if (hasErrors) {
    if (fixMode) {
      console.log(`\n✅ --fix 模式已填充缺失键，请手动翻译标记为 [TODO: translate] 的条目`);
      process.exit(0);
    }
    console.log(`\n❌ 校验未通过。运行 npx tsx scripts/validate-i18n.ts --fix 自动填充缺失键`);
    process.exit(1);
  }

  console.log(`\n✅ 所有语言文件一致`);
}

main();