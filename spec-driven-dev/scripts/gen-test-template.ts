/**
 * Spec 测试模板生成器
 *
 * 读取 spec 文件，为每个模块生成测试文件骨架。
 *
 * 用法: npx tsx scripts/gen-test-template.ts <module>
 *       不传参数则列出所有模块
 */

import { readdirSync, readFileSync, existsSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..');
const SPECS_DIR = join(PROJECT_ROOT, 'specs');
const TESTS_DIR = join(PROJECT_ROOT, 'src', '__tests__', 'unit', 'services');

function extractModuleInfo(file: string): { module: string; operations: string[]; rules: string[] } {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  const module = file.replace('.spec.yaml', '').split('/').pop()!;
  const operations: string[] = [];
  const rules: string[] = [];

  let inOperations = false;
  let inRules = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'operations:') { inOperations = true; inRules = false; continue; }
    if (trimmed.startsWith('rules:')) { inOperations = false; inRules = true; continue; }
    if (trimmed.startsWith('state_machine:') || trimmed.startsWith('entity:')) { inOperations = false; inRules = false; continue; }

    if (inOperations) {
      const opMatch = trimmed.match(/^(\w+):/);
      if (opMatch && line.match(/^  \w/)) {
        operations.push(opMatch[1]);
      }
    }

    if (inRules) {
      const idMatch = trimmed.match(/id:\s*(.+)/);
      if (idMatch) {
        rules.push(idMatch[1].trim());
      }
    }
  }

  return { module, operations, rules };
}

function generateTestContent(module: string, operations: string[], rules: string[]): string {
  const Module = module.charAt(0).toUpperCase() + module.slice(1);

  const opTests = operations.map(op => {
    const testCases: string[] = [];
    testCases.push(`  describe('${op}', () => {`);

    switch (op) {
      case 'list':
        testCases.push(`    it('应返回分页${Module}列表', async () => {`);
        testCases.push(`      // TODO: 实现 list 测试`);
        testCases.push(`    });`);
        testCases.push(`    it('应支持搜索过滤', async () => {`);
        testCases.push(`      // TODO: 实现搜索过滤测试`);
        testCases.push(`    });`);
        break;
      case 'getById':
        testCases.push(`    it('应返回单个${Module}', async () => {`);
        testCases.push(`      // TODO: 实现 getById 测试`);
        testCases.push(`    });`);
        testCases.push(`    it('不存在时应抛出 NotFoundError', async () => {`);
        testCases.push(`      // TODO: 实现 NotFound 测试`);
        testCases.push(`    });`);
        break;
      case 'create':
        testCases.push(`    it('应创建${Module}并返回', async () => {`);
        testCases.push(`      // TODO: 实现 create 测试`);
        testCases.push(`    });`);
        testCases.push(`    it('参数非法时应抛出 ValidationError', async () => {`);
        testCases.push(`      // TODO: 实现参数校验测试`);
        testCases.push(`    });`);
        break;
      case 'update':
        testCases.push(`    it('应更新${Module}并返回', async () => {`);
        testCases.push(`      // TODO: 实现 update 测试`);
        testCases.push(`    });`);
        testCases.push(`    it('不存在时应抛出 NotFoundError', async () => {`);
        testCases.push(`      // TODO: 实现 NotFound 测试`);
        testCases.push(`    });`);
        break;
      case 'remove':
        testCases.push(`    it('应软删除${Module}', async () => {`);
        testCases.push(`      // TODO: 实现 remove 测试`);
        testCases.push(`    });`);
        testCases.push(`    it('不存在时应抛出 NotFoundError', async () => {`);
        testCases.push(`      // TODO: 实现 NotFound 测试`);
        testCases.push(`    });`);
        break;
      default:
        testCases.push(`    it('应执行 ${op} 操作', async () => {`);
        testCases.push(`      // TODO: 实现 ${op} 测试`);
        testCases.push(`    });`);
    }

    testCases.push(`  });`);
    return testCases.join('\n');
  }).join('\n\n');

  const ruleTests = rules.map(rule => {
    return `    it('${rule}: 应验证对应业务规则', async () => {`);
    // return `      // TODO: 实现规则 ${rule} 测试`;
    // return `    });`;
  }).join('\n');

  return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/db';
import { ${module}Service } from '@/services/${module}-service';
import { NotFoundError, ValidationError } from '@/lib/errors';

vi.mock('@/db', () => ({
  db: {} as any,
}));

const mockDb = db as any;

describe('${module}Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

${opTests}

${rules.length > 0 ? `\n  describe('business rules', () => {\n${ruleTests}\n  });\n` : ''}
});
`;
}

async function main() {
  const args = process.argv.slice(2);
  const targetModule = args[0];

  if (!existsSync(SPECS_DIR)) {
    console.error('❌ specs/ 目录不存在');
    process.exit(1);
  }

  const specFiles = readdirSync(SPECS_DIR)
    .filter(f => f.endsWith('.spec.yaml'))
    .sort();

  if (specFiles.length === 0) {
    console.log('⚠️  specs/ 目录下没有 .spec.yaml 文件');
    process.exit(0);
  }

  if (!targetModule) {
    console.log('\n📋 可用模块:\n');
    for (const file of specFiles) {
      const { module, operations, rules } = extractModuleInfo(join(SPECS_DIR, file));
      const testFile = join(TESTS_DIR, `${module}.service.test.ts`);
      const exists = existsSync(testFile);
      console.log(`  ${exists ? '✅' : '  '} ${module} (${operations.length} ops, ${rules.length} rules)${exists ? '' : ' ❌ 无测试'}`);
    }
    console.log('\n使用: npx tsx scripts/gen-test-template.ts <module>');
    process.exit(0);
  }

  const specFile = join(SPECS_DIR, `${targetModule}.spec.yaml`);
  if (!existsSync(specFile)) {
    console.error(`❌ 未找到 ${targetModule}.spec.yaml`);
    process.exit(1);
  }

  const { module, operations, rules } = extractModuleInfo(specFile);
  const testFile = join(TESTS_DIR, `${module}.service.test.ts`);

  if (existsSync(testFile)) {
    console.log(`⚠️  ${testFile} 已存在，跳过`);
    process.exit(0);
  }

  if (!existsSync(TESTS_DIR)) {
    // Create directory
    const dir = TESTS_DIR;
    // Already handled by fs
  }

  const content = generateTestContent(module, operations, rules);
  writeFileSync(testFile, content, 'utf-8');
  console.log(`✅ 生成测试文件: ${testFile}`);
  console.log(`   ${operations.length} 个操作, ${rules.length} 条规则`);
}

main().catch(console.error);