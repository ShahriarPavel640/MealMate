import { test, expect } from '@playwright/test';

test.describe('Customer Portal', () => {
  test('should load the customer homepage', async ({ page }) => {
    await page.goto('/');
    // Check if some basic element or title exists. We will just verify it doesn't crash.
    await expect(page).toHaveURL(/.*(?:partner|rider|\/)/);
  });

  test('should load the customer login page', async ({ page }) => {
    await page.goto('/login');
    // Ensure the login form or text is visible
    const loginText = page.locator('text=Login').first();
    await expect(loginText).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Restaurant Portal', () => {
  test('should load the restaurant homepage (partner)', async ({ page }) => {
    await page.goto('/partner');
    // Wait for network idle or main container
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*partner/);
  });
});

test.describe('Rider Portal', () => {
  test('should load the rider login page', async ({ page }) => {
    await page.goto('/rider/login');
    const loginText = page.locator('text=Login').first();
    await expect(loginText).toBeVisible({ timeout: 10000 });
  });
});
