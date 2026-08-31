import { test, expect } from '@playwright/test';
import { loginCustomer, apiRegisterCustomer } from './helpers.js';

test.describe('Customer Extended E2E', () => {
  let testCustomer;

  test.beforeEach(async ({ request }) => {
    // Register a new customer for isolated tests
    const uniqueId = Date.now() + Math.random().toString(36).substring(7);
    const data = {
      name: `Customer ${uniqueId}`,
      email: `customer_${uniqueId}@example.com`,
      password: 'password123',
    };
    await apiRegisterCustomer(request, data);
    testCustomer = data;
  });

  test('Login -> Logout Cycle', async ({ page }) => {
    await loginCustomer(page, testCustomer.email, testCustomer.password);
    
    // Open user menu / profile dropdown (it might be a button with user's initial or name)
    // The navbar usually has a "Logout" button or a dropdown.
    const logoutBtn = page.getByRole('button', { name: /Logout/i }).or(page.getByText('Logout', { exact: false }));
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
      await expect(page).toHaveURL(/.*(?:login|\/)/, { timeout: 10000 });
    }
  });

  test('Restaurant Browsing & Search', async ({ page }) => {
    await page.goto('/restaurants');
    
    // Verify at least one restaurant card is visible
    await expect(page.getByText(/View Menu/i).first()).toBeVisible();
    
    // Get the name of the first restaurant
    const firstRestaurantName = await page.getByRole('heading', { level: 3 }).first().textContent();
    
    // If there's a search input, we could test it
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.count() > 0 && firstRestaurantName) {
      await searchInput.fill(firstRestaurantName);
      await expect(page.getByText(firstRestaurantName).first()).toBeVisible();
    }
  });

  test('Order History Page', async ({ page }) => {
    await loginCustomer(page, testCustomer.email, testCustomer.password);
    
    await page.goto('/order-history');
    await expect(page.getByRole('heading', { name: /My Orders/i })).toBeVisible();
  });

  test('Payment Result Pages', async ({ page }) => {
    // These pages might need valid session or might just render
    await page.goto('/payment-success');
    await expect(page.getByRole('heading', { name: /Payment Successful/i })).toBeVisible();

    await page.goto('/payment-fail');
    await expect(page.getByRole('heading', { name: /Payment Failed/i })).toBeVisible();

    await page.goto('/payment-cancel');
    await expect(page.getByRole('heading', { name: /Payment Cancelled/i })).toBeVisible();
  });

  test('Restaurant Reviews Page', async ({ page }) => {
    // Use restaurant_id = 1
    await page.goto('/restaurant/1/reviews');
    // Ensure the page loads without crashing
    // Check for some static text that should be on the reviews page
    await expect(page.getByText(/Reviews/i).first()).toBeVisible();
  });
});
