import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import pool from '../db.js';

describe('Restaurant API E2E - Auth & Profile', () => {
  let restaurantCookies;
  let restaurantId;
  const uniqueId = Date.now();
  const testRestaurant = {
    name: 'Test Restaurant Auth',
    email: `restaurant-auth-${uniqueId}@test.com`,
    password: 'password123',
    phone_number: `0199${uniqueId}`.slice(0, 11),
    street: '123 Test St',
    city: 'Test City',
    postal_code: '12345',
    latitude: 23.8,
    longitude: 90.4
  };

  afterAll(async () => {
    // Delete the test restaurant to keep DB clean
    if (restaurantId) {
      await pool.query('DELETE FROM users WHERE user_id = $1', [restaurantId]);
    }
  });

  it('should register a new restaurant', async () => {
    const res = await request(app)
      .post('/api/restaurant/register')
      .send({
        name: testRestaurant.name,
        phone: testRestaurant.phone_number,
        email: testRestaurant.email,
        latitude: testRestaurant.latitude,
        longitude: testRestaurant.longitude,
        password: testRestaurant.password
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('email', testRestaurant.email);
    expect(res.body).toHaveProperty('restaurant_id');
    restaurantId = res.body.restaurant_id;
  });

  it('should login the restaurant and get a token', async () => {
    const res = await request(app)
      .post('/api/restaurant/login')
      .send({
        email: testRestaurant.email,
        password: testRestaurant.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    restaurantCookies = res.headers['set-cookie'];
  });

  it('should verify the restaurant status', async () => {
    const res = await request(app)
      .get('/api/restaurant/is-verify')
      .set('Cookie', restaurantCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', testRestaurant.email);
  });

  it('should get the restaurant profile details', async () => {
    const res = await request(app)
      .get('/api/restaurant/get_restaurant_profile')
      .set('Cookie', restaurantCookies);

    expect(res.statusCode).toBe(200);
  });

  it('should edit the restaurant profile', async () => {
    const res = await request(app)
      .post('/api/restaurant/edit_profile')
      .set('Cookie', restaurantCookies)
      .attach('image', Buffer.from('dummy image content'), 'test.png')
      .field('restaurant_name', 'Updated Restaurant Name')
      .field('phone', `0188${uniqueId}`.slice(0, 11))
      .field('email', testRestaurant.email)
      .field('description', 'Updated description')
      .field('street', 'New St')
      .field('city', 'New City')
      .field('postal_code', '54321')
      .field('latitude', 23.8)
      .field('longitude', 90.4)
      .field('operating_hours', '[]');

    expect(res.statusCode).toBe(200);
  });

  it('should change restaurant password', async () => {
    const res = await request(app)
      .put('/api/restaurant/change_password')
      .set('Cookie', restaurantCookies)
      .send({
        prevPassword: 'password123',
        newPassword: 'newpassword123'
      });

    expect(res.statusCode).toBe(200);

    const loginRes = await request(app)
      .post('/api/restaurant/login')
      .send({
        email: testRestaurant.email,
        password: 'newpassword123'
      });
    expect(loginRes.statusCode).toBe(200);
    restaurantCookies = loginRes.headers['set-cookie'];
  });

  it('should logout the restaurant', async () => {
    const res = await request(app)
      .get('/api/restaurant/logout')
      .set('Cookie', restaurantCookies);

    expect(res.statusCode).toBe(200);
  });
});
