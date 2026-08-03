#!/usr/bin/env node

/**
 * LionetRides Deployment DSL Compiler
 * 
 * 将声明式 DSL 编译为优化的 Dockerfile
 */

const fs = require('fs');
const path = require('path');

// ============================================
// 1. 词法分析器 (Lexer)
// ============================================

class Lexer {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }

  tokenize() {
    while (this.pos < this.source.length) {
      this.skipWhitespace();
      if (this.pos >= this.source.length) break;

      const char = this.source[this.pos];

      // 注释
      if (char === '/' && this.source[this.pos + 1] === '/') {
        this.skipLineComment();
        continue;
      }
      if (char === '/' && this.source[this.pos + 1] === '*') {
        this.skipBlockComment();
        continue;
      }

      // 字符串
      if (char === '"' || char === "'") {
        this.tokens.push(this.readString());
        continue;
      }

      // 数字
      if (this.isDigit(char)) {
        this.tokens.push(this.readNumber());
        continue;
      }

      // 标识符或关键字
      if (this.isAlpha(char)) {
        this.tokens.push(this.readIdentifier());
        continue;
      }

      // 符号
      if (this.isSymbol(char)) {
        this.tokens.push(this.readSymbol());
        continue;
      }

      throw this.error(`Unexpected character: ${char}`);
    }

    this.tokens.push({ type: 'EOF', value: null, line: this.line, column: this.column });
    return this.tokens;
  }

  skipWhitespace() {
    while (this.pos < this.source.length) {
      const char = this.source[this.pos];
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.advance();
        this.line++;
        this.column = 1;
      } else {
        break;
      }
    }
  }

  skipLineComment() {
    while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
      this.advance();
    }
  }

  skipBlockComment() {
    this.advance(); // /
    this.advance(); // *
    while (this.pos < this.source.length) {
      if (this.source[this.pos] === '*' && this.source[this.pos + 1] === '/') {
        this.advance();
        this.advance();
        return;
      }
      if (this.source[this.pos] === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }
    throw this.error('Unterminated block comment');
  }

  readString() {
    const quote = this.source[this.pos];
    this.advance();
    let value = '';
    const startLine = this.line;
    const startColumn = this.column;

    while (this.pos < this.source.length && this.source[this.pos] !== quote) {
      if (this.source[this.pos] === '\\') {
        this.advance();
        const escaped = this.source[this.pos];
        if (escaped === 'n') value += '\n';
        else if (escaped === 't') value += '\t';
        else if (escaped === 'r') value += '\r';
        else value += escaped;
      } else {
        value += this.source[this.pos];
      }
      this.advance();
    }

    if (this.pos >= this.source.length) {
      throw this.error('Unterminated string', startLine, startColumn);
    }

    this.advance(); // closing quote
    return { type: 'STRING', value, line: startLine, column: startColumn };
  }

  readNumber() {
    let value = '';
    const startLine = this.line;
    const startColumn = this.column;

    while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
      value += this.source[this.pos];
      this.advance();
    }

    return { type: 'NUMBER', value: parseInt(value), line: startLine, column: startColumn };
  }

  readIdentifier() {
    let value = '';
    const startLine = this.line;
    const startColumn = this.column;

    while (this.pos < this.source.length && this.isAlphaNumeric(this.source[this.pos])) {
      value += this.source[this.pos];
      this.advance();
    }

    // 检查是否是关键字
    const keywords = ['app', 'env', 'stack', 'build', 'deploy', 'security', 'monitoring', 'true', 'false', 'framework', 'runtime', 'port', 'version', 'description', 'package_manager', 'command', 'output_dir', 'health_check', 'https', 'non_root', 'read_only_fs', 'path', 'interval', 'timeout', 'level', 'format', 'mirror', 'npm', 'apt', 'database', 'cache', 'resources', 'cpu', 'memory', 'scaling', 'min_replicas', 'max_replicas', 'target_cpu', 'ingress', 'egress', 'env', 'NODE_ENV', 'DATABASE_URL', 'secrets'];
    const type = keywords.includes(value) ? value.toUpperCase() : 'IDENTIFIER';

    return { type, value, line: startLine, column: startColumn };
  }

  readSymbol() {
    const char = this.source[this.pos];
    const startLine = this.line;
    const startColumn = this.column;
    this.advance();

    const symbols = {
      '{': 'LBRACE',
      '}': 'RBRACE',
      '[': 'LBRACKET',
      ']': 'RBRACKET',
      ':': 'COLON',
      ',': 'COMMA',
      '@': 'AT',
      '.': 'DOT'
    };

    return { type: symbols[char], value: char, line: startLine, column: startColumn };
  }

  advance() {
    this.pos++;
    this.column++;
  }

  isDigit(char) {
    return char >= '0' && char <= '9';
  }

  isAlpha(char) {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
  }

  isAlphaNumeric(char) {
    return this.isAlpha(char) || this.isDigit(char);
  }

  isSymbol(char) {
    return '{}[]:, @.'.includes(char);
  }

  error(message, line = this.line, column = this.column) {
    return new Error(`${message} at line ${line}, column ${column}`);
  }
}

