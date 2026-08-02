/**
 * Spec Audit 对比工具
 *
 * 扫描 specs/ 目录下的所有 *.spec.yaml，与代码中的服务层、API 路由、工厂对比，
 * 输出差异清单，按 P0/P1/P2 分类。
 *
 * 用法: npx tsx scripts/audit-compare.ts [--json]
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const SPECS_DIR = join(PROJECT_ROOT, 'specs');
const SERVICES_DIR = join(PROJECT_ROOT, 'src', 'services');
const API_DIR = join(PROJECT_ROOT, 'src', 'app', 'api', 'v1');
const FACTORIES_DIR = join(PROJECT_ROOT, 'src', '__tests__', 'factories');

interface SpecOperation {
  method: string;
  path: string;
  auth: string;
  pagination?: boolean;
  params?: Record<string, unknown>;
  response?: unknown;
}



interface SpecRule {
  id: string;
  severity: string;
  description: string;
  validation?: string;
  error?: string;
}

interface AuditItem {
  module: string;
  category: 'field' | 'operation' | 'state_machine' | 'rule';
  severity: 'P0' | 'P1' | 'P2';
  description: string;
  detail: string;
}

function readYamlContent(file: string): string {
  return readFileSync(file, 'utf-8');
}

function checkServiceExists(module: string): boolean {
  return existsSync(join(SERVICES_DIR, `${module}-service.ts`));
}

function checkApiRoutes(module: string, operations: Record<string, SpecOperation>): string[] {
  const missing: string[] = [];

  for (const [opName, op] of Object.entries(operations)) {
    const routePath = op.path
      .replace(/^\/api\/v1\//, '')
      .replace(/:(\w+)/g, '[$1]');

    const routeFile = join(API_DIR, routePath, 'route.ts');
    if (!existsSync(routeFile)) {
      missing.push(`${opName} (${op.method} ${op.path})`);
    }
  }

  return missing;
}

function checkFactoryExists(module: string): boolean {
  return existsSync(join(FACTORIES_DIR, `${module}.factory.ts`));
}

function getPriority(operation: string, auth: string): 'P0' | 'P1' | 'P2' {
  const coreOps = ['list', 'getById', 'create'];
  const fullOps = ['update', 'remove'];

  if (coreOps.includes(operation) || auth === 'public') return 'P0';
  if (fullOps.includes(operation)) return 'P1';
  return 'P2';
}

async function main() {
  const isJson = process.argv.includes('--json');
  const items: AuditItem[] = [];

  const specFiles = readdirSync(SPECS_DIR)
    .filter(f => f.endsWith('.spec.yaml'))
    .sort();

  if (specFiles.length === 0) {
    console.log('⚠️  specs/ 目录下没有 .spec.yaml 文件');
    process.exit(0);
  }

  console.log(`\n📋 发现 ${specFiles.length} 个 spec 文件\n`);

  for (const file of specFiles) {
    const moduleName = file.replace('.spec.yaml', '');
    const content = readYamlContent(join(SPECS_DIR, file));
    const lines = content.split('\n');

    // Extract operations
    const operations: Record<string, SpecOperation> = {};
    const rules: SpecRule[] = [];
    let inOperations = false;
    let inRules = false;
    let currentOp = '';
    let currentRule = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === 'operations:') {
        inOperations = true;
        inRules = false;
        continue;
      }
      if (trimmed === 'rules:') {
        inOperations = false;
        inRules = true;
        continue;
      }
      if (trimmed.startsWith('state_machine:') || trimmed.startsWith('entity:')) {
        inOperations = false;
        inRules = false;
        continue;
      }

      if (inOperations) {
        const opMatch = trimmed.match(/^(\w+):/);
        if (opMatch && line.match(/^  \w/)) {
          currentOp = opMatch[1];
          operations[currentOp] = { method: 'GET', path: '', auth: 'public' };
        } else if (currentOp) {
          const methodMatch = trimmed.match(/^method:\s*(.+)/);
          if (methodMatch) operations[currentOp].method = methodMatch[1].trim();
          const pathMatch = trimmed.match(/^path:\s*(.+)/);
          if (pathMatch) operations[currentOp].path = pathMatch[1].trim();
          const authMatch = trimmed.match(/^auth:\s*(.+)/);
          if (authMatch) operations[currentOp].auth = authMatch[1].trim();
        }
      }

      if (inRules) {
        const ruleMatch = trimmed.match(/^\s+-\s+id:\s*(.+)/);
        if (ruleMatch) {
          currentRule = ruleMatch[1].trim();
          rules.push({ id: currentRule, severity: 'error', description: '' });
        }
        if (currentRule) {
          const sevMatch = trimmed.match(/severity:\s*(.+)/);
          if (sevMatch) {
            const last = rules[rules.length - 1];
            if (last) last.severity = sevMatch[1].trim();
          }
          const descMatch = trimmed.match(/description:\s*(.+)/);
          if (descMatch) {
            const last = rules[rules.length - 1];
            if (last) last.description = descMatch[1].trim();
          }
        }
      }
    }

    console.log(`\n## ${moduleName}`);

    // 1. Check service
    const serviceExists = checkServiceExists(moduleName);
    console.log(`  服务层: ${serviceExists ? '✅' : '❌'} ${moduleName}-service.ts`);
    if (!serviceExists && Object.keys(operations).length > 0) {
      items.push({
        module: moduleName,
        category: 'operation',
        severity: 'P1',
        description: '服务层缺失',
        detail: `${moduleName}-service.ts 不存在，但有 ${Object.keys(operations).length} 个操作需要实现`,
      });
    }

    // 2. Check API routes
    const missingRoutes = checkApiRoutes(moduleName, operations);
    for (const route of missingRoutes) {
      const opName = route.split(' ')[0];
      const op = operations[opName];
      const priority = op ? getPriority(opName, op.auth) : 'P1';
      items.push({
        module: moduleName,
        category: 'operation',
        severity: priority,
        description: `API 路由缺失: ${route}`,
        detail: '未找到对应的 route.ts 文件',
      });
      console.log(`  ${priority === 'P0' ? '🔴' : '🟡'} [${priority}] API 路由缺失: ${route}`);
    }

    // 3. Check factory
    const factoryExists = checkFactoryExists(moduleName);
    console.log(`  工厂: ${factoryExists ? '✅' : '❌'} ${moduleName}.factory.ts`);
    if (!factoryExists && Object.keys(operations).length > 0) {
      items.push({
        module: moduleName,
        category: 'field',
        severity: 'P2',
        description: '工厂文件缺失',
        detail: `${moduleName}.factory.ts 不存在，测试数据无法生成`,
      });
    }

    // 4. Check rules
    for (const rule of rules) {
      const priority = rule.severity === 'error' ? 'P0' : rule.severity === 'warning' ? 'P1' : 'P2';
      items.push({
        module: moduleName,
        category: 'rule',
        severity: priority,
        description: `规则审计: ${rule.id}`,
        detail: `${rule.description} — 需要检查代码中是否有对应校验逻辑`,
      });
      console.log(`  ${priority === 'P0' ? '🔴' : priority === 'P1' ? '🟡' : '⚪'} [${priority}] 规则 ${rule.id}: ${rule.description}`);
    }
  }

  // Summary
  const p0 = items.filter(i => i.severity === 'P0');
  const p1 = items.filter(i => i.severity === 'P1');
  const p2 = items.filter(i => i.severity === 'P2');

  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 Audit 汇总');
  console.log(`${'='.repeat(50)}`);
  console.log(`  总计: ${items.length} 项`);
  console.log(`  🔴 P0: ${p0.length} 项（核心功能）`);
  console.log(`  🟡 P1: ${p1.length} 项（完整 CRUD）`);
  console.log(`  ⚪ P2: ${p2.length} 项（工程优化）`);

  if (isJson) {
    console.log(JSON.stringify({ items, summary: { total: items.length, P0: p0.length, P1: p1.length, P2: p2.length } }, null, 2));
  }
}

main().catch(console.error);