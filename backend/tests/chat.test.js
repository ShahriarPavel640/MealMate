import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import pool from '../db.js';

describe('Chat API E2E', () => {
  let customerCookies;
  let orderId;
  const testCustomer = {
    name: 'Chat Test Customer',
    email: 'chatcustomer@test.com',
    password: 'password123',
    phone_number: '5555555555',
    latitude: 23.8103,
    longitude: 90.4125
  };

  afterAll(async () => {
    await pool.end();
  });

  it('should setup customer and create an order', async () => {
    // 1. Register customer
    await request(app).post('/api/customer/register').send(testCustomer);

    // 2. Login customer
    const loginRes = await request(app).post('/api/customer/login').send({
      email: testCustomer.email,
      password: testCustomer.password
    });
    customerCookies = loginRes.headers['set-cookie'];

    // 3. Create a COD order to generate a valid orderId
    const orderRes = await request(app)
      .post('/api/customer/order/create')
      .set('Cookie', customerCookies)
      .send({
        cartItems: [
          { menu_item_id: 1, restaurant_id: 1, price: 32.15, quantity: 1 }
        ]
      });
    expect(orderRes.statusCode).toBe(201);

    // 4. Fetch orders to get the orderId
    const getOrdersRes = await request(app)
      .get('/api/customer/order')
      .set('Cookie', customerCookies);
    
    expect(getOrdersRes.statusCode).toBe(200);
    const orders = Array.isArray(getOrdersRes.body) ? getOrdersRes.body : getOrdersRes.body.data;
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
    orderId = orders[0].order_id;
    // Manually assign rider 4 to the order in the database so that chat participants can be initialized without NULL constraint error
    await pool.query("UPDATE orders SET rider_id = 4 WHERE order_id = $1", [orderId]);
  });

  it('should send a chat message for an order', async () => {
    const res = await request(app)
      .post(`/api/chat/${orderId}`)
      .set('Cookie', customerCookies)
      .send({ message: 'Hello, is my food on the way?' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Hello, is my food on the way?');
    expect(res.body).toHaveProperty('sender_name', testCustomer.name);
  });

  it('should fetch messages for an order', async () => {
    const res = await request(app)
      .get(`/api/chat/${orderId}`)
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('messages');
    expect(res.body.messages.length).toBeGreaterThan(0);
  });

  it('should fetch all conversations for the user', async () => {
    const res = await request(app)
      .get('/api/chat')
      .set('Cookie', customerCookies);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
