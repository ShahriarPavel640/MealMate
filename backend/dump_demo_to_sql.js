import fs from 'fs';
import path from 'path';
import pool from './db.js';

const dumpDemoData = async () => {
  const restaurantId = 11;
  const sqlFilePath = path.join(process.cwd(), '../populate.sql');
  let sqlContent = '\n\n-- DEMO RESTAURANT ANALYTICS DATA --\n';

  try {
    // 1. Menu Categories
    const categoriesRes = await pool.query("SELECT * FROM menu_categories WHERE restaurant_id = $1", [restaurantId]);
    if (categoriesRes.rows.length > 0) {
      sqlContent += 'INSERT INTO menu_categories (category_id, restaurant_id, name) VALUES \n';
      const categoryRows = categoriesRes.rows.map(c => `(${c.category_id}, ${c.restaurant_id}, '${c.name.replace(/'/g, "''")}')`);
      sqlContent += categoryRows.join(',\n') + ' ON CONFLICT DO NOTHING;\n\n';
    }

    // 2. Menu Items
    const categoryIds = categoriesRes.rows.map(c => c.category_id);
    if (categoryIds.length > 0) {
      const itemsRes = await pool.query("SELECT * FROM menu_items WHERE category_id = ANY($1)", [categoryIds]);
      if (itemsRes.rows.length > 0) {
        sqlContent += 'INSERT INTO menu_items (menu_item_id, category_id, name, description, price, is_available, is_active, menu_item_image_url) VALUES \n';
        const itemRows = itemsRes.rows.map(i => {
          const desc = i.description ? `'${i.description.replace(/'/g, "''")}'` : 'NULL';
          const img = i.menu_item_image_url ? `'${i.menu_item_image_url.replace(/'/g, "''")}'` : 'NULL';
          return `(${i.menu_item_id}, ${i.category_id}, '${i.name.replace(/'/g, "''")}', ${desc}, ${i.price}, ${i.is_available}, ${i.is_active}, ${img})`;
        });
        sqlContent += itemRows.join(',\n') + ' ON CONFLICT DO NOTHING;\n\n';
      }
    }

    // 3. Orders
    const ordersRes = await pool.query("SELECT * FROM orders WHERE restaurant_id = $1", [restaurantId]);
    if (ordersRes.rows.length > 0) {
      sqlContent += 'INSERT INTO orders (order_id, user_id, restaurant_id, total_amount, status, created_at) VALUES \n';
      const orderRows = ordersRes.rows.map(o => {
        return `(${o.order_id}, ${o.user_id}, ${o.restaurant_id}, ${o.total_amount}, '${o.status}', '${o.created_at.toISOString()}')`;
      });
      sqlContent += orderRows.join(',\n') + ' ON CONFLICT DO NOTHING;\n\n';
      
      // 4. Order Items
      const orderIds = ordersRes.rows.map(o => o.order_id);
      const orderItemsRes = await pool.query("SELECT * FROM order_items WHERE order_id = ANY($1)", [orderIds]);
      if (orderItemsRes.rows.length > 0) {
        sqlContent += 'INSERT INTO order_items (order_item_id, order_id, menu_item_id, quantity, price) VALUES \n';
        const oiRows = orderItemsRes.rows.map(oi => {
          return `(${oi.order_item_id}, ${oi.order_id}, ${oi.menu_item_id}, ${oi.quantity}, ${oi.price})`;
        });
        sqlContent += oiRows.join(',\n') + ' ON CONFLICT DO NOTHING;\n\n';
      }
    }

    // Append to populate.sql
    fs.appendFileSync(sqlFilePath, sqlContent);
    console.log("Successfully dumped demo analytics data to populate.sql!");
    process.exit(0);

  } catch (err) {
    console.error("Failed to dump data:", err);
    process.exit(1);
  }
};

dumpDemoData();
