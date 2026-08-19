import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import pool from '../db.js';

describe('Rider API E2E - Stats & Dashboard', () => {
  let riderCookies;
  let riderId;
  const uniqueId = Date.now();
  const testRider = {
    name: 'Test Rider Stats',
    email: `rider-stats-${uniqueId}@test.com`,
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

  it('should fetch rider dashboard data', async () => {
    const res = await request(app)
      .get('/api/rider/data/dashboard')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
  });

  it('should fetch rider earnings', async () => {
    const res = await request(app)
      .get('/api/rider/data/earnings')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
  });
});
