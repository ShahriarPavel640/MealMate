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
describe('Restaurant API E2E - Stats', () => {
  let restaurantCookies;
  let restaurantId;
  const uniqueId = Date.now();
  const testRestaurant = {
    name: 'Test Restaurant Stats',
    email: `restaurant-stats-${uniqueId}@test.com`,
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
    if (restaurantId) {
      await pool.query('DELETE FROM restaurants WHERE restaurant_id = $1', [restaurantId]);
    }
  });

  it('should fetch today_stat', async () => {
    const res = await request(app)
      .get('/api/restaurant/today_stat')
      .set('Cookie', restaurantCookies);
    expect(res.statusCode).toBe(200);
  });

  it('should fetch stats', async () => {
    const paths = [
      'daily_revenue',
      'monthly_revenue',
      'top_selling_items',
      'category_wise_sell',
      'last_two_week_revenue',
      'last_two_week_order_count',
      'last_two_week_new_customer'
    ];

    for (const path of paths) {
      const res = await request(app)
        .get(`/api/restaurant/stats/${path}`)
        .set('Cookie', restaurantCookies);
      expect(res.statusCode).toBe(200);
    }
  });
});
