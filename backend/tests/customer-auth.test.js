import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import pool from '../db.js';

describe('Customer API - Auth & Profile', () => {
  let customerCookies;
  const testCustomer = {
    name: 'Auth Test Customer',
    email: 'auth-customer@test.com',
    password: 'password123',
    phone_number: '1234567890',
    latitude: 23.8103,
    longitude: 90.4125
  };

  afterAll(async () => {
    await pool.end();
  });

  // --- Happy Paths ---
  it('should register a new customer', async () => {
    const res = await request(app)
      .post('/api/customer/register')
      .send(testCustomer);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('email', testCustomer.email);
    expect(res.body).toHaveProperty('user_id');
  });

  it('should login the customer and get a token', async () => {
    const res = await request(app)
      .post('/api/customer/login')
      .send({
        email: testCustomer.email,
        password: testCustomer.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    customerCookies = res.headers['set-cookie'];
  });

  it('should verify the customer status', async () => {
    const res = await request(app)
      .get('/api/customer/is-verify')
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', testCustomer.email);
  });

  it('should update customer profile', async () => {
    const res = await request(app)
      .put('/api/customer/update_profile')
      .set('Cookie', customerCookies)
      .send({
        name: 'Updated Auth Customer',
        phone: '9999999999',
        location: { lat: 23.82, lng: 90.42 },
        address: { street: 'New Street', city: 'Dhaka', postal_code: '1212' }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated Auth Customer');
  });

  it('should change customer password', async () => {
    const res = await request(app)
      .put('/api/customer/change_password')
      .set('Cookie', customerCookies)
      .send({
        prevPassword: 'password123',
        newPassword: 'newpassword123'
      });

    expect(res.statusCode).toBe(200);

    // Restore token
    const loginRes = await request(app)
      .post('/api/customer/login')
      .send({
        email: testCustomer.email,
        password: 'newpassword123'
      });
    expect(loginRes.statusCode).toBe(200);
    customerCookies = loginRes.headers['set-cookie'];
  });

  it('should logout the customer', async () => {
    const res = await request(app)
      .get('/api/customer/logout')
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
  });

  // --- Edge Cases / Negative Tests ---
  it('should fail to register with missing email', async () => {
    const res = await request(app)
      .post('/api/customer/register')
      .send({
        name: 'Bad Customer',
        password: 'password123',
        phone_number: '1234567890'
      });
    // Zod validation error should return 400
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors[0].path).toContain('email');
  });

  it('should fail to update profile with invalid string coordinates', async () => {
    // Need to login again since we logged out
    const loginRes = await request(app)
      .post('/api/customer/login')
      .send({
        email: testCustomer.email,
        password: 'newpassword123'
      });
    const tempCookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .put('/api/customer/update_profile')
      .set('Cookie', tempCookies)
      .send({
        name: 'Bad Coord Customer',
        location: { lat: 'invalid_lat', lng: 'invalid_lng' }
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('should reject unauthenticated profile update', async () => {
    const res = await request(app)
      .put('/api/customer/update_profile')
      .send({
        name: 'No Token Update'
      });
    // auth middleware should catch it
    expect([401, 403]).toContain(res.statusCode);
  });
});
