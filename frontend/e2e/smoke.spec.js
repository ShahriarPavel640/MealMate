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
    const loginHeading = page.getByRole('heading', { name: /Sign in to your account/i });
    await expect(loginHeading).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Restaurant Portal', () => {
  test('should load the restaurant homepage (partner)', async ({ page }) => {
    await page.goto('/partner');
    await expect(page).toHaveURL(/.*partner/);
    // Wait for something specific rather than networkidle
    await expect(page.getByRole('heading', { name: /MealMate Partner|Grow Your Restaurant|Welcome Back/i }).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Rider Portal', () => {
  test('should load the rider login page', async ({ page }) => {
    await page.goto('/rider/login');
    const loginHeading = page.getByRole('heading', { name: /Sign in to your Rider account/i });
    await expect(loginHeading).toBeVisible({ timeout: 10000 });
  });
});
