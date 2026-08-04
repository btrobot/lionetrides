import { Page } from "@playwright/test";
import { test, expect } from '@playwright/test';

// 增加测试超时时间
test.setTimeout(90000);

// ─── 测试数据 ──────────────────────────────────────────
const TEST_USER = {
  name: 'E2E Test User',
  email: `e2e-test-${Date.now()}@example.com`,
  password: 'TestPass123!',
  company: 'Test Corp',
  phone: '13800138000',
};

const ADMIN_USER = {
  email: 'admin@ridex.com',
  password: 'Admin123!',
};

// 辅助函数：等待页面加载完成
async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  // 等待表单元素可见
  await page.waitForSelector('form', { timeout: 10000 }).catch(() => {});
}

// ─── 注册流程 ──────────────────────────────────────────
test.describe('注册流程', () => {
  test('应能成功注册新用户', async ({ page }) => {
    await page.goto('/zh/auth/register', { waitUntil: 'commit', timeout: 30000 });
    await waitForPageReady(page);

    // 填写注册表单
    await page.fill('#name', TEST_USER.name);
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.fill('#confirmPassword', TEST_USER.password);
    await page.fill('#company', TEST_USER.company);
    await page.fill('#phone', TEST_USER.phone);

    // 提交表单
    await page.click('button[type="submit"]');

    // 等待跳转 - 注册成功后跳转到询盘页面
    await page.waitForURL('**/account/inquiries**', { timeout: 15000 });
    expect(page.url()).toContain('/account/inquiries');
  });

  test('密码不一致时应显示错误', async ({ page }) => {
    await page.goto('/zh/auth/register', { waitUntil: 'commit', timeout: 30000 });
    await waitForPageReady(page);

    await page.fill('#name', TEST_USER.name);
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'TestPass123!');
    await page.fill('#confirmPassword', 'DifferentPass!');

    await page.click('button[type="submit"]');

    // 应显示密码不匹配错误
    await expect(page.locator('text=/password|密码/i')).toBeVisible({ timeout: 5000 });
  });

  test('邮箱已存在时应显示错误', async ({ page }) => {
    const existingEmail = `existing-${Date.now()}@example.com`;
    
    // 先注册一次
    await page.goto('/zh/auth/register', { waitUntil: 'commit', timeout: 30000 });
    await waitForPageReady(page);
    await page.fill('#name', 'First User');
    await page.fill('#email', existingEmail);
    await page.fill('#password', 'TestPass123!');
    await page.fill('#confirmPassword', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/account/inquiries**', { timeout: 15000 });

    // 清除登录状态
    await page.goto('/zh/auth/register', { waitUntil: 'commit', timeout: 30000 });
    await page.evaluate(() => localStorage.clear());

    // 再次注册相同邮箱
    await waitForPageReady(page);
    await page.fill('#name', 'Second User');
    await page.fill('#email', existingEmail);
    await page.fill('#password', 'TestPass123!');
    await page.fill('#confirmPassword', 'TestPass123!');
    await page.click('button[type="submit"]');

    // 应显示邮箱已存在错误
    await expect(page.locator('text=/already|已存在|duplicate/i')).toBeVisible({ timeout: 10000 });
  });
});

// ─── 登录流程 ──────────────────────────────────────────
test.describe('登录流程', () => {
  test('应能成功登录已注册用户', async ({ page }) => {
    // 先注册
    await page.goto('/zh/auth/register', { waitUntil: 'commit', timeout: 30000 });
    await waitForPageReady(page);
    await page.fill('#name', 'Login Test User');
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.fill('#confirmPassword', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/account/inquiries**', { timeout: 15000 });

    // 清除登录状态
    await page.evaluate(() => localStorage.clear());

    // 登录
    await page.goto('/zh/auth/login', { waitUntil: 'commit', timeout: 30000 });
    await waitForPageReady(page);
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');

    // 等待跳转 - 普通用户跳转到询盘页面
    await page.waitForURL('**/account/inquiries**', { timeout: 15000 });
    expect(page.url()).toContain('/account/inquiries');
  });

  test('管理员登录应跳转到管理后台', async ({ page }) => {
    await page.goto('/zh/auth/login', { waitUntil: 'commit', timeout: 30000 });
    await waitForPageReady(page);

    await page.fill('#email', ADMIN_USER.email);
    await page.fill('#password', ADMIN_USER.password);
    await page.click('button[type="submit"]');

    // 等待跳转 - 管理员跳转到 admin 页面
    await page.waitForURL('**/admin**', { timeout: 15000 });
    expect(page.url()).toContain('/admin');
  });

  test('错误密码应显示错误信息', async ({ page }) => {
    await page.goto('/zh/auth/login', { waitUntil: 'commit', timeout: 30000 });
    await waitForPageReady(page);

    await page.fill('#email', 'nonexistent@example.com');
    await page.fill('#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // 应显示错误信息
    await expect(page.locator('text=/invalid|错误|失败|Invalid/i')).toBeVisible({ timeout: 10000 });
  });
});

// ─── 登录/注册页面导航 ──────────────────────────────────
test.describe('登录/注册页面导航', () => {
  test('登录页应有注册链接', async ({ page }) => {
    await page.goto('/zh/auth/login', { waitUntil: 'commit', timeout: 30000 });
    await waitForPageReady(page);

    const registerLink = page.locator('a[href*="register"]');
    await expect(registerLink).toBeVisible({ timeout: 5000 });
  });

  test('注册页应有登录链接', async ({ page }) => {
    await page.goto('/zh/auth/register', { waitUntil: 'commit', timeout: 30000 });
    await waitForPageReady(page);

    const loginLink = page.locator('a[href*="login"]');
    await expect(loginLink).toBeVisible({ timeout: 5000 });
  });

  test('未登录访问受保护页面应跳转登录', async ({ page }) => {
    // 先访问注册页清除状态
    await page.goto('/zh/auth/register', { waitUntil: 'commit', timeout: 30000 });
    await page.evaluate(() => localStorage.clear());

    // 访问账户页面
    await page.goto('/zh/account/inquiries', { waitUntil: 'commit', timeout: 30000 });

    // 应被重定向到登录页
    await page.waitForURL('**/auth/login**', { timeout: 15000 });
    expect(page.url()).toContain('/auth/login');
  });
});
