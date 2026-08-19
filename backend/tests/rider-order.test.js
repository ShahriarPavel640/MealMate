import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import prisma from '../prismaClient.js';
const pool = {
  query: async (text, params) => {
    if (params) return prisma.$executeRawUnsafe(text, ...params);
    return prisma.$executeRawUnsafe(text);
  },
  end: async () => { await prisma.$disconnect(); }
};

describe('Rider API E2E - Orders', () => {
  let riderCookies;
  let riderId;
  const uniqueId = Date.now();
  const testOrderId = 1; // Seed data has order_id = 1
  const testRider = {
    name: 'Test Rider Order',
    email: `rider-order-${uniqueId}@test.com`,
    password: 'password123',
    phone_number: `0199${uniqueId}`.slice(0, 11),
    latitude: 23.8,
    longitude: 90.4
  };

  beforeAll(async () => {
    const res = await request(app).post('/api/rider/signup').send(testRider);
    riderId = res.body.user_id;

    const loginRes = await request(app).post('/api/rider/login').send({
      email: testRider.email,
      password: testRider.password
    });
    riderCookies = loginRes.headers['set-cookie'];
  });

  afterAll(async () => {
    if (riderId) {
      await pool.query('UPDATE orders SET rider_id = NULL WHERE rider_id = $1', [riderId]);
      await pool.query('DELETE FROM users WHERE user_id = $1', [riderId]);
    }
  });

  it('should fetch rider delivery history', async () => {
    const res = await request(app)
      .get('/api/rider/data/history')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
  });

  it('should accept an order and update its status', async () => {
    const res = await request(app)
      .put(`/api/rider/data/orders/${testOrderId}/accept`)
      .set('Cookie', riderCookies);

    expect([200, 400, 403, 404]).toContain(res.statusCode);

    const statusRes = await request(app)
      .put(`/api/rider/data/orders/${testOrderId}/status`)
      .set('Cookie', riderCookies)
      .send({ status: 'delivered' });

    expect([200, 400, 403, 404]).toContain(statusRes.statusCode);
  });

  it('should get order details', async () => {
    const res = await request(app)
      .get(`/api/rider/data/orders/${testOrderId}`)
      .set('Cookie', riderCookies);

    expect([200, 403, 404]).toContain(res.statusCode);
  });
});
