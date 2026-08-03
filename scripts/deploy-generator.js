#!/usr/bin/env node

/**
 * 部署配置生成器
 * 
 * 从高层 DSL (deploy.yaml) 生成 Dockerfile 和相关脚本
 * 
 * 设计理念：
 * - 声明意图，不是实现
 * -  sensible defaults（80% 场景零配置）
 * - 组合式概念
 * - 自文档化
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ============================================
// 配置加载
// ============================================

function loadConfig(configPath = 'deploy.yaml') {
  if (!fs.existsSync(configPath)) {
    console.error(`❌ 配置文件不存在: ${configPath}`);
    process.exit(1);
  }
  
  const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
  return applyDefaults(config);
}

function applyDefaults(config) {
  const defaults = {
    app: {
      type: 'web',
      build: {
        from: './src',
        command: 'npm run build',
        output: './dist'
      },
      run: {
        command: 'node dist/index.js',
        port: 3000
      }
    },
    deploy: {
      target: 'docker',
      replicas: 1,
      strategy: 'rolling',
      regions: ['cn']
    },
    environments: {
      china: {
        npm_mirror: 'https://mirrors.cloud.tencent.com/npm',
        apt_mirror: 'https://mirrors.ustc.edu.cn/debian'
      },
      global: {
        npm_mirror: 'https://registry.npmjs.org',
        apt_mirror: 'http://deb.debian.org/debian'
      }
    }
  };
  
  return deepMerge(defaults, config);
}

function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// ============================================
// Dockerfile 生成
// ============================================

function generateDockerfile(config) {
  const lines = [];
  
  // 头部注释
  lines.push(`# ============================================`);
  lines.push(`# 自动生成的 Dockerfile`);
  lines.push(`# 生成时间: ${new Date().toISOString()}`);
  lines.push(`# 配置来源: deploy.yaml`);
  lines.push(`# ============================================`);
  lines.push(`# 请勿手动修改，修改 deploy.yaml 后重新生成`);
  lines.push('');
  
  // 构建参数
  lines.push(`# 构建参数`);
  lines.push(`ARG DEPLOY_REGION=auto`);
  lines.push(`ARG BUILD_DATE=${new Date().toISOString()}`);
  lines.push('');
  
  // 阶段 1: 依赖
  lines.push(`# ============================================`);
  lines.push(`# 阶段 1: 安装依赖`);
  lines.push(`# ============================================`);
  lines.push(`FROM node:24-bookworm-slim AS deps`);
  lines.push(`WORKDIR /app`);
  lines.push('');
  lines.push(`# 镜像源自动检测`);
  lines.push(`COPY scripts/detect-mirror.sh /tmp/`);
  lines.push(`RUN if [ "\${DEPLOY_REGION}" = "cn" ] || [ "\${DEPLOY_REGION}" = "global" ]; then \\`);
  lines.push(`      bash /tmp/detect-mirror.sh --force-\${DEPLOY_REGION}; \\`);
  lines.push(`    else \\`);
  lines.push(`      bash /tmp/detect-mirror.sh; \\`);
  lines.push(`    fi`);
  lines.push('');
  lines.push(`COPY package*.json ./`);
  lines.push(`RUN pnpm install --frozen-lockfile`);
  lines.push('');
  
  // 阶段 2: 构建
  lines.push(`# ============================================`);
  lines.push(`# 阶段 2: 构建应用`);
  lines.push(`# ============================================`);
  lines.push(`FROM node:24-bookworm-slim AS builder`);
  lines.push(`WORKDIR /app`);
  lines.push(`COPY --from=deps /app/node_modules ./node_modules`);
  lines.push(`COPY . .`);
  lines.push(`RUN ${config.app.build.command}`);
  lines.push('');
  
  // 阶段 3: 运行
  lines.push(`# ============================================`);
  lines.push(`# 阶段 3: 运行环境`);
  lines.push(`# ============================================`);
  lines.push(`FROM node:24-bookworm-slim AS runner`);
  lines.push(`WORKDIR /app`);
  lines.push('');
  
  // 数据库
  if (config.app.needs && config.app.needs.includes('postgresql')) {
    lines.push(`# 安装 PostgreSQL`);
    lines.push(`RUN apt-get update && \\`);
    lines.push(`    apt-get install -y --no-install-recommends \\`);
    lines.push(`      postgresql-17 \\`);
    lines.push(`      postgresql-client-17 && \\`);
    lines.push(`    rm -rf /var/lib/apt/lists/*`);
    lines.push('');
    lines.push(`ENV PGPORT=5433`);
    lines.push('');
  }
  
  // 复制构建产物
  lines.push(`# 复制构建产物`);
  lines.push(`COPY --from=builder /app/dist ./dist`);
  lines.push(`COPY --from=builder /app/node_modules ./node_modules`);
  lines.push(`COPY --from=builder /app/package*.json ./`);
  lines.push('');
  
  // 复制脚本
  lines.push(`# 复制启动脚本`);
  lines.push(`COPY docker-entrypoint.sh /usr/local/bin/`);
  lines.push(`RUN chmod +x /usr/local/bin/docker-entrypoint.sh`);
  lines.push('');
  
  // 环境变量
  lines.push(`# 环境变量`);
  lines.push(`ENV NODE_ENV=production`);
  lines.push(`ENV PORT=${config.app.run.port}`);
  lines.push('');
  
  // 健康检查
  lines.push(`# 健康检查`);
  lines.push(`HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \\`);
  lines.push(`  CMD curl -f http://localhost:${config.app.run.port}/health || exit 1`);
  lines.push('');
  
  // OCI 标签
  lines.push(`# OCI 标签`);
  lines.push(`LABEL org.opencontainers.image.title="${config.app.name}"`);
  lines.push(`LABEL org.opencontainers.image.description="Auto-generated from deploy.yaml"`);
  lines.push(`LABEL org.opencontainers.image.version="1.0.0"`);
  lines.push(`LABEL org.opencontainers.image.created="\${BUILD_DATE}"`);
  lines.push('');
  
  // 暴露端口
  lines.push(`EXPOSE ${config.app.run.port}`);
  lines.push('');
  
  // 启动命令
  lines.push(`# 启动`);
  lines.push(`ENTRYPOINT ["docker-entrypoint.sh"]`);
  lines.push('');
  
  return lines.join('\n');
}

// ============================================
// docker-entrypoint.sh 生成
// ============================================

function generateEntrypoint(config) {
  const lines = [];
  
  lines.push(`#!/bin/bash`);
  lines.push(`set -euo pipefail`);
  lines.push('');
  lines.push(`# ============================================`);
  lines.push(`# 自动生成的启动脚本`);
  lines.push(`# 生成时间: ${new Date().toISOString()}`);
  lines.push(`# ============================================`);
  lines.push('');
  
  // 数据库启动
  if (config.app.needs && config.app.needs.includes('postgresql')) {
    lines.push(`# 启动 PostgreSQL`);
    lines.push(`echo "Starting PostgreSQL..."`);
    lines.push(`PG_VER=$(ls /etc/postgresql/ | head -1)`);
    lines.push(`su - postgres -c "pg_ctlcluster \${PG_VER} main start"`);
    lines.push('');
    lines.push(`# 等待 PostgreSQL 就绪`);
    lines.push(`echo "Waiting for PostgreSQL..."`);
    lines.push(`for i in {1..30}; do`);
    lines.push(`  if su - postgres -c "pg_isready -p \${PGPORT:-5433}" >/dev/null 2>&1; then`);
    lines.push(`    echo "PostgreSQL is ready"`);
    lines.push(`    break`);
    lines.push(`  fi`);
    lines.push(`  echo "Waiting... (\$i/30)"`);
    lines.push(`  sleep 1`);
    lines.push(`done`);
    lines.push('');
    lines.push(`# 初始化数据库`);
    lines.push(`echo "Initializing database..."`);
    lines.push(`su - postgres -c "psql -c \\"ALTER USER postgres PASSWORD 'postgres';\\"" 2>/dev/null || true`);
    lines.push(`su - postgres -c "createdb lionetrides" 2>/dev/null || echo "Database already exists"`);
    lines.push('');
  }
  
  // 启动应用
  lines.push(`# 启动应用（非 root 用户）`);
  lines.push(`echo "Starting application..."`);
  lines.push(`exec su -s /bin/bash node -c "exec ${config.app.run.command}"`);
  lines.push('');
  
  return lines.join('\n');
}

// ============================================
// 主程序
// ============================================

function main() {
  console.log('🚀 部署配置生成器');
  console.log('');
  
  // 加载配置
  console.log('📖 加载配置...');
  const config = loadConfig();
  console.log(`   应用: ${config.app.name}`);
  console.log(`   类型: ${config.app.type}`);
  console.log(`   需要: ${config.app.needs?.join(', ') || '无'}`);
  console.log('');
  
  // 生成 Dockerfile
  console.log('🔨 生成 Dockerfile...');
  const dockerfile = generateDockerfile(config);
  fs.writeFileSync('Dockerfile', dockerfile);
  console.log('   ✅ Dockerfile 已生成');
  console.log('');
  
  // 生成 entrypoint
  console.log('🔨 生成 docker-entrypoint.sh...');
  const entrypoint = generateEntrypoint(config);
  fs.writeFileSync('docker-entrypoint.sh', entrypoint);
  fs.chmodSync('docker-entrypoint.sh', '755');
  console.log('   ✅ docker-entrypoint.sh 已生成');
  console.log('');
  
  // 验证
  console.log('🔍 验证生成的文件...');
  console.log('   运行: bash scripts/validate-docker.sh');
  console.log('');
  
  console.log('✨ 完成！');
  console.log('');
  console.log('下一步:');
  console.log('  1. 检查生成的文件');
  console.log('  2. 运行验证: bash scripts/validate-docker.sh');
  console.log('  3. 构建镜像: docker build -t ' + config.app.name + ' .');
}

main();
