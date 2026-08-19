import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import pool from '../db.js';

describe('Restaurant API E2E - Menu', () => {
  let restaurantCookies;
  let otherRestaurantCookies;
  let restaurantId;
  let otherRestaurantId;
  let categoryId;
  let menuItemId;
  const uniqueId = Date.now();
  const testRestaurant = {
    name: 'Test Restaurant Menu',
    email: `restaurant-menu-${uniqueId}@test.com`,
    password: 'password123',
    phone_number: `0199${uniqueId}`.slice(0, 11),
    street: '123 Test St',
    city: 'Test City',
    postal_code: '12345',
    latitude: 23.8,
    longitude: 90.4
  };

  const otherRestaurant = {
    name: 'Other Restaurant Menu',
    email: `other-restaurant-menu-${uniqueId}@test.com`,
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
    // Cleanup items, categories, then users
    if (menuItemId) await pool.query('DELETE FROM menu_items WHERE menu_item_id = $1', [menuItemId]);
    if (categoryId) await pool.query('DELETE FROM menu_categories WHERE category_id = $1', [categoryId]);
    if (restaurantId) await pool.query('DELETE FROM users WHERE user_id = $1', [restaurantId]);
    if (otherRestaurantId) await pool.query('DELETE FROM users WHERE user_id = $1', [otherRestaurantId]);
  });

  it('should create a menu category', async () => {
    const res = await request(app)
      .post(`/api/menu/restaurants/${restaurantId}/categories`)
      .set('Cookie', restaurantCookies)
      .send({ category_name: 'Test Category' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('category');
    categoryId = res.body.category.category_id;
  });

  it('should prevent unauthorized restaurant from updating category (IDOR protection)', async () => {
    const res = await request(app)
      .put(`/api/menu/categories/${categoryId}`)
      .set('Cookie', otherRestaurantCookies)
      .send({ category_name: 'Hacked Category' });

    expect(res.statusCode).toBe(403);
  });

  it('should update a menu category', async () => {
    const res = await request(app)
      .put(`/api/menu/categories/${categoryId}`)
      .set('Cookie', restaurantCookies)
      .send({ category_name: 'Updated Test Category' });

    expect(res.statusCode).toBe(200);
  });

  it('should prevent unauthorized restaurant from adding item to foreign category (IDOR protection)', async () => {
    const res = await request(app)
      .post(`/api/menu/categories/${categoryId}/items`)
      .set('Cookie', otherRestaurantCookies)
      .send({
        name: 'Hacked Item',
        description: 'Should fail',
        price: 99.99
      });

    expect(res.statusCode).toBe(403);
  });

  it('should add a menu item to a category', async () => {
    const res = await request(app)
      .post(`/api/menu/categories/${categoryId}/items`)
      .set('Cookie', restaurantCookies)
      .send({
        name: 'Test Item',
        description: 'Delicious test item',
        price: 15.99
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('item');
    menuItemId = res.body.item.menu_item_id;
  });

  it('should prevent unauthorized restaurant from updating foreign menu item (IDOR protection)', async () => {
    const res = await request(app)
      .put(`/api/menu/menu-items/${menuItemId}`)
      .set('Cookie', otherRestaurantCookies)
      .send({
        name: 'Hacked Item Update',
        description: 'Should fail',
        price: 1.00,
        isAvailable: false
      });

    expect(res.statusCode).toBe(403);
  });

  it('should update menu item details', async () => {
    const res = await request(app)
      .put(`/api/menu/menu-items/${menuItemId}`)
      .set('Cookie', restaurantCookies)
      .send({
        name: 'Updated Test Item',
        description: 'Even more delicious',
        price: 18.99,
        isAvailable: false
      });

    expect(res.statusCode).toBe(200);
  });

  it('should change menu item availability', async () => {
    const res = await request(app)
      .put(`/api/restaurant/change_availablity/${menuItemId}`)
      .set('Cookie', restaurantCookies)
      .send({ status: true });

    expect(res.statusCode).toBe(200);
  });

  it('should fetch menu items and categories', async () => {
    const itemsRes = await request(app)
      .get('/api/restaurant/get_menu_items')
      .set('Cookie', restaurantCookies);
    expect(itemsRes.statusCode).toBe(200);

    const catsRes = await request(app)
      .get('/api/restaurant/get_menu_categories')
      .set('Cookie', restaurantCookies);
    expect(catsRes.statusCode).toBe(200);
  });

  it('should prevent unauthorized restaurant from deleting foreign menu item (IDOR protection)', async () => {
    const res = await request(app)
      .delete(`/api/menu/menu-items/${menuItemId}`)
      .set('Cookie', otherRestaurantCookies);

    expect(res.statusCode).toBe(403);
  });

  it('should delete a menu item', async () => {
    const res = await request(app)
      .delete(`/api/menu/menu-items/${menuItemId}`)
      .set('Cookie', restaurantCookies);

    expect(res.statusCode).toBe(200);
  });

  it('should prevent unauthorized restaurant from deleting foreign category (IDOR protection)', async () => {
    const res = await request(app)
      .delete(`/api/menu/categories/${categoryId}`)
      .set('Cookie', otherRestaurantCookies);

    expect(res.statusCode).toBe(403);
  });

  it('should delete a menu category', async () => {
    const res = await request(app)
      .delete(`/api/menu/categories/${categoryId}`)
      .set('Cookie', restaurantCookies);

    expect(res.statusCode).toBe(200);
  });
});
