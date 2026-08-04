import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Use the existing Chromium installation
const existingChromium = [
  '/root/.cache/ms-playwright/chromium_headless_shell-1161/chrome-headless-shell-linux64/chrome-headless-shell',
  '/root/.cache/ms-playwright/chromium_headless_shell-1148/chrome-headless-shell-linux64/chrome-headless-shell',
  '/root/.cache/ms-playwright/chromium-1161/chrome-linux/chrome',
  '/root/.cache/ms-playwright/chromium-1148/chrome-linux/chrome',
].find(p => fs.existsSync(p));

const chromiumArgs = existingChromium ? {
  launchOptions: { executablePath: existingChromium },
} : {};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e-report' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...chromiumArgs,
      },
    },
  ],
});