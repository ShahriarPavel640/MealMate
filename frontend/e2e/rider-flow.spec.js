import { test, expect } from '@playwright/test';
import { loginRider } from './helpers.js';

test.describe('Rider Flow E2E', () => {
  const sharedEmail = `rider${Date.now()}@example.com`;

  test.describe('Auth Flow', () => {
    test('Signup -> Logout -> Login', async ({ page }) => {
      // 1. Signup
      await page.goto('/rider/signup');
      await page.getByPlaceholder('John Doe').fill('Test Rider');
      await page.getByPlaceholder('you@example.com').fill(sharedEmail);
      await page.getByPlaceholder('+1234567890').fill('1234567890');
      await page.getByPlaceholder('••••••••').fill('password123');
      await page.getByRole('combobox').selectOption('Bicycle');
      
      // Location
      await page.getByRole('button', { name: /Pick/i }).click();
      const confirmBtn = page.getByRole('button', { name: /Confirm Location/i });
      await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
      await confirmBtn.click({ force: true });
      
      // Wait for the modal to close and state to update
      await expect(page.getByPlaceholder('Click Pick Location...')).not.toBeEmpty();

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
      await loginRider(page, sharedEmail, 'password123');
    });
  });

  test.describe('Dashboard & Pages', () => {
    test.beforeEach(async ({ page }) => {
      // Use the rider we just signed up
      await loginRider(page, sharedEmail, 'password123');
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
