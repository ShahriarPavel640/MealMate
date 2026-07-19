/**
 * seed_restaurant.js — Comprehensive Restaurant Seed Script
 * 
 * Seeds order/analytics data for the restaurant dashboard:
 *   - ~15 delivered orders TODAY (for "Today's Revenue" stats)
 *   - ~15 delivered orders YESTERDAY (for "vs yesterday" comparison)
 *   - ~170 delivered orders over 90 days (fills weekly/monthly charts)
 *   - ~5 pending_restaurant_acceptance (live orders panel)
 *   - ~3 preparing
 *   - Reviews for ~70% of delivered orders
 *   - Uses actual menu items from the target restaurant
 * 
 * Usage: node backend/scripts/seed_restaurant.js
 */

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Config ---
const RESTAURANT_EMAIL = 'restaurant1@gmail.com';
const PASSWORD_PLAIN = '1234';
const BCRYPT_ROUNDS = 10;
const ORDER_ID_START = 20000; // Different range from rider (10000) and customer (30000)

const NUM_TODAY = 15;
const NUM_YESTERDAY = 15;
const NUM_HISTORICAL = 170;
const NUM_PENDING = 5;
const NUM_PREPARING = 3;
const HISTORY_DAYS = 90;

const MARKER_START = '-- ## GENERATED: RESTAURANT SEED START ##';
const MARKER_END = '-- ## GENERATED: RESTAURANT SEED END ##';

// --- Helpers ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const reviewComments = [
  'Amazing food, will order again!',
  'The portions were generous.',
  'Loved the flavors, excellent quality.',
  'Fast preparation, hot food.',
  'My new favorite restaurant!',
  'Good food but a bit pricey.',
  'Always consistent quality.',
  'Best restaurant in the area.',
  'Delicious and well-packaged.',
  'Great taste, would recommend!',
];