// ============================================
// 2. 语法分析器 (Parser)
// ============================================

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  isKeyword(type) {
    const keywords = ['APP', 'ENV', 'STACK', 'BUILD', 'DEPLOY', 'SECURITY', 'MONITORING', 'VERSION', 'DESCRIPTION', 'FRAMEWORK', 'RUNTIME', 'DATABASE', 'CACHE', 'PORT', 'HEALTH_CHECK', 'SCALING', 'MIN_REPLICAS', 'MAX_REPLICAS', 'HTTPS', 'NON_ROOT', 'READ_ONLY_FS', 'MIRROR', 'NPM', 'APT', 'PATH', 'INTERVAL', 'TIMEOUT', 'LEVEL', 'FORMAT', 'CPU', 'MEMORY'];
    return keywords.includes(type);
  }

  parse() {
    const ast = {
      type: 'Program',
      apps: [],
      envs: []
    };

    while (!this.isEOF()) {
      if (this.check('APP')) {
        ast.apps.push(this.parseApp());
      } else if (this.check('ENV')) {
        ast.envs.push(this.parseEnv());
      } else {
        throw this.error(`Unexpected token: ${this.peek().type}`);
      }
    }

    return ast;
  }

  parseApp() {
    this.consume('APP');
    const name = this.consume('STRING').value;
    this.consume('LBRACE');

    const app = {
      type: 'App',
      name,
      config: {}
    };

    while (!this.check('RBRACE')) {
      // 允许关键字作为属性名
      let key;
      if (this.check('IDENTIFIER')) {
        key = this.consume('IDENTIFIER').value;
      } else if (this.isKeyword(this.peek().type)) {
        key = this.advance().value;
      } else {
        throw this.error(`Expected property name, got ${this.peek().type}`);
      }
      
      // 检查是否是块声明（不带冒号）
      if (this.check('LBRACE')) {
        app.config[key] = this.parseBlock();
      } else {
        // 属性赋值（带冒号）
        this.consume('COLON');
        app.config[key] = this.parseValue();
      }

      if (this.check('COMMA')) {
        this.advance();
      }
    }

    this.consume('RBRACE');
    return app;
  }

  parseEnv() {
    this.consume('ENV');
    const name = this.consume('STRING').value;
    this.consume('LBRACE');

    const env = {
      type: 'Env',
      name,
      config: {}
    };

    while (!this.check('RBRACE')) {
      const key = this.consume('IDENTIFIER').value;
      this.consume('COLON');
      env.config[key] = this.parseValue();

      if (this.check('COMMA')) {
        this.advance();
      }
    }

    this.consume('RBRACE');
    return env;
  }

  parseBlock() {
    this.consume('LBRACE');
    const block = {};

    while (!this.check('RBRACE')) {
      // 允许关键字作为属性名（如 version, description 等）
      const token = this.peek();
      if (token.type === 'IDENTIFIER' || this.isKeyword(token.type)) {
        const key = token.value;
        this.advance();
        this.consume('COLON');

        if (this.check('LBRACE')) {
          block[key] = this.parseBlock();
        } else {
          block[key] = this.parseValue();
        }

        if (this.check('COMMA')) {
          this.advance();
        }
      } else {
        throw new Error(`Expected property name but found ${token.type} at line ${token.line}, column ${token.column}`);
      }
    }

    this.consume('RBRACE');
    return block;
  }

  parseValue() {
    const token = this.peek();

    if (token.type === 'STRING') {
      this.advance();
      return token.value;
    }

    if (token.type === 'NUMBER') {
      this.advance();
      return token.value;
    }

    if (token.type === 'TRUE') {
      this.advance();
      return true;
    }

    if (token.type === 'FALSE') {
      this.advance();
      return false;
    }

    if (token.type === 'IDENTIFIER') {
      // 处理 framework: nextjs@14 这种格式
      let value = token.value;
      this.advance();

      if (this.check('AT')) {
        this.advance();
        const version = this.consume('NUMBER').value;
        value = `${value}@${version}`;
      }

      return value;
    }

    if (token.type === 'LBRACKET') {
      return this.parseArray();
    }

    throw this.error(`Unexpected token: ${token.type}`);
  }

  parseArray() {
    this.consume('LBRACKET');
    const array = [];

    while (!this.check('RBRACKET')) {
      array.push(this.parseValue());

      if (this.check('COMMA')) {
        this.advance();
      }
    }

    this.consume('RBRACKET');
    return array;
  }

  peek() {
    return this.tokens[this.pos];
  }

  advance() {
    if (!this.isEOF()) {
      this.pos++;
    }
    return this.tokens[this.pos - 1];
  }

  check(type) {
    return this.peek().type === type;
  }

  consume(type) {
    if (this.check(type)) {
      return this.advance();
    }
    throw this.error(`Expected ${type} but found ${this.peek().type}`);
  }

  isEOF() {
    return this.peek().type === 'EOF';
  }

  error(message) {
    const token = this.peek();
    return new Error(`${message} at line ${token.line}, column ${token.column}`);
  }
}

