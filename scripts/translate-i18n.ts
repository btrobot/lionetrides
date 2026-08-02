/**
 * AI 翻译脚本
 *
 * 以 en.json 为真相源，使用大模型自动翻译 `[TODO: translate]` 标记的条目。
 * 保留已有翻译，只翻译待翻译条目。
 *
 * 用法: npx tsx scripts/translate-i18n.ts [--lang zh] [--model doubao-seed-2-0-lite-260215]
 *   --lang: 指定目标语言（如 zh, ja, fr），不传则翻译所有语言
 *   --model: 指定模型（默认使用 lite 模型，性价比高）
 *   --dry-run: 只列出待翻译条目，不实际翻译
 */

import * as fs from 'fs';
import * as path from 'path';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// ========== 配置 ==========

const LOCALES = ['en', 'zh', 'ar', 'de', 'es', 'fr', 'ja', 'ko', 'pt', 'ru', 'th'] as const;
const MESSAGES_DIR = path.resolve(__dirname, '../src/i18n/messages');

const DEFAULT_MODEL = 'doubao-seed-2-0-lite-260215';

// 行业术语表（Glossary）— 确保专业术语翻译准确
const GLOSSARY: Record<string, Record<string, string>> = {
  zh: {
    'amusement rides': '游乐设施',
    'roller coaster': '过山车',
    'ferris wheel': '摩天轮',
    'carousel': '旋转木马',
    'bumper cars': '碰碰车',
    'water park': '水上乐园',
    'theme park': '主题乐园',
    'amusement park': '游乐园',
    'thrill ride': '惊险游乐设施',
    'family ride': '家庭游乐设施',
    'kids ride': '儿童游乐设施',
    'drop tower': '跳楼机',
    'swing ride': '旋转飞椅',
    'log flume': '激流勇进',
    'dark ride': '黑暗骑乘',
    'inquiry': '询盘',
    'B2B': 'B2B',
    'manufacturer': '制造商',
    'patent': '专利',
    'certification': '认证',
    'safety standard': '安全标准',
    'quality inspection': '质量检测',
    'R&D': '研发',
    'smart factory': '智能工厂',
    'after-sales service': '售后服务',
  },
};

// 语言名称映射（用于 Prompt）
const LANGUAGE_NAMES: Record<string, string> = {
  zh: 'Chinese (Simplified)',
  ar: 'Arabic',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  ru: 'Russian',
  th: 'Thai',
};

// ========== 工具函数 ==========

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
  const result: Messages = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Messages;
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

function loadMessages(locale: string): Messages {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveMessages(locale: string, messages: Messages): void {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2) + '\n', 'utf-8');
}

// ========== 主逻辑 ==========

