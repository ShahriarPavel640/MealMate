import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import pool from '../db.js';

describe('Customer API - Restaurant Browsing', () => {
  let customerCookies;

  const testCustomer = {
    name: 'Restaurant Test Customer',
    email: 'restaurant-customer@test.com',
    password: 'password123',
    phone_number: '1234567894',
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
  it('should fetch nearby restaurants', async () => {
    const res = await request(app)
      .get('/api/customer/nearby_restaurants')
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  it('should get all restaurants', async () => {
    const res = await request(app).get('/api/customer/getRestaurants');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  it('should get categories', async () => {
    const res = await request(app).get('/api/customer/getCategories');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  it('should get menus', async () => {
    const res = await request(app).get('/api/customer/menus');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  it('should get single menu item by ID', async () => {
    const res = await request(app).get('/api/customer/menu/1');
    expect(res.statusCode).toBe(200);
  });

  it('should get restaurant by ID', async () => {
    const res = await request(app).get('/api/customer/getRestaurant/1');
    expect(res.statusCode).toBe(200);
  });

  it('should query restaurants by location', async () => {
    const res = await request(app).get('/api/customer/get_restaurant_by_location?latitude=23.8&longitude=90.4');
    expect(res.statusCode).toBe(200);
  });

  it('should search restaurants by name', async () => {
    const res = await request(app).get('/api/customer/searchRestaurant?name=Black');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  // --- Edge Cases / Negative Tests ---
  it('should return 404 for non-existent restaurant', async () => {
    const res = await request(app).get('/api/customer/getRestaurant/999999');
    expect(res.statusCode).toBe(404);
  });

  it('should return 404 for non-existent menu item', async () => {
    const res = await request(app).get('/api/customer/menu/999999');
    expect(res.statusCode).toBe(404);
  });

  it('should apply pagination limits to getRestaurants correctly', async () => {
    const res = await request(app).get('/api/customer/getRestaurants?limit=1');
    expect(res.statusCode).toBe(200);
    const data = res.body.data || res.body;
    expect(data.length).toBeLessThanOrEqual(1);
  });
});