// ============================================
// 3. 语义分析器 (Semantic Analyzer)
// ============================================

class SemanticAnalyzer {
  constructor() {
    this.frameworks = {
      nextjs: { runtime: 'node', buildCommand: 'pnpm run build', outputDir: '.next' },
      react: { runtime: 'node', buildCommand: 'npm run build', outputDir: 'build' },
      vue: { runtime: 'node', buildCommand: 'npm run build', outputDir: 'dist' },
      django: { runtime: 'python', buildCommand: 'python manage.py collectstatic', outputDir: 'static' },
      flask: { runtime: 'python', buildCommand: null, outputDir: null }
    };
  }

  analyze(ast) {
    for (const app of ast.apps) {
      this.analyzeApp(app);
    }
    return ast;
  }

  analyzeApp(app) {
    const stack = app.config.stack;

    if (!stack) {
      throw new Error(`App "${app.name}" is missing required field: stack`);
    }

    if (!stack.framework) {
      throw new Error(`App "${app.name}" is missing required field: stack.framework`);
    }

    if (!stack.runtime) {
      throw new Error(`App "${app.name}" is missing required field: stack.runtime`);
    }

    // 检查框架兼容性
    const frameworkName = stack.framework.split('@')[0];
    const framework = this.frameworks[frameworkName];

    if (!framework) {
      throw new Error(`Unknown framework: ${frameworkName}`);
    }

    const runtimeName = stack.runtime.split('@')[0];
    if (framework.runtime !== runtimeName) {
      throw new Error(
        `Incompatible framework and runtime: ${frameworkName} requires ${framework.runtime}, but got ${runtimeName}`
      );
    }
  }
}

// ============================================
// 4. 代码生成器 (Code Generator)
// ============================================

class CodeGenerator {
  constructor(ast) {
    this.ast = ast;
    
    // 环境配置：国内/国际镜像源
    this.environments = {
      china: {
        npm_mirror: 'https://mirrors.cloud.tencent.com/npm',
        apt_mirror: 'mirrors.ustc.edu.cn',
        corepack_registry: 'https://mirrors.cloud.tencent.com/npm'
      },
      global: {
        npm_mirror: 'https://registry.npmjs.org',
        apt_mirror: 'deb.debian.org',
        corepack_registry: ''
      }
    };
  }

  generate() {
    const results = [];

    for (const app of this.ast.apps) {
      // 为每个应用生成国内和国际两套配置
      results.push({
        name: app.name,
        dockerfile: this.generateDockerfile(app, 'china'),
        dockerfileGlobal: this.generateDockerfile(app, 'global'),
        compose: this.generateCompose(app)
      });
    }

    return results;
  }

