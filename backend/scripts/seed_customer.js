/**
 * seed_customer.js — Comprehensive Customer Seed Script
 * 
 * Seeds order history data for the customer dashboard:
 *   - ~40 delivered orders across multiple restaurants (90 days)
 *   - ~5 pending_restaurant_acceptance (active orders)
 *   - ~3 preparing
 *   - ~2 ready_for_pickup
 *   - Reviews for ~30 delivered orders
 *   - Ensures restaurants, menu items, and customer location exist
 * 
 * Usage: node backend/scripts/seed_customer.js
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
const CUSTOMER_EMAIL = 'customer1@gmail.com';
const CUSTOMER_ROLE = 'customer';
const PASSWORD_PLAIN = '1234';
const BCRYPT_ROUNDS = 10;
const ORDER_ID_START = 30000; // Different range from rider (10000) and restaurant (20000)

const DHAKA_LAT = 23.7285;
const DHAKA_LNG = 90.3952;
const DHAKA_RESTAURANTS = [6, 7, 8, 9, 10, 11];

const NUM_DELIVERED = 40;
const NUM_PENDING = 5;
const NUM_PREPARING = 3;
const NUM_READY = 2;
const HISTORY_DAYS = 90;

const MARKER_START = '-- ## GENERATED: CUSTOMER SEED START ##';
const MARKER_END = '-- ## GENERATED: CUSTOMER SEED END ##';

// --- Helpers ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const reviewComments = [
  'Absolutely delicious! Will order again.',
  'Great food and fast delivery.',
  'The packaging was excellent.',
  'Portions could be bigger, but taste was great.',
  'My go-to restaurant!',
  'Fresh ingredients, very tasty.',
  'A bit slow today, but food quality was perfect.',
  'Amazing experience every time.',
  'Good value for money.',
  'The best I have had in a while!',
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
    console.log('👤 Customer Seed: Starting...');

    // 1. Resolve or create customer user
    let custRes = await client.query('SELECT user_id FROM users WHERE email = $1', [CUSTOMER_EMAIL]);
    let customerId;
    if (custRes.rows.length > 0) {
      customerId = custRes.rows[0].user_id;
      console.log(`  Found customer: user_id=${customerId}`);
    } else {
      const hash = await bcrypt.hash(PASSWORD_PLAIN, BCRYPT_ROUNDS);
      const ins = await client.query(
        'INSERT INTO users (name, email, password, phone_number, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
        ['Customer One', CUSTOMER_EMAIL, hash, '768-749-5675', CUSTOMER_ROLE]
      );
      customerId = ins.rows[0].user_id;
      console.log(`  Created customer: user_id=${customerId}`);
    }

    // 2. Ensure customer has a primary location in Dhaka
    const locRes = await client.query(
      'SELECT location_id FROM user_locations WHERE user_id = $1 AND is_primary = true LIMIT 1', [customerId]
    );
    if (locRes.rows.length > 0) {
      // Update existing primary location to Dhaka
      await client.query(
        'UPDATE user_locations SET latitude = $1, longitude = $2, city = $3 WHERE user_id = $4 AND is_primary = true',
        [DHAKA_LAT, DHAKA_LNG, 'Dhaka', customerId]
      );
    } else {
      await client.query(
        'INSERT INTO user_locations (user_id, street, city, postal_code, latitude, longitude, is_primary) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [customerId, 'Dhanmondi 27, Dhaka', 'Dhaka', '1209', DHAKA_LAT, DHAKA_LNG, true]
      );
    }
    console.log(`  Customer location set to Dhaka`);

    // 3. Get menu items per restaurant
    const menuRes = await client.query(
      `SELECT mi.menu_item_id, mi.price, mc.restaurant_id
       FROM menu_items mi JOIN menu_categories mc ON mi.category_id = mc.category_id
       WHERE mc.restaurant_id = ANY($1) AND mi.is_active = true`, [DHAKA_RESTAURANTS]
    );
    const menuByRestaurant = {};
    for (const row of menuRes.rows) {
      if (!menuByRestaurant[row.restaurant_id]) menuByRestaurant[row.restaurant_id] = [];
      menuByRestaurant[row.restaurant_id].push({ id: row.menu_item_id, price: parseFloat(row.price) });
    }

    if (Object.keys(menuByRestaurant).length === 0) {
      throw new Error('No menu items found for Dhaka restaurants!');
    }
    console.log(`  Found menu items for ${Object.keys(menuByRestaurant).length} restaurants`);

    // 4. Get a rider for delivered orders
    const riderRes = await client.query("SELECT user_id FROM users WHERE email = 'rider1@gmail.com'");
    const riderId = riderRes.rows.length > 0 ? riderRes.rows[0].user_id : null;

    // 5. Delete old generated customer data
    await client.query('DELETE FROM reviews WHERE order_id >= $1 AND order_id < $2', [ORDER_ID_START, ORDER_ID_START + 10000]);
    await client.query('DELETE FROM deliveries WHERE order_id >= $1 AND order_id < $2', [ORDER_ID_START, ORDER_ID_START + 10000]);
    await client.query('DELETE FROM payments WHERE order_id >= $1 AND order_id < $2', [ORDER_ID_START, ORDER_ID_START + 10000]);
    await client.query('DELETE FROM order_items WHERE order_id >= $1 AND order_id < $2', [ORDER_ID_START, ORDER_ID_START + 10000]);
    await client.query('DELETE FROM orders WHERE order_id >= $1 AND order_id < $2', [ORDER_ID_START, ORDER_ID_START + 10000]);
    console.log('  Cleaned old generated customer data (order_id 30000-39999)');

    // 6. Generate orders
    const totalOrders = NUM_DELIVERED + NUM_PENDING + NUM_PREPARING + NUM_READY;

    for (let i = 0; i < totalOrders; i++) {
      const orderId = ORDER_ID_START + i;
      const restaurantId = randomChoice(DHAKA_RESTAURANTS);
      const items = menuByRestaurant[restaurantId] || [];
      if (items.length === 0) continue;

      const tranId = `SEED_CUST_${orderId}`;

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

      const dropLat = (DHAKA_LAT + (Math.random() * 0.04 - 0.02)).toFixed(8);
      const dropLng = (DHAKA_LNG + (Math.random() * 0.04 - 0.02)).toFixed(8);

      let status, createdAt, deliveredAt, orderRiderId, startTime, endTime;

      if (i < NUM_DELIVERED) {
        status = 'delivered';
        const daysAgo = randomInt(0, HISTORY_DAYS);
        const hoursOffset = randomInt(8, 22);
        createdAt = `CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days' + INTERVAL '${hoursOffset} hours'`;
        deliveredAt = `CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days' + INTERVAL '${hoursOffset} hours' + INTERVAL '30 minutes'`;
        orderRiderId = riderId;
        startTime = createdAt;
        endTime = deliveredAt;
      } else if (i < NUM_DELIVERED + NUM_PENDING) {
        status = 'pending_restaurant_acceptance';
        createdAt = 'CURRENT_TIMESTAMP';
        deliveredAt = null;
        orderRiderId = null;
        startTime = null;
        endTime = null;
      } else if (i < NUM_DELIVERED + NUM_PENDING + NUM_PREPARING) {
        status = 'preparing';
        createdAt = 'CURRENT_TIMESTAMP';
        deliveredAt = null;
        orderRiderId = null;
        startTime = null;
        endTime = null;
      } else {
        status = 'ready_for_pickup';
        createdAt = 'CURRENT_TIMESTAMP';
        deliveredAt = null;
        orderRiderId = null;
        startTime = null;
        endTime = null;
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

      // Insert delivery
      await client.query(
        `INSERT INTO deliveries (order_id, rider_id, restaurant_id, dropoff_latitude, dropoff_longitude, dropoff_addr, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5, $6, ${startTime || 'NULL'}, ${endTime || 'NULL'})`,
        [orderId, orderRiderId, restaurantId, dropLat, dropLng, `Delivery Addr ${orderId}`]
      );

      // Review for ~75% of delivered orders (restaurant review)
      if (status === 'delivered' && Math.random() < 0.75) {
        const rating = randomFloat(3.0, 5.0);
        const comment = randomChoice(reviewComments);
        await client.query(
          `INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, ${deliveredAt})`,
          [customerId, restaurantId, orderId, rating, comment]
        );

        // Also add rider review for ~50% of those
        if (orderRiderId && Math.random() < 0.5) {
          const riderRating = randomFloat(3.5, 5.0);
          const riderComment = randomChoice(reviewComments);
          await client.query(
            `INSERT INTO reviews (user_id, restaurant_id, rider_id, order_id, rating, comment, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, ${deliveredAt})`,
            [customerId, restaurantId, orderRiderId, orderId, riderRating, riderComment]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log(`  ✅ Inserted ${totalOrders} orders (${NUM_DELIVERED} delivered, ${NUM_PENDING} pending, ${NUM_PREPARING} preparing, ${NUM_READY} ready_for_pickup)`);

    // 7. Update populate.sql
    await updatePopulateSql(client);

    console.log('👤 Customer Seed: Complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Customer Seed Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

async function updatePopulateSql(client) {
  const populatePath = path.resolve(__dirname, '../../populate.sql');
  let content = fs.readFileSync(populatePath, 'utf-8');

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

  const startIdx = content.indexOf(MARKER_START);
  const endIdx = content.indexOf(MARKER_END);
  if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + newBlock.trim() + '\n' + content.substring(endIdx + MARKER_END.length);
  } else {
    content += newBlock;
  }

  fs.writeFileSync(populatePath, content, 'utf-8');
  console.log('  📄 Updated populate.sql with customer seed data');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
