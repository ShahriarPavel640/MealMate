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
describe('Restaurant API E2E - Orders', () => {
  let restaurantCookies;
  let otherRestaurantCookies;
  let restaurantId;
  let otherRestaurantId;
  const uniqueId = Date.now();
  const testRestaurant = {
    name: 'Test Restaurant Order',
    email: `restaurant-order-${uniqueId}@test.com`,
    password: 'password123',
    phone_number: `0199${uniqueId}`.slice(0, 11),
    street: '123 Test St',
    city: 'Test City',
    postal_code: '12345',
    latitude: 23.8,
    longitude: 90.4
  };

  const otherRestaurant = {
    name: 'Other Restaurant Order',
    email: `other-restaurant-order-${uniqueId}@test.com`,
    password: 'password123',
    phone_number: `0188${uniqueId}`.slice(0, 11),
    street: '456 Other St',
    city: 'Test City',
    postal_code: '12345',
    latitude: 23.8,
    longitude: 90.4
  };

  beforeAll(async () => {
    const res = await request(app).post('/api/restaurant/register').send(testRestaurant);
    restaurantId = res.body.restaurant_id;

    const loginRes = await request(app).post('/api/restaurant/login').send({
      email: testRestaurant.email,
      password: testRestaurant.password
    });
    restaurantCookies = loginRes.headers['set-cookie'];

    const otherRes = await request(app).post('/api/restaurant/register').send(otherRestaurant);
    otherRestaurantId = otherRes.body.restaurant_id;

    const otherLoginRes = await request(app).post('/api/restaurant/login').send({
      email: otherRestaurant.email,
      password: otherRestaurant.password
    });
    otherRestaurantCookies = otherLoginRes.headers['set-cookie'];
  });

  afterAll(async () => {
    if (restaurantId) await pool.query('DELETE FROM users WHERE user_id = $1', [restaurantId]);
    if (otherRestaurantId) await pool.query('DELETE FROM users WHERE user_id = $1', [otherRestaurantId]);
  });

  it('should fetch orders', async () => {
    const recentRes = await request(app)
      .get('/api/restaurant/recent_orders')
      .set('Cookie', restaurantCookies);
    expect(recentRes.statusCode).toBe(200);
    expect(Array.isArray(recentRes.body)).toBe(true);

    const allRes = await request(app)
      .get('/api/restaurant/all_orders')
      .set('Cookie', restaurantCookies);
    expect(allRes.statusCode).toBe(200);
    expect(allRes.body).toHaveProperty('data');
    expect(allRes.body).toHaveProperty('pagination');

    const ordersRes = await request(app)
      .get('/api/restaurant/orders')
      .set('Cookie', restaurantCookies);
    expect(ordersRes.statusCode).toBe(200);
    expect(ordersRes.body).toHaveProperty('data');
  });

  it('should fetch today stats', async () => {
    const res = await request(app)
      .get('/api/restaurant/today_stat')
      .set('Cookie', restaurantCookies);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should prevent unauthorized restaurant from updating order status (IDOR protection)', async () => {
    await pool.query("UPDATE orders SET restaurant_id = $1, status = 'pending_restaurant_acceptance' WHERE order_id = 1", [restaurantId]);

    const res = await request(app)
      .put('/api/restaurant/orders/1/status')
      .set('Cookie', otherRestaurantCookies)
      .send({ status: 'preparing' });

    expect(res.statusCode).toBe(404);
  });

  it('should update order status', async () => {
    await pool.query("UPDATE orders SET restaurant_id = $1, status = 'pending_restaurant_acceptance' WHERE order_id = 1", [restaurantId]);

    const res = await request(app)
      .put('/api/restaurant/orders/1/status')
      .set('Cookie', restaurantCookies)
      .send({ status: 'preparing' });

    expect(res.statusCode).toBe(200);

    const updateRes = await request(app)
      .put('/api/restaurant/update_order_status')
      .set('Cookie', restaurantCookies)
      .send({ order_id: '#ORD-001', new_status: 'ready_for_pickup' });

    expect(updateRes.statusCode).toBe(200);
  });
});