// --- DB Connection ---
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5434,
  database: process.env.DB_NAME || 'food_panda',
  max: 5,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🍽️  Restaurant Seed: Starting...');

    // 1. Resolve restaurant by email
    let restRes = await client.query('SELECT restaurant_id FROM restaurants WHERE email = $1', [RESTAURANT_EMAIL]);
    let restaurantId;
    if (restRes.rows.length > 0) {
      restaurantId = restRes.rows[0].restaurant_id;
      console.log(`  Found restaurant: restaurant_id=${restaurantId}`);
    } else {
      const hash = await bcrypt.hash(PASSWORD_PLAIN, BCRYPT_ROUNDS);
      const ins = await client.query(
        `INSERT INTO restaurants (name, password, phone, email, descriptions)
         VALUES ($1, $2, $3, $4, $5) RETURNING restaurant_id`,
        ['Demo Restaurant', hash, '01616524223', RESTAURANT_EMAIL, 'Very good restaurant :D']
      );
      restaurantId = ins.rows[0].restaurant_id;
      console.log(`  Created restaurant: restaurant_id=${restaurantId}`);
    }

    // 2. Ensure menu categories and items exist for this restaurant
    const existingCats = await client.query(
      'SELECT category_id, name FROM menu_categories WHERE restaurant_id = $1', [restaurantId]
    );
    
    if (existingCats.rows.length === 0) {
      // Seed default categories and items
      const categories = [
        { name: 'Signature Dishes', items: [
          { name: 'Truffle Mushroom Burger', price: 450, desc: 'Premium truffle-infused burger' },
          { name: 'Spicy Chicken Wings', price: 320, desc: 'Hot and crispy wings' },
          { name: 'Classic Margherita Pizza', price: 650, desc: 'Traditional wood-fired pizza' },
          { name: 'Beef Bolognese Pasta', price: 550, desc: 'Rich beef pasta' },
          { name: 'Caesar Salad', price: 280, desc: 'Fresh Caesar salad' },
          { name: 'Chocolate Lava Cake', price: 250, desc: 'Warm chocolate cake' },
        ]},
        { name: 'Appetizers', items: [
          { name: 'Garlic Bread', price: 150, desc: 'Crispy garlic bread' },
          { name: 'Loaded Nachos', price: 220, desc: 'Nachos with all toppings' },
        ]},
        { name: 'Main Courses', items: [
          { name: 'Grilled Salmon', price: 850, desc: 'Fresh Atlantic salmon' },
          { name: 'Steak Frites', price: 1200, desc: 'Premium steak with fries' },
        ]},
        { name: 'Desserts & Beverages', items: [
          { name: 'New York Cheesecake', price: 300, desc: 'Classic cheesecake' },
          { name: 'Iced Caramel Macchiato', price: 180, desc: 'Cold coffee drink' },
          { name: 'Fresh Mint Lemonade', price: 120, desc: 'Refreshing lemonade' },
        ]},
      ];

      for (const cat of categories) {
        const catRes = await client.query(
          'INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, $2) RETURNING category_id',
          [restaurantId, cat.name]
        );
        const catId = catRes.rows[0].category_id;
        for (const item of cat.items) {
          await client.query(
            'INSERT INTO menu_items (category_id, name, description, price, is_available, is_active) VALUES ($1, $2, $3, $4, true, true)',
            [catId, item.name, item.desc, item.price]
          );
        }
      }
      console.log('  Seeded menu categories and items');
    }

    // 3. Get menu items for this restaurant
    const menuRes = await client.query(
      `SELECT mi.menu_item_id, mi.price, mc.name as category_name
       FROM menu_items mi JOIN menu_categories mc ON mi.category_id = mc.category_id
       WHERE mc.restaurant_id = $1 AND mi.is_active = true`, [restaurantId]
    );
    const menuItems = menuRes.rows.map(r => ({ id: r.menu_item_id, price: parseFloat(r.price), category: r.category_name }));

    if (menuItems.length === 0) {
      throw new Error('No menu items found for restaurant!');
    }
    console.log(`  Found ${menuItems.length} menu items`);

    // 4. Ensure customer users exist
    const custRes = await client.query("SELECT user_id FROM users WHERE role_id = 'customer'");
    let customerIds = custRes.rows.map(r => r.user_id);
    if (customerIds.length < 3) {
      const hash = await bcrypt.hash(PASSWORD_PLAIN, BCRYPT_ROUNDS);
      for (let i = customerIds.length; i < 3; i++) {
        const ins = await client.query(
          'INSERT INTO users (name, email, password, phone_number, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
          [`Seed Customer ${i + 1}`, `seedcust${i + 1}@example.com`, hash, `555-000-${String(i).padStart(4, '0')}`, 'customer']
        );
        customerIds.push(ins.rows[0].user_id);
      }
    }

    // 5. Delete old generated restaurant data
    await client.query('DELETE FROM reviews WHERE order_id >= $1 AND order_id < $2', [ORDER_ID_START, ORDER_ID_START + 10000]);
    await client.query('DELETE FROM deliveries WHERE order_id >= $1 AND order_id < $2', [ORDER_ID_START, ORDER_ID_START + 10000]);
    await client.query('DELETE FROM payments WHERE order_id >= $1 AND order_id < $2', [ORDER_ID_START, ORDER_ID_START + 10000]);
    await client.query('DELETE FROM order_items WHERE order_id >= $1 AND order_id < $2', [ORDER_ID_START, ORDER_ID_START + 10000]);
    await client.query('DELETE FROM orders WHERE order_id >= $1 AND order_id < $2', [ORDER_ID_START, ORDER_ID_START + 10000]);
    console.log('  Cleaned old generated restaurant data (order_id 20000-29999)');

    // 6. Resolve a rider for delivered orders
    const riderRes = await client.query("SELECT user_id FROM users WHERE role_id = 'rider' LIMIT 1");
    const riderId = riderRes.rows.length > 0 ? riderRes.rows[0].user_id : null;

    // 7. Generate orders
    const totalOrders = NUM_TODAY + NUM_YESTERDAY + NUM_HISTORICAL + NUM_PENDING + NUM_PREPARING;
    let orderIdx = 0;

    for (let i = 0; i < totalOrders; i++) {
      const orderId = ORDER_ID_START + i;
      const customerId = randomChoice(customerIds);
      const tranId = `SEED_REST_${orderId}`;

      // Pick 1-3 random menu items
      const numItems = randomInt(1, Math.min(3, menuItems.length));
      const chosenItems = [];
      const usedIds = new Set();
      for (let j = 0; j < numItems; j++) {
        let item;
        do { item = randomChoice(menuItems); } while (usedIds.has(item.id) && usedIds.size < menuItems.length);
        if (usedIds.has(item.id)) break;
        usedIds.add(item.id);
        const qty = randomInt(1, 3);
        chosenItems.push({ ...item, qty });
      }
      const totalAmount = chosenItems.reduce((sum, it) => sum + it.price * it.qty, 0).toFixed(2);

      let status, createdAt, deliveredAt, orderRiderId;
      const dropLat = (23.7252 + (Math.random() * 0.04 - 0.02)).toFixed(8);
      const dropLng = (90.3925 + (Math.random() * 0.04 - 0.02)).toFixed(8);

      if (i < NUM_TODAY) {
        // Today's delivered orders (various hours today)
        status = 'delivered';
        const hoursAgo = randomInt(1, 14);
        createdAt = `CURRENT_TIMESTAMP - INTERVAL '${hoursAgo} hours'`;
        deliveredAt = `CURRENT_TIMESTAMP - INTERVAL '${hoursAgo} hours' + INTERVAL '30 minutes'`;
        orderRiderId = riderId;
      } else if (i < NUM_TODAY + NUM_YESTERDAY) {
        // Yesterday's delivered orders
        status = 'delivered';
        const hoursAgo = 24 + randomInt(1, 14);
        createdAt = `CURRENT_TIMESTAMP - INTERVAL '${hoursAgo} hours'`;
        deliveredAt = `CURRENT_TIMESTAMP - INTERVAL '${hoursAgo} hours' + INTERVAL '30 minutes'`;
        orderRiderId = riderId;
      } else if (i < NUM_TODAY + NUM_YESTERDAY + NUM_HISTORICAL) {
        // Historical delivered orders (2-90 days ago)
        status = 'delivered';
        const daysAgo = randomInt(2, HISTORY_DAYS);
        const hoursOffset = randomInt(8, 22);
        createdAt = `CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days' + INTERVAL '${hoursOffset} hours'`;
        deliveredAt = `CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days' + INTERVAL '${hoursOffset} hours' + INTERVAL '30 minutes'`;
        orderRiderId = riderId;
      } else if (i < NUM_TODAY + NUM_YESTERDAY + NUM_HISTORICAL + NUM_PENDING) {
        // Pending orders (no rider)
        status = 'pending_restaurant_acceptance';
        createdAt = 'CURRENT_TIMESTAMP';
        deliveredAt = null;
        orderRiderId = null;
      } else {
        // Preparing orders
        status = 'preparing';
        createdAt = 'CURRENT_TIMESTAMP';
        deliveredAt = null;
        orderRiderId = null;
      }

      // Insert order
      await client.query(
        `INSERT INTO orders (order_id, user_id, restaurant_id, rider_id, status, total_amount, tran_id, created_at, delivered_at)
         VALUES ($1, $2, $3, $4, $5::order_status, $6, $7, ${createdAt}, ${deliveredAt || 'NULL'})`,
        [orderId, customerId, restaurantId, orderRiderId, status, totalAmount, tranId]
      );

      // Insert order items
      for (const item of chosenItems) {
        await client.query(
          'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, item.id, item.qty, item.price]
        );
      }

      // Insert payment
      await client.query(
        `INSERT INTO payments (order_id, user_id, method_type, amount, status, tran_id)
         VALUES ($1, $2, 'sslcommerz', $3, $4, $5)`,
        [orderId, customerId, totalAmount, status === 'delivered' ? 'completed' : 'pending', tranId]
      );

      // Insert delivery (for all orders)
      await client.query(
        `INSERT INTO deliveries (order_id, rider_id, restaurant_id, dropoff_latitude, dropoff_longitude, dropoff_addr, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5, $6, ${status === 'delivered' ? createdAt : 'NULL'}, ${deliveredAt || 'NULL'})`,
        [orderId, orderRiderId, restaurantId, dropLat, dropLng, `Delivery Addr ${orderId}`]
      );

      // Review for ~70% of delivered orders
      if (status === 'delivered' && Math.random() < 0.7) {
        const rating = randomFloat(3.5, 5.0);
        const comment = randomChoice(reviewComments);
        await client.query(
          `INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, ${deliveredAt})`,
          [customerId, restaurantId, orderId, rating, comment]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`  ✅ Inserted ${totalOrders} orders (${NUM_TODAY} today, ${NUM_YESTERDAY} yesterday, ${NUM_HISTORICAL} historical, ${NUM_PENDING} pending, ${NUM_PREPARING} preparing)`);

    // 8. Update populate.sql
    await updatePopulateSql(client, restaurantId);

    console.log('🍽️  Restaurant Seed: Complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Restaurant Seed Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

async function updatePopulateSql(client, restaurantId) {
  const populatePath = path.resolve(__dirname, '../../populate.sql');
  let content = fs.readFileSync(populatePath, 'utf-8');

  // Export the data we just inserted
  const ordersRes = await client.query(
    `SELECT order_id, user_id, restaurant_id, rider_id, status, total_amount, tran_id,
            EXTRACT(EPOCH FROM (created_at - CURRENT_TIMESTAMP)) AS created_secs,
            EXTRACT(EPOCH FROM (delivered_at - CURRENT_TIMESTAMP)) AS delivered_secs
     FROM orders WHERE order_id >= $1 AND order_id < $2 ORDER BY order_id`,
    [ORDER_ID_START, ORDER_ID_START + 10000]
  );

  const itemsRes = await client.query(
    `SELECT order_id, menu_item_id, quantity, price FROM order_items
     WHERE order_id >= $1 AND order_id < $2 ORDER BY order_id`,
    [ORDER_ID_START, ORDER_ID_START + 10000]
  );

  const paymentsRes = await client.query(
    `SELECT order_id, user_id, method_type, amount, status, tran_id FROM payments
     WHERE order_id >= $1 AND order_id < $2 ORDER BY order_id`,
    [ORDER_ID_START, ORDER_ID_START + 10000]
  );

  const deliveriesRes = await client.query(
    `SELECT order_id, rider_id, restaurant_id, dropoff_latitude, dropoff_longitude, dropoff_addr,
            EXTRACT(EPOCH FROM (start_time - CURRENT_TIMESTAMP)) AS start_secs,
            EXTRACT(EPOCH FROM (end_time - CURRENT_TIMESTAMP)) AS end_secs
     FROM deliveries WHERE order_id >= $1 AND order_id < $2 ORDER BY order_id`,
    [ORDER_ID_START, ORDER_ID_START + 10000]
  );

  const reviewsRes = await client.query(
    `SELECT user_id, restaurant_id, rider_id, order_id, rating, comment,
            EXTRACT(EPOCH FROM (created_at - CURRENT_TIMESTAMP)) AS created_secs
     FROM reviews WHERE order_id >= $1 AND order_id < $2 ORDER BY order_id`,
    [ORDER_ID_START, ORDER_ID_START + 10000]
  );

  const secsToInterval = (secs) => {
    if (secs === null) return 'NULL';
    const absSecs = Math.abs(Math.round(secs));
    const sign = secs < 0 ? '-' : '+';
    return `CURRENT_TIMESTAMP ${sign} INTERVAL '${absSecs} seconds'`;
  };

  let newBlock = `\n${MARKER_START}\n`;

  if (ordersRes.rows.length > 0) {
    newBlock += 'INSERT INTO orders (order_id, user_id, restaurant_id, rider_id, status, total_amount, tran_id, created_at, delivered_at) VALUES\n';
    newBlock += ordersRes.rows.map(r => {
      const created = secsToInterval(r.created_secs);
      const delivered = r.delivered_secs !== null ? secsToInterval(r.delivered_secs) : 'NULL';
      return `(${r.order_id}, ${r.user_id}, ${r.restaurant_id}, ${r.rider_id || 'NULL'}, '${r.status}', ${r.total_amount}, '${r.tran_id}', ${created}, ${delivered})`;
    }).join(',\n') + ' ON CONFLICT (order_id) DO NOTHING;\n\n';
  }

  if (itemsRes.rows.length > 0) {
    newBlock += 'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES\n';
    newBlock += itemsRes.rows.map(r => `(${r.order_id}, ${r.menu_item_id}, ${r.quantity}, ${r.price})`).join(',\n');
    newBlock += ' ON CONFLICT (order_id, menu_item_id) DO NOTHING;\n\n';
  }

  if (paymentsRes.rows.length > 0) {
    newBlock += 'INSERT INTO payments (order_id, user_id, method_type, amount, status, tran_id) VALUES\n';
    newBlock += paymentsRes.rows.map(r => `(${r.order_id}, ${r.user_id}, '${r.method_type}', ${r.amount}, '${r.status}', '${r.tran_id}')`).join(',\n');
    newBlock += ' ON CONFLICT DO NOTHING;\n\n';
  }

  if (deliveriesRes.rows.length > 0) {
    newBlock += 'INSERT INTO deliveries (order_id, rider_id, restaurant_id, dropoff_latitude, dropoff_longitude, dropoff_addr, start_time, end_time) VALUES\n';
    newBlock += deliveriesRes.rows.map(r => {
      const st = r.start_secs !== null ? secsToInterval(r.start_secs) : 'NULL';
      const et = r.end_secs !== null ? secsToInterval(r.end_secs) : 'NULL';
      return `(${r.order_id}, ${r.rider_id || 'NULL'}, ${r.restaurant_id}, ${r.dropoff_latitude}, ${r.dropoff_longitude}, '${r.dropoff_addr}', ${st}, ${et})`;
    }).join(',\n') + ' ON CONFLICT (delivery_id) DO NOTHING;\n\n';
  }

  if (reviewsRes.rows.length > 0) {
    newBlock += 'INSERT INTO reviews (user_id, restaurant_id, rider_id, order_id, rating, comment, created_at) VALUES\n';
    newBlock += reviewsRes.rows.map(r => {
      const created = secsToInterval(r.created_secs);
      return `(${r.user_id}, ${r.restaurant_id}, ${r.rider_id || 'NULL'}, ${r.order_id}, ${r.rating}, '${r.comment.replace(/'/g, "''")}', ${created})`;
    }).join(',\n') + ';\n';
  }

  newBlock += `${MARKER_END}\n`;

  // Replace or append
  const startIdx = content.indexOf(MARKER_START);
  const endIdx = content.indexOf(MARKER_END);
  if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + newBlock.trim() + '\n' + content.substring(endIdx + MARKER_END.length);
  } else {
    content += newBlock;
  }

  fs.writeFileSync(populatePath, content, 'utf-8');
  console.log('  📄 Updated populate.sql with restaurant seed data');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
