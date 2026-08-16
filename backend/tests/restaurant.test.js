import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import pool from '../db.js';

describe('Restaurant API E2E', () => {
  let restaurantCookies;
  let restaurantId;
  let categoryId;
  let menuItemId;
  const testRestaurant = {
    name: 'Test Restaurant',
    email: 'restaurant@test.com',
    password: 'password123',
    phone_number: '0987654321',
    street: '123 Test St',
    city: 'Test City',
    postal_code: '12345',
    latitude: 23.8,
    longitude: 90.4
  };

  afterAll(async () => {
    await pool.end();
  });

  // --- Auth & Profile ---
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

  it('should edit the restaurant profile (with file upload)', async () => {
    const res = await request(app)
      .post('/api/restaurant/edit_profile')
      .set('Cookie', restaurantCookies)
      .attach('image', Buffer.from('dummy image content'), 'test.png')
      .field('restaurant_name', 'Updated Restaurant Name')
      .field('phone', '01999999999')
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

    // Login with new password to restore token
    const loginRes = await request(app)
      .post('/api/restaurant/login')
      .send({
        email: testRestaurant.email,
        password: 'newpassword123'
      });
    expect(loginRes.statusCode).toBe(200);
    restaurantCookies = loginRes.headers['set-cookie'];
  });

  // --- Menu Management (via menuRoute.js and restaurantRoute.js) ---
  it('should create a menu category', async () => {
    const res = await request(app)
      .post(`/api/menu/restaurants/${restaurantId}/categories`)
      .set('Cookie', restaurantCookies)
      .send({ category_name: 'Test Category' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('category');
    categoryId = res.body.category.category_id;
  });

  it('should update a menu category', async () => {
    const res = await request(app)
      .put(`/api/menu/categories/${categoryId}`)
      .set('Cookie', restaurantCookies)
      .send({ category_name: 'Updated Test Category' });

    expect(res.statusCode).toBe(200);
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

  it('should delete a menu item', async () => {
    const res = await request(app)
      .delete(`/api/menu/menu-items/${menuItemId}`)
      .set('Cookie', restaurantCookies);

    expect(res.statusCode).toBe(200);
  });

  it('should delete a menu category', async () => {
    const res = await request(app)
      .delete(`/api/menu/categories/${categoryId}`)
      .set('Cookie', restaurantCookies);

    expect(res.statusCode).toBe(200);
  });

  // --- Orders & Stats & Reviews ---
  it('should fetch orders', async () => {
    const recentRes = await request(app)
      .get('/api/restaurant/recent_orders')
      .set('Cookie', restaurantCookies);
    expect(recentRes.statusCode).toBe(200);

    const allRes = await request(app)
      .get('/api/restaurant/all_orders')
      .set('Cookie', restaurantCookies);
    expect(allRes.statusCode).toBe(200);

    const todayRes = await request(app)
      .get('/api/restaurant/today_stat')
      .set('Cookie', restaurantCookies);
    expect(todayRes.statusCode).toBe(200);
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

  it('should fetch reviews', async () => {
    const allReviewsRes = await request(app)
      .get('/api/restaurant/reviews')
      .set('Cookie', restaurantCookies);
    expect(allReviewsRes.statusCode).toBe(200);

    const menuReviewRes = await request(app)
      .get('/api/restaurant/reviews/menu/1')
      .set('Cookie', restaurantCookies);
    expect(menuReviewRes.statusCode).toBe(200);
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

  // --- Logout ---
  it('should logout the restaurant', async () => {
    const res = await request(app)
      .get('/api/restaurant/logout')
      .set('Cookie', restaurantCookies);

    expect(res.statusCode).toBe(200);
  });
});
