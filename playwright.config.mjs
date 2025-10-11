import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'https://www.filson.com',
    headless: false,
    viewport: { width: 1366, height: 900 }, // desktop so mega menu is hoverable
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  reporter: [['list']],
});