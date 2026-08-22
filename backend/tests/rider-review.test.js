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
describe('Rider API E2E - Reviews', () => {
  let riderCookies;
  let riderId;
  const uniqueId = Date.now();
  const testRider = {
    name: 'Test Rider Reviews',
    email: `rider-reviews-${uniqueId}@test.com`,
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

  it('should retrieve rider reviews', async () => {
    const res = await request(app)
      .get('/api/rider/data/reviews')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
  });
});