async function main() {
  const args = process.argv.slice(2);
  const targetLang = args.find(a => a.startsWith('--lang='))?.split('=')[1];
  const model = args.find(a => a.startsWith('--model='))?.split('=')[1] || DEFAULT_MODEL;
  const dryRun = args.includes('--dry-run');

  // 确定目标语言列表
  const targetLocales = targetLang
    ? [targetLang]
    : LOCALES.filter(l => l !== 'en');

  console.log(`🤖 AI 翻译脚本`);
  console.log(`  模型: ${model}`);
  console.log(`  目标: ${targetLocales.join(', ') || '(无)'}`);
  if (dryRun) console.log(`  模式: dry-run（仅列出）`);
  console.log('');

  // 加载真相源 en.json
  const enFlat = flatten(loadMessages('en'));

  let totalTranslated = 0;
  let totalSkipped = 0;

  for (const locale of targetLocales) {
    const langName = LANGUAGE_NAMES[locale] || locale;
    const targetMessages = loadMessages(locale);
    const targetFlat = flatten(targetMessages);

    // 找出待翻译条目（以 [TODO: translate] 开头）
    const todoKeys: string[] = [];
    for (const [key, value] of Object.entries(targetFlat)) {
      if (value.startsWith('[TODO: translate]')) {
        // 确保 en.json 中也有这个键（防止残留）
        if (enFlat[key] !== undefined) {
          todoKeys.push(key);
        }
      }
    }

    if (todoKeys.length === 0) {
      console.log(`  ✅ ${locale} (${langName}): 无待翻译条目`);
      totalSkipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  📋 ${locale} (${langName}): ${todoKeys.length} 条待翻译`);
      for (const key of todoKeys.slice(0, 5)) {
        console.log(`     ${key}: ${enFlat[key]?.slice(0, 50)}...`);
      }
      if (todoKeys.length > 5) {
        console.log(`     ... 还有 ${todoKeys.length - 5} 条`);
      }
      continue;
    }

    console.log(`  🔄 ${locale} (${langName}): 正在翻译 ${todoKeys.length} 条...`);

    const glossaryEntries = GLOSSARY[locale];
    const glossaryText = glossaryEntries
      ? `\n术语表（请严格遵循以下翻译）：\n${Object.entries(glossaryEntries)
          .map(([en, trans]) => `  "${en}" → "${trans}"`)
          .join('\n')}`
      : '';

    const config = new Config();
    const client = new LLMClient(config);

    // 分批翻译，每批 50 条
    const BATCH_SIZE = 50;
    let batchStart = 0;
    let totalChanged = 0;

    while (batchStart < todoKeys.length) {
      const batch = todoKeys.slice(batchStart, batchStart + BATCH_SIZE);
      const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(todoKeys.length / BATCH_SIZE);

      console.log(`    📦 第 ${batchNum}/${totalBatches} 批 (${batch.length} 条)...`);

      const sourceEntries = batch.map(key => `"${key}": "${enFlat[key]}"`).join('\n');

      const prompt = `You are a professional translator for an amusement ride manufacturing company website. Translate the following JSON key-value pairs from English to ${langName}.

Rules:
1. Translate ONLY the values, keep the keys unchanged
2. Return ONLY valid JSON object, no markdown, no explanation
3. Keep HTML tags, variables (like {name}), and placeholders unchanged
4. Keep numbers, URLs, and email addresses unchanged
5. For company names, brand names, and product names that should remain in English, keep them as-is${glossaryText}

Source entries to translate:
${sourceEntries}`;

      try {
        const response = await client.invoke([
          { role: 'system', content: 'You are a professional translator specializing in amusement ride industry terminology. Return ONLY valid JSON with no markdown formatting.' },
          { role: 'user', content: prompt },
        ], {
          model: model,
          temperature: 0.3,
        });

        const content = response.content || '';

        // 解析返回的 JSON
        let translations: Record<string, string> = {};
        try {
          translations = JSON.parse(content);
        } catch {
          // 尝试从 markdown 代码块中提取
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            translations = JSON.parse(jsonMatch[1].trim());
          } else {
            // 尝试宽松提取：找第一个 { 和最后一个 }
            const firstBrace = content.indexOf('{');
            const lastBrace = content.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
              translations = JSON.parse(content.slice(firstBrace, lastBrace + 1));
            } else {
              throw new Error('无法解析 AI 返回结果');
            }
          }
        }

        // 应用翻译
        let changed = 0;
        for (const [key, translatedValue] of Object.entries(translations)) {
          if (targetFlat[key] !== undefined && targetFlat[key].startsWith('[TODO: translate]')) {
            targetFlat[key] = translatedValue;
            changed++;
          }
        }
        totalChanged += changed;
        console.log(`    ✅ 第 ${batchNum}/${totalBatches} 批: ${changed}/${batch.length} 条`);

      } catch (error) {
        console.error(`    ❌ 第 ${batchNum}/${totalBatches} 批失败:`, error instanceof Error ? error.message : error);
      }

      batchStart += BATCH_SIZE;
    }

    // 写回文件
    saveMessages(locale, unflatten(targetFlat));
    totalTranslated += totalChanged;
    console.log(`    ✅ ${locale}: 翻译完成 ${totalChanged}/${todoKeys.length} 条`);
  }

  // 总结
  console.log('');
  if (dryRun) {
    console.log(`📋 Dry-run 完成，共 ${totalTranslated} 条待翻译条目`);
  } else {
    console.log(`📊 翻译完成: ${totalTranslated} 条已翻译, ${totalSkipped} 个语言无需翻译`);
  }
}

main().catch(console.error);
