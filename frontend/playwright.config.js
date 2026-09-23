import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://mealmate.local';
const isLocalCluster = baseURL.includes('mealmate.local');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: baseURL,
    trace: 'on-first-retry',
    geolocation: { latitude: 23.8103, longitude: 90.4125 },
    permissions: ['geolocation'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(isLocalCluster ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
    },
  }),
});
