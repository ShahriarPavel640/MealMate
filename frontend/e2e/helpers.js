import { expect } from '@playwright/test';

export async function loginCustomer(page, email, password) {
  if (!page.url().includes('/login')) {
    await page.goto('/login');
  }
  const emailInput = page.locator('input[type="email"], input#email').first();
  const passwordInput = page.locator('input[type="password"], input#password').first();
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /Sign in|Login/i }).first().click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

export async function loginRestaurant(page, email, password) {
  if (!page.url().includes('/partner')) {
    await page.goto('/partner');
  }
  const emailInput = page.locator('input#email, input[type="email"]').first();
  const passwordInput = page.locator('input#password, input[type="password"]').first();
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /Sign In|Login/i }).first().click();
  // Wait for dashboard to load (Recent Orders text)
  await expect(page.getByText('Recent Orders')).toBeVisible({ timeout: 10000 });
}

export async function loginRider(page, email, password) {
  if (!page.url().includes('/rider/login')) {
    await page.goto('/rider/login');
  }
  const emailInput = page.locator('input[type="email"], input#email').first();
  const passwordInput = page.locator('input[type="password"], input#password').first();
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole('button', { name: /Sign in|Login/i }).first().click();
  await expect(page).toHaveURL(/.*rider/, { timeout: 10000 });
}

export async function apiRegisterCustomer(request, { name, email, password, latitude = 23.8103, longitude = 90.4125 }) {
  const apiUrl = process.env.VITE_API_URL || 'http://127.0.0.1:5000';
  const response = await request.post(`${apiUrl}/api/customer/register`, {
    data: { name, email, password, latitude, longitude }
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}
