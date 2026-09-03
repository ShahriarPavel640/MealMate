import { test, expect } from '@playwright/test';

test.describe('Navigation Guards E2E', () => {
  // Ensure we start unauthenticated
  test.use({ storageState: { cookies: [], origins: [] } });

  test.describe('Customer Routes', () => {
    test('Unauthenticated user is redirected from /profile to /login', async ({ page }) => {
      await page.goto('/profile');
      await expect(page).toHaveURL(/.*login/);
    });

    test('Unauthenticated user is redirected from /checkout', async ({ page }) => {
      await page.goto('/checkout');
      // Depending on implementation, it might redirect to /login or /
      await expect(page).not.toHaveURL(/.*checkout/);
    });
  });

  test.describe('Restaurant Routes', () => {
    test('/partner shows login form for unauthenticated user', async ({ page }) => {
      await page.goto('/partner');
      // Verify login form is visible
      await expect(page.getByRole('heading', { name: /Welcome Back/i }).first()).toBeVisible();
      // Verify Dashboard is not visible
      await expect(page.getByText('Restaurant Dashboard', { exact: true })).not.toBeVisible();
    });
  });

  test.describe('Rider Routes', () => {
    test('Unauthenticated user is redirected from /rider to /rider/login', async ({ page }) => {
      await page.goto('/rider');
      await expect(page).toHaveURL(/.*rider\/login/);
    });

    test('Unauthenticated user is redirected from /rider/history to /rider/login', async ({ page }) => {
      await page.goto('/rider/history');
      await expect(page).toHaveURL(/.*rider\/login/);
    });

    test('Unauthenticated user is redirected from /rider/profile to /rider/login', async ({ page }) => {
      await page.goto('/rider/profile');
      await expect(page).toHaveURL(/.*rider\/login/);
    });

    test('Unauthenticated user is redirected from /rider/earnings to /rider/login', async ({ page }) => {
      await page.goto('/rider/earnings');
      await expect(page).toHaveURL(/.*rider\/login/);
    });
  });
});
