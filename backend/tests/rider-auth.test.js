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
describe('Rider API E2E - Auth & Profile', () => {
  let riderCookies;
  let riderId;
  const uniqueId = Date.now();
  const testRider = {
    name: 'Test Rider Auth',
    email: `rider-auth-${uniqueId}@test.com`,
    password: 'password123',
    phone_number: `0199${uniqueId}`.slice(0, 11),
    latitude: 23.8,
    longitude: 90.4
  };

  afterAll(async () => {
    if (riderId) await pool.query('DELETE FROM users WHERE user_id = $1', [riderId]);
  });

  it('should register a new rider', async () => {
    const res = await request(app)
      .post('/api/rider/signup')
      .send(testRider);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('email', testRider.email);
    expect(res.body).toHaveProperty('user_id');
    riderId = res.body.user_id;
  });

  it('should login the rider and get a token', async () => {
    const res = await request(app)
      .post('/api/rider/login')
      .send({
        email: testRider.email,
        password: testRider.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    riderCookies = res.headers['set-cookie'];
  });

  it('should verify the rider status', async () => {
    const res = await request(app)
      .get('/api/rider/is-verify')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', testRider.email);
  });

  it('should get rider profile', async () => {
    const res = await request(app)
      .get('/api/rider/data/profile')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
  });

  it('should update rider profile', async () => {
    const res = await request(app)
      .put('/api/rider/data/profile')
      .set('Cookie', riderCookies)
      .send({
        name: 'Updated Rider Name',
        phone_number: `0188${uniqueId}`.slice(0, 11),
        latitude: 23.9,
        longitude: 90.5
      });

    expect(res.statusCode).toBe(200);
  });

  it('should update rider availability', async () => {
    const res = await request(app)
      .put('/api/rider/data/availability')
      .set('Cookie', riderCookies)
      .send({ is_available: false });

    expect(res.statusCode).toBe(200);
  });

  it('should logout the rider', async () => {
    const res = await request(app)
      .post('/api/rider/logout')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
  });
});
