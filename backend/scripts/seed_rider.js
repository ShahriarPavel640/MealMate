/**
 * seed_rider.js — Comprehensive Rider Seed Script
 * 
 * Seeds delivery/order data for the rider dashboard:
 *   - 20 available orders (ready_for_pickup, no rider assigned)
 *   - 1 out_for_delivery order (assigned to rider)
 *   - 80 delivered orders (spanning 90 days for analytics)
 *   - ~65 reviews for delivered orders
 * 
 * Usage: node backend/scripts/seed_rider.js
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
const RIDER_EMAIL = 'rider1@gmail.com';
const RIDER_ROLE = 'rider';
const PASSWORD_PLAIN = '1234';
const BCRYPT_ROUNDS = 10;
const DHAKA_LAT = 23.7252;
const DHAKA_LNG = 90.3925;
const DHAKA_RESTAURANTS = [6, 7, 8, 9, 10, 11];
const CUSTOMER_IDS_TO_USE = []; // Resolved at runtime
const ORDER_ID_START = 10000;
const TOTAL_AVAILABLE = 20;
const TOTAL_OUT_FOR_DELIVERY = 1;
const TOTAL_DELIVERED = 80;
const HISTORY_DAYS = 90;

const MARKER_START = '-- ## GENERATED: RIDER SEED START ##';
const MARKER_END = '-- ## GENERATED: RIDER SEED END ##';

// --- Helpers ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const reviewComments = [
  'Fast delivery and very polite!',
  'Arrived right on time, great service.',
  'Quick and efficient.',
  'Friendly rider, food was hot.',
  'Perfect drop-off.',
  'Excellent service.',
  'A bit delayed, but the rider was nice.',
  'Great communication throughout.',
  'Very professional delivery.',
  'Would recommend this rider!',
];

// --- DB Connection ---
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5434,
  database: process.env.DB_NAME || 'mealmate',
  max: 5,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🚴 Rider Seed: Starting...');

    // 1. Resolve or create rider user
    let riderRes = await client.query('SELECT user_id FROM users WHERE email = $1', [RIDER_EMAIL]);
    let riderId;
    if (riderRes.rows.length > 0) {
      riderId = riderRes.rows[0].user_id;
      console.log(`  Found rider: user_id=${riderId}`);
    } else {
      const hash = await bcrypt.hash(PASSWORD_PLAIN, BCRYPT_ROUNDS);
      const ins = await client.query(
        'INSERT INTO users (name, email, password, phone_number, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
        ['Rider One', RIDER_EMAIL, hash, '413-855-1738', RIDER_ROLE]
      );
      riderId = ins.rows[0].user_id;
      console.log(`  Created rider: user_id=${riderId}`);
    }

    // 2. Ensure rider_profiles entry
    const rpRes = await client.query('SELECT user_id FROM rider_profiles WHERE user_id = $1', [riderId]);
    if (rpRes.rows.length === 0) {
      await client.query(
        'INSERT INTO rider_profiles (user_id, vehicle_type, current_location, is_available) VALUES ($1, $2, $3, $4)',
        [riderId, 'Motorcycle', 'Dhaka, Bangladesh', true]
      );
    }

    // 3. Update rider location to Dhaka (only lat/lng)
    const locRes = await client.query('SELECT location_id FROM user_locations WHERE user_id = $1 LIMIT 1', [riderId]);
    if (locRes.rows.length > 0) {
      await client.query('UPDATE user_locations SET latitude = $1, longitude = $2 WHERE user_id = $3', [DHAKA_LAT, DHAKA_LNG, riderId]);
    } else {
      await client.query(
        'INSERT INTO user_locations (user_id, street, city, postal_code, latitude, longitude, is_primary) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [riderId, 'Dhaka, Bangladesh', 'Dhaka', '1000', DHAKA_LAT, DHAKA_LNG, true]
      );
    }
    console.log(`  Rider location set to Dhaka (${DHAKA_LAT}, ${DHAKA_LNG})`);

    // 4. Resolve customer IDs (need at least 3 customers for variety)
    const custRes = await client.query("SELECT user_id FROM users WHERE role_id = 'customer' LIMIT 5");
    const customerIds = custRes.rows.map(r => r.user_id);
    if (customerIds.length === 0) {
      // Create a dummy customer
      const hash = await bcrypt.hash(PASSWORD_PLAIN, BCRYPT_ROUNDS);
      const ins = await client.query(
        'INSERT INTO users (name, email, password, phone_number, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
        ['Seed Customer', 'seedcustomer@example.com', hash, '555-000-0001', 'customer']
      );
      customerIds.push(ins.rows[0].user_id);
    }

    // 5. Get menu items per restaurant
    const menuRes = await client.query(
      'SELECT mi.menu_item_id, mi.price, mc.restaurant_id FROM menu_items mi JOIN menu_categories mc ON mi.category_id = mc.category_id WHERE mc.restaurant_id = ANY($1)',
      [DHAKA_RESTAURANTS]
    );
    const menuByRestaurant = {};
    for (const row of menuRes.rows) {
      if (!menuByRestaurant[row.restaurant_id]) menuByRestaurant[row.restaurant_id] = [];
      menuByRestaurant[row.restaurant_id].push({ id: row.menu_item_id, price: parseFloat(row.price) });
    }

    // 6. Delete old generated rider data
    // Delete reviews first (FK), then deliveries, payments, order_items, orders
    await client.query('DELETE FROM reviews WHERE order_id >= $1 AND rider_id = $2', [ORDER_ID_START, riderId]);
    await client.query(`DELETE FROM reviews WHERE order_id IN (SELECT order_id FROM orders WHERE order_id >= $1 AND rider_id IS NULL AND status = 'ready_for_pickup')`, [ORDER_ID_START]);
    await client.query('DELETE FROM deliveries WHERE order_id >= $1', [ORDER_ID_START]);
    await client.query('DELETE FROM payments WHERE order_id >= $1', [ORDER_ID_START]);
    await client.query('DELETE FROM order_items WHERE order_id >= $1', [ORDER_ID_START]);
    await client.query('DELETE FROM orders WHERE order_id >= $1', [ORDER_ID_START]);
    console.log('  Cleaned old generated data (order_id >= 10000)');

    // 7. Generate orders
    const totalOrders = TOTAL_AVAILABLE + TOTAL_OUT_FOR_DELIVERY + TOTAL_DELIVERED;
    const sqlParts = { orders: [], orderItems: [], payments: [], deliveries: [], reviews: [] };

    for (let i = 0; i < totalOrders; i++) {
      const orderId = ORDER_ID_START + i;
      const customerId = randomChoice(customerIds);
      const restaurantId = randomChoice(DHAKA_RESTAURANTS);
      const items = menuByRestaurant[restaurantId] || [];
      if (items.length === 0) continue;

      // Pick 1-3 random items
      const numItems = randomInt(1, Math.min(3, items.length));
      const chosenItems = [];
      const usedIds = new Set();
      for (let j = 0; j < numItems; j++) {
        let item;
        do { item = randomChoice(items); } while (usedIds.has(item.id) && usedIds.size < items.length);
        if (usedIds.has(item.id)) break;
        usedIds.add(item.id);
        const qty = randomInt(1, 3);
        chosenItems.push({ ...item, qty });
      }
      const totalAmount = chosenItems.reduce((sum, it) => sum + it.price * it.qty, 0).toFixed(2);

      // Dropoff in Dhaka area (within 5km)
      const dropLat = (DHAKA_LAT + (Math.random() * 0.04 - 0.02)).toFixed(8);
      const dropLng = (DHAKA_LNG + (Math.random() * 0.04 - 0.02)).toFixed(8);
      const dropAddr = `Delivery Addr ${orderId}`;
      const tranId = `SEED_RIDER_${orderId}`;

      let status, deliveryStatus, orderRiderId, deliveredAt, createdAt, startTime, endTime;
      let daysAgo;

      if (i < TOTAL_AVAILABLE) {
        // Available orders — no rider assigned
        status = 'ready_for_pickup';
        orderRiderId = null;
        deliveredAt = null;
        createdAt = 'CURRENT_TIMESTAMP';
        startTime = null;
        endTime = null;
      } else if (i < TOTAL_AVAILABLE + TOTAL_OUT_FOR_DELIVERY) {
        // Active delivery
        status = 'out_for_delivery';
        orderRiderId = riderId;
        deliveredAt = null;
        createdAt = 'CURRENT_TIMESTAMP';
        startTime = 'CURRENT_TIMESTAMP';
        endTime = null;
      } else {
        // Delivered — spread over HISTORY_DAYS
        status = 'delivered';
        orderRiderId = riderId;
        daysAgo = randomInt(0, HISTORY_DAYS);
        const hoursOffset = randomInt(8, 22); // realistic delivery hours
        createdAt = `CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days' + INTERVAL '${hoursOffset} hours'`;
        deliveredAt = `CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days' + INTERVAL '${hoursOffset} hours' + INTERVAL '30 minutes'`;
        startTime = createdAt;
        endTime = deliveredAt;
      }

      // Insert order
      await client.query(
        `INSERT INTO orders (order_id, user_id, restaurant_id, rider_id, status, total_amount, tran_id, created_at, delivered_at)
         VALUES ($1, $2, $3, $4, $5::order_status, $6, $7, ${createdAt}, ${deliveredAt ? deliveredAt : 'NULL'})`,
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

      // Insert delivery
      await client.query(
        `INSERT INTO deliveries (order_id, rider_id, restaurant_id, dropoff_latitude, dropoff_longitude, dropoff_addr, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5, $6, ${startTime || 'NULL'}, ${endTime || 'NULL'})`,
        [orderId, orderRiderId, restaurantId, dropLat, dropLng, dropAddr]
      );

      // Insert review for ~80% of delivered orders
      if (status === 'delivered' && Math.random() < 0.8) {
        const rating = randomFloat(3.5, 5.0);
        const comment = randomChoice(reviewComments);
        await client.query(
          `INSERT INTO reviews (user_id, restaurant_id, rider_id, order_id, rating, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, ${deliveredAt})`,
          [customerId, restaurantId, riderId, orderId, rating, comment]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`  ✅ Inserted ${totalOrders} orders (${TOTAL_AVAILABLE} available, ${TOTAL_OUT_FOR_DELIVERY} out_for_delivery, ${TOTAL_DELIVERED} delivered)`);

    // 8. Update populate.sql
    await updatePopulateSql(client, riderId, customerIds);

    console.log('🚴 Rider Seed: Complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Rider Seed Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

async function updatePopulateSql(client, riderId, customerIds) {
  const populatePath = path.resolve(__dirname, '../../populate.sql');
  let content = fs.readFileSync(populatePath, 'utf-8');

  // Export current generated data as SQL
  const ordersRes = await client.query(
    `SELECT order_id, user_id, restaurant_id, rider_id, status, total_amount, tran_id,
            created_at - CURRENT_TIMESTAMP AS created_offset,
            delivered_at - CURRENT_TIMESTAMP AS delivered_offset
     FROM orders WHERE order_id >= $1 ORDER BY order_id`, [ORDER_ID_START]
  );

  const itemsRes = await client.query(
    `SELECT oi.order_id, oi.menu_item_id, oi.quantity, oi.price
     FROM order_items oi WHERE oi.order_id >= $1 ORDER BY oi.order_id`, [ORDER_ID_START]
  );

  const paymentsRes = await client.query(
    `SELECT order_id, user_id, method_type, amount, status, tran_id
     FROM payments WHERE order_id >= $1 ORDER BY order_id`, [ORDER_ID_START]
  );

  const deliveriesRes = await client.query(
    `SELECT order_id, rider_id, restaurant_id, dropoff_latitude, dropoff_longitude, dropoff_addr,
            start_time - CURRENT_TIMESTAMP AS start_offset,
            end_time - CURRENT_TIMESTAMP AS end_offset
     FROM deliveries WHERE order_id >= $1 ORDER BY order_id`, [ORDER_ID_START]
  );

  const reviewsRes = await client.query(
    `SELECT user_id, restaurant_id, rider_id, order_id, rating, comment,
            created_at - CURRENT_TIMESTAMP AS created_offset
     FROM reviews WHERE order_id >= $1 ORDER BY order_id`, [ORDER_ID_START]
  );

  let newBlock = `\n${MARKER_START}\n`;
  
  // Orders
  if (ordersRes.rows.length > 0) {
    newBlock += `INSERT INTO orders (order_id, user_id, restaurant_id, rider_id, status, total_amount, tran_id, created_at, delivered_at) VALUES\n`;
    newBlock += ordersRes.rows.map(r => {
      const created = r.created_offset ? `CURRENT_TIMESTAMP + INTERVAL '${r.created_offset}'` : 'CURRENT_TIMESTAMP';
      const delivered = r.delivered_offset ? `CURRENT_TIMESTAMP + INTERVAL '${r.delivered_offset}'` : 'NULL';
      return `(${r.order_id}, ${r.user_id}, ${r.restaurant_id}, ${r.rider_id || 'NULL'}, '${r.status}', ${r.total_amount}, '${r.tran_id}', ${created}, ${delivered})`;
    }).join(',\n') + ' ON CONFLICT (order_id) DO NOTHING;\n\n';
  }

  // Order Items
  if (itemsRes.rows.length > 0) {
    newBlock += `INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES\n`;
    newBlock += itemsRes.rows.map(r => `(${r.order_id}, ${r.menu_item_id}, ${r.quantity}, ${r.price})`).join(',\n');
    newBlock += ' ON CONFLICT (order_id, menu_item_id) DO NOTHING;\n\n';
  }

  // Payments
  if (paymentsRes.rows.length > 0) {
    newBlock += `INSERT INTO payments (order_id, user_id, method_type, amount, status, tran_id) VALUES\n`;
    newBlock += paymentsRes.rows.map(r => `(${r.order_id}, ${r.user_id}, '${r.method_type}', ${r.amount}, '${r.status}', '${r.tran_id}')`).join(',\n');
    newBlock += ' ON CONFLICT DO NOTHING;\n\n';
  }

  // Deliveries
  if (deliveriesRes.rows.length > 0) {
    newBlock += `INSERT INTO deliveries (order_id, rider_id, restaurant_id, dropoff_latitude, dropoff_longitude, dropoff_addr, start_time, end_time) VALUES\n`;
    newBlock += deliveriesRes.rows.map(r => {
      const st = r.start_offset ? `CURRENT_TIMESTAMP + INTERVAL '${r.start_offset}'` : 'NULL';
      const et = r.end_offset ? `CURRENT_TIMESTAMP + INTERVAL '${r.end_offset}'` : 'NULL';
      return `(${r.order_id}, ${r.rider_id || 'NULL'}, ${r.restaurant_id}, ${r.dropoff_latitude}, ${r.dropoff_longitude}, '${r.dropoff_addr}', ${st}, ${et})`;
    }).join(',\n') + ' ON CONFLICT (delivery_id) DO NOTHING;\n\n';
  }

  // Reviews
  if (reviewsRes.rows.length > 0) {
    newBlock += `INSERT INTO reviews (user_id, restaurant_id, rider_id, order_id, rating, comment, created_at) VALUES\n`;
    newBlock += reviewsRes.rows.map(r => {
      const created = r.created_offset ? `CURRENT_TIMESTAMP + INTERVAL '${r.created_offset}'` : 'CURRENT_TIMESTAMP';
      return `(${r.user_id}, ${r.restaurant_id}, ${r.rider_id}, ${r.order_id}, ${r.rating}, '${r.comment.replace(/'/g, "''")}', ${created})`;
    }).join(',\n') + ';\n';
  }

  newBlock += `${MARKER_END}\n`;

  // Replace or append
  const startIdx = content.indexOf(MARKER_START);
  const endIdx = content.indexOf(MARKER_END);
  if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + newBlock.trim() + '\n' + content.substring(endIdx + MARKER_END.length);
  } else {
    // Also remove old generated block if it exists (the one starting from line 207+)
    const oldMarker = '-- DEMO RESTAURANT ANALYTICS DATA --';
    const oldIdx = content.indexOf(oldMarker);
    if (oldIdx !== -1) {
      content = content.substring(0, oldIdx) + newBlock;
    } else {
      content += newBlock;
    }
  }

  fs.writeFileSync(populatePath, content, 'utf-8');
  console.log('  📄 Updated populate.sql with rider seed data');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
