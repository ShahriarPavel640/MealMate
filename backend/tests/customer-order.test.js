import { describe, it, expect, afterAll, beforeAll } from 'vitest';
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

describe('Customer API - Order Management', () => {
  let customerCookies;
  let createdOrderId;

  const testCustomer = {
    name: 'Order Test Customer',
    email: 'order-customer@test.com',
    password: 'password123',
    phone_number: '1234567892',
    latitude: 23.8103,
    longitude: 90.4125
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
  it('should create an order (COD)', async () => {
    const res = await request(app)
      .post('/api/customer/order/create')
      .set('Cookie', customerCookies)
      .send({
        cartItems: [
          { menu_item_id: 1, restaurant_id: 1, price: 32.15, quantity: 1 }
        ]
      });

    expect(res.statusCode).toBe(201);
  });

  it('should fetch customer orders', async () => {
    const res = await request(app)
      .get('/api/customer/order')
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
    const ordersList = Array.isArray(res.body) ? res.body : (res.body.data || res.body.orders || []);
    expect(Array.isArray(ordersList)).toBe(true);
    expect(ordersList.length).toBeGreaterThan(0);
    createdOrderId = ordersList[0].order_id;
  });

  it('should fetch order details', async () => {
    const res = await request(app)
      .get(`/api/customer/order/${createdOrderId}`)
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  // --- Edge Cases / Negative Tests ---
  it('should fail to create order with empty cart', async () => {
    const res = await request(app)
      .post('/api/customer/order/create')
      .set('Cookie', customerCookies)
      .send({
        cartItems: [] // Empty cart
      });

    expect(res.statusCode).toBe(400);
  });

  it('should fail to create order with malformed cart items', async () => {
    const res = await request(app)
      .post('/api/customer/order/create')
      .set('Cookie', customerCookies)
      .send({
        cartItems: [
          { restaurant_id: 1, quantity: 1 } // missing menu_item_id and price
        ]
      });

    expect(res.statusCode).toBe(400);
  });

  it('should fail to fetch another user order (IDOR)', async () => {
    const hacker = { ...testCustomer, email: 'hacker-order@test.com' };
    await request(app).post('/api/customer/register').send(hacker);
    const loginRes = await request(app).post('/api/customer/login').send({
      email: hacker.email,
      password: hacker.password
    });
    const hackerCookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .get(`/api/customer/order/${createdOrderId}`)
      .set('Cookie', hackerCookies);

    expect([403, 404]).toContain(res.statusCode);
  });
});
