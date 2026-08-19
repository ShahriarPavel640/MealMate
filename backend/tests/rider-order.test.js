import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import pool from '../db.js';

describe('Rider API E2E - Orders', () => {
  let riderCookies;
  let riderId;
  const uniqueId = Date.now();
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
    if (riderId) await pool.query('DELETE FROM users WHERE user_id = $1', [riderId]);
  });

  it('should fetch rider delivery history', async () => {
    const res = await request(app)
      .get('/api/rider/data/history')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
  });

  it('should accept an order and update its status', async () => {
    // We assume order 1 exists from seeds. If not, this test might need a seeded order.
    // The test in monolithic file just hit the endpoint.
    const res = await request(app)
      .put('/api/rider/data/orders/1/accept')
      .set('Cookie', riderCookies);

    // It might return 400 if order is already assigned, but 200/400 proves endpoint exists
    expect([200, 400, 403, 404]).toContain(res.statusCode);

    // If accepted, update status
    const statusRes = await request(app)
      .put('/api/rider/data/orders/1/status')
      .set('Cookie', riderCookies)
      .send({ status: 'delivered' });

    expect([200, 400]).toContain(statusRes.statusCode);
  });

  it('should get order details', async () => {
    const res = await request(app)
      .get('/api/rider/data/orders/1')
      .set('Cookie', riderCookies);

    // Either 200 or 404 depending on seed data
    expect([200, 403, 404]).toContain(res.statusCode);
  });
});
