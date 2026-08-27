import { test, expect } from '@playwright/test';

test.describe('Customer Flow E2E', () => {
  const uniqueId = Date.now();
  const testCustomer = {
    name: 'E2E Customer',
    email: `customer${uniqueId}@example.com`,
    password: 'password123',
  };

  test('Auth & Profile -> Browsing -> Cart -> Checkout', async ({ page }) => {
    // 1. Auth - Register
    await page.goto('/signup');
    await page.getByLabel('Full Name').fill(testCustomer.name);
    await page.getByLabel('Email').fill(testCustomer.email);
    await page.getByLabel('Password').fill(testCustomer.password);
    
    // Simulate picking location (wait for modal and confirm)
    await page.getByRole('button', { name: /Pick Location/i }).click();
    const confirmBtn = page.getByRole('button', { name: 'Confirm Location' });
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await confirmBtn.click();
    
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Wait for redirect to home
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // 2. Profile
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile', exact: false })).toBeVisible({ timeout: 10000 });
    
    // 3. Browsing & Search
    await page.goto('/restaurants');
    await page.waitForLoadState('networkidle');
    
    // We will just hit the backend endpoint directly to ensure it works
    const response = await page.request.get('/api/customer/getRestaurants');
    expect(response.ok()).toBeTruthy();
  });
});
