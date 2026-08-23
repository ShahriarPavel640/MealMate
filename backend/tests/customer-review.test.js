import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import prisma from '../prismaClient.js';
describe('Customer API - Review Management', () => {
  let customerCookies;
  let createdOrderId;

  const testCustomer = {
    name: 'Review Test Customer',
    email: 'review-customer@test.com',
    password: 'password123',
    phone_number: '1234567895',
    latitude: 23.8103,
    longitude: 90.4125
  };

  beforeAll(async () => {
    // 1. Register and Login
    await request(app).post('/api/customer/register').send(testCustomer);
    const loginRes = await request(app).post('/api/customer/login').send({
      email: testCustomer.email,
      password: testCustomer.password
    });
    customerCookies = loginRes.headers['set-cookie'];

    // 2. Add to cart
    await request(app).post('/api/customer/add_cart').set('Cookie', customerCookies).send({
      menu_item_id: 1, restaurant_id: 1, quantity: 1
    });

    // 3. Create order
    await request(app).post('/api/customer/order/create').set('Cookie', customerCookies).send({
      cartItems: [{ menu_item_id: 1, restaurant_id: 1, price: 32.15, quantity: 1 }]
    });

    // 4. Fetch order to get ID
    const orderRes = await request(app).get('/api/customer/order').set('Cookie', customerCookies);
    const ordersList = Array.isArray(orderRes.body) ? orderRes.body : (orderRes.body.data || orderRes.body.orders || []);
    createdOrderId = ordersList[0].order_id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- Happy Paths ---
  it('should submit a restaurant review', async () => {
    const res = await request(app)
      .post('/api/customer/review/restaurant')
      .set('Cookie', customerCookies)
      .send({
        restaurantId: 1,
        orderId: createdOrderId,
        rating: 4.5,
        comment: 'Great burger!'
      });

    expect(res.statusCode).toBe(201);
  });

  it('should submit a rider review', async () => {
    const res = await request(app)
      .post('/api/customer/review/rider')
      .set('Cookie', customerCookies)
      .send({
        riderId: 4, // Seed rider user ID
        orderId: createdOrderId,
        rating: 5.0,
        comment: 'Super fast delivery!'
      });

    expect(res.statusCode).toBe(201);
  });

  it('should fetch all reviews', async () => {
    const res = await request(app).get('/api/customer/reviews?restaurant_id=1');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  it('should get restaurant reviews', async () => {
    const res = await request(app).get('/api/customer/review/restaurant/1');
    expect(res.statusCode).toBe(200);
  });

  // --- Edge Cases / Negative Tests ---
  it('should fail to submit review with invalid rating', async () => {
    const res = await request(app)
      .post('/api/customer/review/restaurant')
      .set('Cookie', customerCookies)
      .send({
        restaurantId: 1,
        orderId: createdOrderId,
        rating: 6.0, // Invalid, should be 1-5
        comment: 'Too good!'
      });

    expect(res.statusCode).toBe(400);
  });

  it('should fail to submit review for order not belonging to customer', async () => {
    const hacker = { ...testCustomer, email: 'hacker-review@test.com' };
    await request(app).post('/api/customer/register').send(hacker);
    const loginRes = await request(app).post('/api/customer/login').send({
      email: hacker.email,
      password: hacker.password
    });
    const hackerCookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/customer/review/restaurant')
      .set('Cookie', hackerCookies)
      .send({
        restaurantId: 1,
        orderId: createdOrderId,
        rating: 4.0,
        comment: 'Fake review'
      });

    expect([403, 404]).toContain(res.statusCode);
  });
});
