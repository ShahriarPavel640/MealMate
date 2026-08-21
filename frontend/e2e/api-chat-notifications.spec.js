import { test, expect } from '@playwright/test';

test.describe('Chat and Notifications API E2E', () => {
  const uniqueId = Date.now();
  const testCustomer = {
    name: 'Chat Customer',
    email: `chat_cust_${uniqueId}@example.com`,
    password: 'password123',
    phone_number: `01555${uniqueId}`.slice(0, 11),
    latitude: 23.8103,
    longitude: 90.4125
  };

  test('Complete Shared Module Journey', async ({ request }) => {
    // 1. Register and Login to get session
    await request.post('/api/customer/register', { data: testCustomer });
    await request.post('/api/customer/login', {
      data: { email: testCustomer.email, password: testCustomer.password }
    });

    // 2. Fetch Notifications
    const notifRes = await request.get('/api/notifications?limit=10&offset=0');
    expect(notifRes.ok()).toBeTruthy();

    // 3. Mark Notifications as Read
    const markReadRes = await request.put('/api/notifications/mark-read');
    expect(markReadRes.ok()).toBeTruthy();

    // 4. Fetch Conversations
    const convRes = await request.get('/api/chat');
    expect(convRes.ok()).toBeTruthy();
    
    // 5. Check Unread Chat Count
    const countRes = await request.get('/api/chat/unread-count');
    expect(countRes.ok()).toBeTruthy();
    
    // We cannot fully test chat message posting without an orderId with a rider assigned,
    // which requires a complex setup (creating restaurant, item, order, rider, accepting order).
    // The previous tests verify those flows independently. 
    // We verify the endpoints are up and returning 200s or handled errors.
  });
});
