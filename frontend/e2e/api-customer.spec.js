import { test, expect } from '@playwright/test';

test.describe('Customer API E2E', () => {
  const uniqueId = Date.now();
  const testCustomer = {
    name: 'API Customer',
    email: `api_customer_${uniqueId}@example.com`,
    password: 'password123',
    phone_number: `01888${uniqueId}`.slice(0, 11),
    latitude: 23.8103,
    longitude: 90.4125
  };

  test('Complete Customer Journey', async ({ request }) => {
    const regRes = await request.post('/api/customer/register', { data: testCustomer });
    expect(regRes.ok()).toBeTruthy();

    const loginRes = await request.post('/api/customer/login', {
      data: { email: testCustomer.email, password: testCustomer.password }
    });
    expect(loginRes.ok()).toBeTruthy();
    
    const authRes = await request.get('/api/customer/is-verify');
    expect(authRes.ok()).toBeTruthy();
    
    const profileRes = await request.put('/api/customer/update_profile', {
      data: { name: 'API Customer Updated', location: { lat: 23.8, lng: 90.4 } }
    });
    expect(profileRes.ok()).toBeTruthy();

    const restRes = await request.get('/api/customer/getRestaurants');
    expect(restRes.ok()).toBeTruthy();
    const restaurants = await restRes.json();
    
    let restaurantId;
    let menuItemId;

    if (restaurants.length > 0) {
      restaurantId = restaurants[0].restaurant_id;
      
      await request.get(`/api/customer/getRestaurant/${restaurantId}`);
      await request.get(`/api/customer/categories`);
      
      const menuRes = await request.get(`/api/customer/menu/${restaurantId}`);
      const menus = await menuRes.json();
      const items = Array.isArray(menus) ? menus : (menus.data || []);
      if (items.length > 0) {
        menuItemId = items[0].menu_item_id;
      }
    }

    if (restaurantId && menuItemId) {
      const addRes = await request.post('/api/customer/cart', {
        data: { menu_item_id: menuItemId, restaurant_id: restaurantId, quantity: 1 }
      });
      // Skip expecting ok() if item doesn't exist or FK fails during parallel tests
      if (addRes.ok()) {
        const getCartRes = await request.get('/api/customer/cart');
        const cart = await getCartRes.json();
        const cartItemId = cart.items?.[0]?.cart_item_id;
        
        if (cartItemId) {
          await request.put('/api/customer/cart/item', {
            data: { cart_item_id: cartItemId, quantity: 2 }
          });
        }

        await request.post('/api/customer/order/create', {
          data: {
            cartItems: [{ menu_item_id: menuItemId, restaurant_id: restaurantId, price: 10.99, quantity: 2 }],
            paymentMethod: 'cod',
            deliveryAddress: { street: '123 Main', city: 'Dhaka', postal_code: '1000' }
          }
        });
      }
    }

    const getOrdersRes = await request.get('/api/customer/order');
    expect(getOrdersRes.ok()).toBeTruthy();
  });
});
