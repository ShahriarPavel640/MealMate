import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import pool from '../db.js';

describe('Restaurant API E2E - Orders', () => {
  let restaurantCookies;
  let restaurantId;
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

  beforeAll(async () => {
    const res = await request(app).post('/api/restaurant/register').send(testRestaurant);
    restaurantId = res.body.restaurant_id;

    const loginRes = await request(app).post('/api/restaurant/login').send({
      email: testRestaurant.email,
      password: testRestaurant.password
    });
    restaurantCookies = loginRes.headers['set-cookie'];
  });

  afterAll(async () => {
    if (restaurantId) await pool.query('DELETE FROM users WHERE user_id = $1', [restaurantId]);
  });

  it('should fetch orders', async () => {
    const recentRes = await request(app)
      .get('/api/restaurant/recent_orders')
      .set('Cookie', restaurantCookies);
    expect(recentRes.statusCode).toBe(200);

    const allRes = await request(app)
      .get('/api/restaurant/all_orders')
      .set('Cookie', restaurantCookies);
    expect(allRes.statusCode).toBe(200);
  });

  it('should update order status', async () => {
    // Manually assign order 1 to this restaurant so it is authorized to update status
    await pool.query("UPDATE orders SET restaurant_id = $1 WHERE order_id = 1", [restaurantId]);

    const res = await request(app)
      .put('/api/restaurant/orders/1/status')
      .set('Cookie', restaurantCookies)
      .send({ status: 'preparing' });

    expect(res.statusCode).toBe(200);

    const updateRes = await request(app)
      .put('/api/restaurant/update_order_status')
      .set('Cookie', restaurantCookies)
      .send({ order_id: '1', new_status: 'preparing' });

    expect(updateRes.statusCode).toBe(200);
  });
});
