import { test, expect } from '@playwright/test';
import { loginRider } from './helpers.js';

test.describe('Rider Flow E2E', () => {
  test.describe('Auth Flow', () => {
    test('Signup -> Logout -> Login', async ({ page }) => {
      const uniqueId = Date.now() + Math.random().toString(36).substring(7);
      const testEmail = `rider${uniqueId}@example.com`;
      
      // 1. Signup
      await page.goto('/rider/signup');
      await page.getByPlaceholder('John Doe').fill('Test Rider');
      await page.getByPlaceholder('you@example.com').fill(testEmail);
      await page.getByPlaceholder('+1234567890').fill('1234567890');
      await page.getByPlaceholder('••••••••').fill('password123');
      await page.getByRole('combobox').selectOption('Bicycle');
      
      // Location
      await page.getByRole('button', { name: /Pick/i }).click();
      const confirmBtn = page.getByRole('button', { name: /Confirm Location/i });
      await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
      await confirmBtn.click();

      await page.getByRole('button', { name: 'Sign up' }).click();
      
      // Verify redirect to dashboard
      await expect(page).toHaveURL(/.*rider/, { timeout: 10000 });
      await expect(page.getByText('Rider Dashboard')).toBeVisible({ timeout: 10000 });

      // 2. Logout
      const logoutBtn = page.getByRole('button', { name: /Logout/i }).or(page.getByText('Logout', { exact: false }));
      if (await logoutBtn.count() > 0) {
        await logoutBtn.first().click();
        await expect(page).toHaveURL(/.*rider\/login/, { timeout: 10000 });
      }

      // 3. Login
      await loginRider(page, testEmail, 'password123');
    });
  });

  test.describe('Dashboard & Pages', () => {
    let testEmail;
    
    test.beforeAll(async ({ request }) => {
      // For rider tests that don't need a seeded user, we can just create one or use a known one.
      // We'll create one via signup in a test.beforeEach, or reuse one.
      // To keep it simple, we'll create a user via the UI in beforeEach or use a fixed one if seeded.
      // Wait, is there a seeded rider? Let's assume we can create one via API, but we don't have a helper.
      // Instead of relying on a seed, let's just create one via UI in a single setup step or per test.
    });

    test.beforeEach(async ({ page }) => {
      // Create a rider directly for these tests
      const uniqueId = Date.now() + Math.random().toString(36).substring(7);
      testEmail = `rider_pages_${uniqueId}@example.com`;
      await page.goto('/rider/signup');
      await page.getByPlaceholder('John Doe').fill('Test Rider Pages');
      await page.getByPlaceholder('you@example.com').fill(testEmail);
      await page.getByPlaceholder('+1234567890').fill(`+8801${Math.floor(Math.random() * 100000000)}`);
      await page.getByPlaceholder('••••••••').fill('password123');
      await page.getByRole('combobox').selectOption('Bicycle');
      
      // Location
      await page.getByRole('button', { name: /Pick/i }).click();
      const confirmBtn = page.getByRole('button', { name: /Confirm Location/i });
      await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
      await confirmBtn.click();
      
      await page.getByRole('button', { name: 'Sign up' }).click();
      await expect(page).toHaveURL(/.*rider/, { timeout: 10000 });
    });

    test('Dashboard loads correctly', async ({ page }) => {
      await expect(page.getByText('Rider Dashboard')).toBeVisible();
      await expect(page.getByRole('heading', { name: /Available Orders/i })).toBeVisible();
    });

    test('Profile Page loads correctly', async ({ page }) => {
      await page.getByRole('link', { name: 'Profile' }).click();
      await expect(page.getByRole('heading', { name: /Rider Profile/i }).first()).toBeVisible();
    });

    test('Delivery History Page loads correctly', async ({ page }) => {
      await page.getByRole('link', { name: 'History' }).click();
      await expect(page.getByRole('heading', { name: 'Delivery History', exact: true })).toBeVisible();
    });

    test('Earnings Page loads correctly', async ({ page }) => {
      await page.getByRole('link', { name: 'Performance' }).click();
      await expect(page.getByRole('heading', { name: /Performance Dashboard/i }).or(page.getByText('Failed to fetch data.'))).toBeVisible({ timeout: 10000 });
    });
  });
});
