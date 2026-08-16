import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import pool from '../db.js';

describe('Customer API E2E', () => {
  let customerCookies;
  let cartItemId;
  let createdOrderId;
  let testTranId;
  const testCustomer = {
    name: 'Test Customer',
    email: 'customer@test.com',
    password: 'password123',
    phone_number: '1234567890',
    latitude: 23.8103,
    longitude: 90.4125
  };

  afterAll(async () => {
    await pool.end();
  });

  // --- Auth & Profile ---
  it('should register a new customer', async () => {
    const res = await request(app)
      .post('/api/customer/register')
      .send(testCustomer);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('email', testCustomer.email);
    expect(res.body).toHaveProperty('user_id');
  });

  it('should login the customer and get a token', async () => {
    const res = await request(app)
      .post('/api/customer/login')
      .send({
        email: testCustomer.email,
        password: testCustomer.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    customerCookies = res.headers['set-cookie'];
  });

  it('should verify the customer status', async () => {
    const res = await request(app)
      .get('/api/customer/is-verify')
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', testCustomer.email);
  });

  it('should update customer profile', async () => {
    const res = await request(app)
      .put('/api/customer/update_profile')
      .set('Cookie', customerCookies)
      .send({
        name: 'Updated Customer Name',
        phone: '9999999999',
        location: { lat: 23.82, lng: 90.42 },
        address: { street: 'New Street', city: 'Dhaka', postal_code: '1212' }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated Customer Name');
  });

  it('should change customer password', async () => {
    const res = await request(app)
      .put('/api/customer/change_password')
      .set('Cookie', customerCookies)
      .send({
        prevPassword: 'password123',
        newPassword: 'newpassword123'
      });

    expect(res.statusCode).toBe(200);

    // Login with new password to restore token
    const loginRes = await request(app)
      .post('/api/customer/login')
      .send({
        email: testCustomer.email,
        password: 'newpassword123'
      });
    expect(loginRes.statusCode).toBe(200);
    customerCookies = loginRes.headers['set-cookie'];
  });

  // --- Restaurant Browsing ---
  it('should fetch nearby restaurants', async () => {
    const res = await request(app)
      .get('/api/customer/nearby_restaurants')
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get all restaurants', async () => {
    const res = await request(app).get('/api/customer/getRestaurants');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get categories', async () => {
    const res = await request(app).get('/api/customer/getCategories');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get menus', async () => {
    const res = await request(app).get('/api/customer/menus');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
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

  it('should fetch all reviews', async () => {
    const res = await request(app).get('/api/customer/reviews?restaurant_id=1');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should search restaurants by name', async () => {
    const res = await request(app).get('/api/customer/searchRestaurant?name=Black');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // --- Cart Management ---
  it('should add an item to the cart', async () => {
    const res = await request(app)
      .post('/api/customer/add_cart')
      .set('Cookie', customerCookies)
      .send({
        menu_item_id: 1,
        restaurant_id: 1,
        quantity: 2
      });

    expect(res.statusCode).toBe(201);
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

  it('should delete a cart item', async () => {
    const res = await request(app)
      .delete(`/api/customer/cart/${cartItemId}`)
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
  });

  // --- Order Management ---
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
    const orders = Array.isArray(res.body) ? res.body : res.body.data;
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    createdOrderId = orders[0].order_id;
  });

  it('should fetch order details', async () => {
    const res = await request(app)
      .get(`/api/customer/order/${createdOrderId}`)
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // --- Reviews ---
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

  it('should get restaurant reviews', async () => {
    const res = await request(app).get('/api/customer/review/restaurant/1');
    expect(res.statusCode).toBe(200);
  });

  // --- Payment ---
  it('should initiate a payment with SSLCommerz', async () => {
    const res = await request(app)
      .post('/api/customer/payment/initiate')
      .set('Cookie', customerCookies)
      .send({
        cartItems: [
          { menu_item_id: 1, restaurant_id: 1, price: 32.15, quantity: 1 }
        ],
        customerInfo: {
          name: 'Test Customer',
          email: 'customer@test.com',
          phone: '1234567890',
          address: {
            street: '123 Test St',
            city: 'Test City',
            postal_code: '12345'
          }
        },
        total_amount: 32.15,
        paymentMethod: 'sslcommerz'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('paymentUrl');
    
    // Extract transaction ID from the URL query params
    const paymentUrl = res.body.paymentUrl;
    const urlObj = new URL(paymentUrl);
    testTranId = urlObj.searchParams.get('tran_id');
  });

  it('should handle success payment redirect callback', async () => {
    const res = await request(app)
      .post(`/api/customer/payment/success?tran_id=${testTranId}`);
    
    expect(res.statusCode).toBe(302); // Redirect status
  });

  it('should handle fail payment redirect callback', async () => {
    const res = await request(app)
      .post(`/api/customer/payment/fail?tran_id=${testTranId}`);
    
    expect(res.statusCode).toBe(302); // Redirect status
  });

  it('should handle cancel payment redirect callback', async () => {
    const res = await request(app)
      .post(`/api/customer/payment/cancel?tran_id=${testTranId}`);
    
    expect(res.statusCode).toBe(302); // Redirect status
  });

  // --- Logout ---
  it('should logout the customer', async () => {
    const res = await request(app)
      .get('/api/customer/logout')
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
  });
});
