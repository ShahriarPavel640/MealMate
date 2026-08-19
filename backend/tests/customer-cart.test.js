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

describe('Customer API - Cart Management', () => {
  let customerCookies;
  let cartItemId;

  const testCustomer = {
    name: 'Cart Test Customer',
    email: 'cart-customer@test.com',
    password: 'password123',
    phone_number: '1234567891',
    latitude: 23.8103,
    longitude: 90.4125
  };

  beforeAll(async () => {
    // Register and login for cart tests
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
  it('should add an item to the cart', async () => {
    const res = await request(app)
      .post('/api/customer/add_cart')
      .set('Cookie', customerCookies)
      .send({
        menu_item_id: 1,
        restaurant_id: 1,
        quantity: 2
      });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('item');
    cartItemId = res.body.item.cart_item_id;
  });

  it('should fetch the active cart items', async () => {
    const res = await request(app)
      .get('/api/customer/cart')
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('cart');
    expect(res.body.cart.length).toBeGreaterThan(0);
  });

  it('should increment quantity when adding duplicate item', async () => {
    const res = await request(app)
      .post('/api/customer/add_cart')
      .set('Cookie', customerCookies)
      .send({
        menu_item_id: 1,
        restaurant_id: 1,
        quantity: 1
      });

    expect([200, 201]).toContain(res.statusCode);
    
    // Verify quantity incremented
    const cartRes = await request(app).get('/api/customer/cart').set('Cookie', customerCookies);
    const item = cartRes.body.cart.find(i => i.menu_item_id === 1);
    expect(item.quantity).toBe(3); // initially 2, added 1
  });

  // --- Edge Cases / Negative Tests ---
  it('should reject adding item with negative quantity', async () => {
    const res = await request(app)
      .post('/api/customer/add_cart')
      .set('Cookie', customerCookies)
      .send({
        menu_item_id: 1,
        restaurant_id: 1,
        quantity: -5
      });

    expect(res.statusCode).toBe(400);
  });

  it('should reject adding item without menu_item_id', async () => {
    const res = await request(app)
      .post('/api/customer/add_cart')
      .set('Cookie', customerCookies)
      .send({
        restaurant_id: 1,
        quantity: 1
      });

    expect(res.statusCode).toBe(400);
  });

  it('should reject unauthenticated cart access', async () => {
    const res = await request(app).get('/api/customer/cart');
    expect([401, 403]).toContain(res.statusCode);
  });

  it('should reject deleting a cart item belonging to another user (IDOR)', async () => {
    // Create another user
    const otherUser = { ...testCustomer, email: 'hacker@test.com' };
    await request(app).post('/api/customer/register').send(otherUser);
    const loginRes = await request(app).post('/api/customer/login').send({
      email: otherUser.email,
      password: otherUser.password
    });
    const hackerCookies = loginRes.headers['set-cookie'];

    // Try to delete original user's cart item
    const res = await request(app)
      .delete(`/api/customer/cart/${cartItemId}`)
      .set('Cookie', hackerCookies);

    expect([403, 404]).toContain(res.statusCode);
  });

  it('should delete a cart item successfully for the owner', async () => {
    const res = await request(app)
      .delete(`/api/customer/cart/${cartItemId}`)
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
  });
});
