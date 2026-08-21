import { test, expect } from '@playwright/test';

test.describe('Rider API E2E', () => {
  const uniqueId = Date.now();
  const testRider = {
    name: 'API Rider',
    email: `api_rider_${uniqueId}@example.com`,
    password: 'password123',
    phone_number: `01666${uniqueId}`.slice(0, 11),
    vehicle_type: 'bike',
    vehicle_number: 'DHK-1234'
  };

  test('Complete Rider Journey', async ({ request }) => {
    // 1. Register
    const regRes = await request.post('/api/rider/signup', { data: testRider });
    expect(regRes.ok()).toBeTruthy();

    // 2. Login
    const loginRes = await request.post('/api/rider/login', {
      data: { email: testRider.email, password: testRider.password }
    });
    expect(loginRes.ok()).toBeTruthy();
    
    // 3. Check Auth
    const authRes = await request.get('/api/rider/is-verify');
    expect(authRes.ok()).toBeTruthy();

    // 4. Update Profile
    const profileRes = await request.put('/api/rider/data/profile', {
      data: { name: 'API Rider Updated', vehicle_type: 'scooter', vehicle_number: 'XYZ-9999' }
    });
    expect(profileRes.ok()).toBeTruthy();

    // 5. Toggle Availability
    const availRes = await request.put('/api/rider/data/availability', {
      data: { is_available: true }
    });
    expect(availRes.ok()).toBeTruthy();

    // 6. Fetch Orders & Dashboard
    const histRes = await request.get('/api/rider/data/history');
    expect(histRes.ok()).toBeTruthy();
    
    const earnRes = await request.get('/api/rider/data/earnings');
    expect(earnRes.ok()).toBeTruthy();

    const dashRes = await request.get('/api/rider/data/dashboard');
    expect(dashRes.ok()).toBeTruthy();
  });
});
