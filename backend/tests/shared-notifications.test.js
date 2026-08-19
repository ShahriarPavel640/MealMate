import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index.js';
import prisma from '../prismaClient.js';

let customerCookies;
let userId;

beforeAll(async () => {
  const email = 'notif_user_test_2@example.com';
  await request(app).post('/api/customer/register').send({
    name: 'Notif User',
    email: email,
    password: 'password123',
    phone: '1234567890'
  });

  const loginRes = await request(app).post('/api/customer/login').send({
    email: email,
    password: 'password123'
  });
  
  customerCookies = loginRes.headers['set-cookie'];

  const user = await prisma.users.findFirst({ where: { email: email } });
  userId = user.user_id;

  await prisma.notifications.create({
    data: {
      target_id: userId,
      target_type: 'user',
      message: 'Welcome to MealMate',
      is_read: false
    }
  });
});

afterAll(async () => {
  if(userId) {
    await prisma.notifications.deleteMany({
      where: { target_id: userId }
    });
  }
});

describe('Shared API - Notifications', () => {
  it('should get notifications with pagination', async () => {
    const res = await request(app)
      .get('/api/notifications?limit=10&offset=0')
      .set('Cookie', customerCookies);

    console.log(res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const notif = res.body.find(n => n.message === 'Welcome to MealMate');
    expect(notif).toBeDefined();
    expect(notif.is_read).toBe(false);
  });

  it('should mark notifications as read', async () => {
    const res = await request(app)
      .put('/api/notifications/mark-read')
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Notifications marked as read');

    const verifyRes = await request(app)
      .get('/api/notifications')
      .set('Cookie', customerCookies);
    const notif = verifyRes.body.find(n => n.message === 'Welcome to MealMate');
    expect(notif.is_read).toBe(true);
  });
});
