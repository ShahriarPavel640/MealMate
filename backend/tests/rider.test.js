import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import pool from '../db.js';

describe('Rider API E2E', () => {
  let riderCookies;
  let riderId;
  const testRider = {
    name: 'Test Rider',
    email: 'rider@test.com',
    password: 'password123',
    phone_number: '1122334455',
    latitude: 23.8,
    longitude: 90.4
  };

  afterAll(async () => {
    await pool.end();
  });

  // --- Auth ---
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

  // --- Dashboard & Operational Data ---
  it('should update rider profile', async () => {
    const res = await request(app)
      .put('/api/rider/data/profile')
      .set('Cookie', riderCookies)
      .send({
        name: 'Updated Rider Name',
        phone_number: '7777777777',
        vehicle_type: 'bicycle',
        longitude: 90.41,
        latitude: 23.81
      });

    expect(res.statusCode).toBe(200);
  });

  it('should get rider profile', async () => {
    const res = await request(app)
      .get('/api/rider/data/profile')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated Rider Name');
  });

  it('should update rider availability', async () => {
    const res = await request(app)
      .put('/api/rider/data/availability')
      .set('Cookie', riderCookies)
      .send({ is_available: true });

    expect(res.statusCode).toBe(200);
  });

  it('should fetch rider dashboard data', async () => {
    const res = await request(app)
      .get('/api/rider/data/dashboard')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('availableOrders');
  });

  it('should fetch rider delivery history', async () => {
    const res = await request(app)
      .get('/api/rider/data/history')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should fetch rider earnings', async () => {
    const res = await request(app)
      .get('/api/rider/data/earnings')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('weekly');
  });

  // --- Order Operations ---
  it('should accept an order and update its status', async () => {
    // 1. Manually transition order 2 to 'ready_for_pickup' in the database first
    await pool.query("UPDATE orders SET status = 'ready_for_pickup' WHERE order_id = 2");
    await pool.query("UPDATE deliveries SET status = 'pending' WHERE order_id = 2");

    // 2. Accept the order
    const acceptRes = await request(app)
      .put('/api/rider/data/orders/2/accept')
      .set('Cookie', riderCookies);

    expect(acceptRes.statusCode).toBe(200);

    // 3. Update order status to 'delivered'
    const statusRes = await request(app)
      .put('/api/rider/data/orders/2/status')
      .set('Cookie', riderCookies)
      .send({ status: 'delivered' });

    expect(statusRes.statusCode).toBe(200);
  });

  it('should get order details', async () => {
    const res = await request(app)
      .get('/api/rider/data/orders/2')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
  });

  // --- Reviews ---
  it('should retrieve rider reviews', async () => {
    const res = await request(app)
      .get('/api/customer/review/my-reviews')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('reviews');
    expect(Array.isArray(res.body.reviews)).toBe(true);
  });

  // --- Logout ---
  it('should logout the rider', async () => {
    const res = await request(app)
      .post('/api/rider/logout')
      .set('Cookie', riderCookies);

    expect(res.statusCode).toBe(200);
  });
});
