import { expect } from '@playwright/test';

export async function loginCustomer(page, email, password) {
  if (!page.url().includes('/login')) {
    await page.goto('/login');
  }
  await page.getByPlaceholder('name@company.com').fill(email);
  await page.getByPlaceholder('********').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
}

export async function loginRestaurant(page, email, password) {
  if (!page.url().includes('/partner')) {
    await page.goto('/partner');
  }
  await page.locator('input#email').first().fill(email);
  await page.locator('input#password').first().fill(password);
  await page.getByRole('button', { name: /Sign In|Login/i }).first().click();
  // We can verify success if the dashboard loads
  await expect(page.getByText('Recent Orders').first()).toBeVisible({ timeout: 10000 });
}

export async function loginRider(page, email, password) {
  if (!page.url().includes('/rider/login')) {
    await page.goto('/rider/login');
  }
  await page.getByPlaceholder('name@company.com').fill(email);
  await page.getByPlaceholder('********').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
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
