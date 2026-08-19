import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import pool from '../db.js';

describe('Customer API - Payment Management', () => {
  let customerCookies;
  let testTranId;

  const testCustomer = {
    name: 'Payment Test Customer',
    email: 'payment-customer@test.com',
    password: 'password123',
    phone_number: '1234567893',
    latitude: 23.8103,
    longitude: 90.4125
  };

  const validPaymentPayload = {
    cartItems: [
      { menu_item_id: 1, restaurant_id: 1, price: 32.15, quantity: 1 }
    ],
    customerInfo: {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '1234567890',
      address: {
        street: '123 Test St',
        city: 'Test City',
        postal_code: '12345'
      }
    },
    total_amount: 32.15,
    paymentMethod: 'sslcommerz'
  };

  beforeAll(async () => {
    await request(app).post('/api/customer/register').send(testCustomer);
    const loginRes = await request(app).post('/api/customer/login').send({
      email: testCustomer.email,
      password: testCustomer.password
    });
    customerCookies = loginRes.headers['set-cookie'];
  });

  afterAll(async () => {
    await pool.end();
  });

  // --- Happy Paths ---
  it('should initiate a payment with SSLCommerz', async () => {
    const res = await request(app)
      .post('/api/customer/payment/initiate')
      .set('Cookie', customerCookies)
      .send(validPaymentPayload);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('paymentUrl');
    
    // Extract transaction ID from the URL query params
    const paymentUrl = res.body.paymentUrl;
    const urlObj = new URL(paymentUrl);
    testTranId = urlObj.searchParams.get('tran_id');
  });

  it('should handle success payment redirect callback', async () => {
    const res = await request(app)
      .post(`/api/customer/payment/success?tran_id=${testTranId}`);
    
    expect(res.statusCode).toBe(302); // Redirect status
  });

  it('should handle fail payment redirect callback', async () => {
    const res = await request(app)
      .post(`/api/customer/payment/fail?tran_id=${testTranId}`);
    
    expect(res.statusCode).toBe(302); // Redirect status
  });

  it('should handle cancel payment redirect callback', async () => {
    const res = await request(app)
      .post(`/api/customer/payment/cancel?tran_id=${testTranId}`);
    
    expect(res.statusCode).toBe(302); // Redirect status
  });

  // --- Edge Cases / Negative Tests ---
  it('should coerce string total_amount to number correctly', async () => {
    const payload = { ...validPaymentPayload, total_amount: "50.00" }; // String total_amount
    const res = await request(app)
      .post('/api/customer/payment/initiate')
      .set('Cookie', customerCookies)
      .send(payload);

    // Zod should coerce it instead of failing
    expect(res.statusCode).toBe(200);
  });

  it('should fail with negative total_amount', async () => {
    const payload = { ...validPaymentPayload, total_amount: -10 };
    const res = await request(app)
      .post('/api/customer/payment/initiate')
      .set('Cookie', customerCookies)
      .send(payload);

    expect(res.statusCode).toBe(400);
  });

  it('should fail without customerInfo', async () => {
    const payload = { ...validPaymentPayload };
    delete payload.customerInfo;

    const res = await request(app)
      .post('/api/customer/payment/initiate')
      .set('Cookie', customerCookies)
      .send(payload);

    expect(res.statusCode).toBe(400);
  });
});