  generateDockerfile(app, env = 'china') {
    const stack = app.config.stack;
    const framework = stack.framework.split('@')[0];
    const runtimeVersion = stack.runtime.split('@')[1] || '24';
    const envConfig = this.environments[env];

    const frameworkConfig = {
      nextjs: {
        deps: [
          'COPY package*.json pnpm-lock.yaml ./',
          'RUN pnpm install --frozen-lockfile'
        ],
        build: [
          'COPY . .',
          'RUN pnpm run build'
        ],
        run: [
          'COPY --from=builder /app/.next ./.next',
          'COPY --from=builder /app/public ./public',
          'COPY --from=builder /app/package.json ./',
          'EXPOSE 3000',
          'CMD ["npm", "start"]'
        ]
      },
      react: {
        deps: [
          'COPY package*.json ./',
          'RUN npm ci'
        ],
        build: [
          'COPY . .',
          'RUN npm run build'
        ],
        run: [
          'COPY --from=builder /app/build ./build',
          'EXPOSE 80',
          'CMD ["npx", "serve", "-s", "build"]'
        ]
      }
    };

    const config = frameworkConfig[framework] || frameworkConfig.react;

    // 生成环境特定的镜像源配置
    const mirrorSetup = env === 'china' ? `# 国内镜像源配置
RUN sed -i 's/deb.debian.org/${envConfig.apt_mirror}/g' /etc/apt/sources.list.d/debian.sources
ENV COREPACK_REGISTRY=${envConfig.corepack_registry}
ENV NPM_CONFIG_REGISTRY=${envConfig.npm_mirror}
` : '';

    return `# Auto-generated Dockerfile
# Generated by LionetRides DSL Compiler
# App: ${app.name}
# Environment: ${env}

FROM node:${runtimeVersion}-bookworm-slim AS deps
WORKDIR /app
${mirrorSetup}${config.deps.join('\n')}

FROM node:${runtimeVersion}-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
${config.build.join('\n')}

FROM node:${runtimeVersion}-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV production
${config.run.join('\n')}
`;
  }

  generateCompose(app) {
    const port = app.config.deploy?.port || 3000;

    return `# Auto-generated docker-compose.yml
# Generated by LionetRides DSL Compiler
# App: ${app.name}

version: '3.8'

services:
  ${app.name}:
    build: .
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=production
`;
  }
}

// ============================================
// 主程序
// ============================================

function compile(source) {
  console.log('🔍 Lexical analysis...');
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();

  console.log('📝 Parsing...');
  const parser = new Parser(tokens);
  const ast = parser.parse();

  console.log('🔬 Semantic analysis...');
  const analyzer = new SemanticAnalyzer();
  const analyzedAst = analyzer.analyze(ast);

  console.log('⚙️  Code generation...');
  const generator = new CodeGenerator(analyzedAst);
  const results = generator.generate();

  return results;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node dsl-compiler.js <input.dsl>');
    process.exit(1);
  }

  const inputFile = args[0];
  const source = fs.readFileSync(inputFile, 'utf-8');

  try {
    const results = compile(source);

    for (const result of results) {
      console.log(`\n✅ Generated for app: ${result.name}`);
      
      // 生成国内版本
      const dockerfileCN = `Dockerfile.${result.name}.cn`;
      fs.writeFileSync(dockerfileCN, result.dockerfile);
      console.log(`   📄 ${dockerfileCN} (国内镜像源)`);

      // 生成国际版本
      const dockerfileGlobal = `Dockerfile.${result.name}.global`;
      fs.writeFileSync(dockerfileGlobal, result.dockerfileGlobal);
      console.log(`   📄 ${dockerfileGlobal} (国际镜像源)`);

      const compose = `docker-compose.${result.name}.yml`;
      fs.writeFileSync(compose, result.compose);
      console.log(`   📄 ${compose}`);
    }

    console.log('\n✨ Compilation successful!');
  } catch (error) {
    console.error('\n❌ Compilation failed:');
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { compile, Lexer, Parser, SemanticAnalyzer, CodeGenerator };
