/**
 * i18n 语言文件同步脚本
 *
 * 以 en.json 为真相源，将缺失的键同步到所有语言文件：
 * - 保留已有翻译
 * - 新增键标记为 "[TODO: translate] <value>"
 * - 移除多余键
 *
 * 用法: npx tsx scripts/sync-i18n.ts [--prune]
 * --prune: 同时移除目标文件中多余的键
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
  const sorted = Object.keys(flat).sort();
  for (const key of sorted) {
    const value = flat[key];
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
    console.log(`   ⚠️ ${locale}.json 不存在，将基于 en.json 创建`);
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
  const pruneMode = args.includes('--prune');

  const en = loadMessages('en');
  const enFlat = flatten(en);

  let totalSynced = 0;
  let totalPruned = 0;

  for (const locale of LOCALES) {
    if (locale === 'en') continue;

    const messages = loadMessages(locale);
    const flat = flatten(messages);
    let changed = false;

    // 同步缺失键
    for (const [k, v] of Object.entries(enFlat)) {
      if (!(k in flat)) {
        flat[k] = `[TODO: translate] ${v}`;
        console.log(`   ➕ ${locale}.json 新增: ${k}`);
        changed = true;
        totalSynced++;
      }
    }

    // 移除多余键
    if (pruneMode) {
      for (const k of Object.keys(flat)) {
        if (!(k in enFlat)) {
          delete flat[k];
          console.log(`   🗑️ ${locale}.json 移除: ${k}`);
          changed = true;
          totalPruned++;
        }
      }
    }

    if (changed) {
      saveMessages(locale, unflatten(flat));
    } else {
      console.log(`   ✅ ${locale}.json — 已是最新`);
    }
  }

  console.log(`\n--- 同步完成 ---`);
  console.log(`新增键: ${totalSynced}`);
  if (pruneMode) console.log(`移除多余键: ${totalPruned}`);
  if (totalSynced === 0 && totalPruned === 0) {
    console.log(`所有语言文件已与 en.json 一致`);
  } else {
    console.log(`请手动翻译标记为 [TODO: translate] 的条目`);
  }
}

main();