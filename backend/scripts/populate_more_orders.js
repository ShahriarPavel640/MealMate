import pool from './db.js';
import fs from 'fs';
import path from 'path';

const populateMoreOrders = async () => {
  const restaurantId = 11;
  const numOrders = 300;

  try {
    // 1. Fetch the new categories' IDs
    const catsRes = await pool.query(
      "SELECT category_id FROM menu_categories WHERE restaurant_id = $1 AND name IN ('Appetizers', 'Main Courses', 'Desserts & Beverages')",
      [restaurantId]
    );
    const categoryIds = catsRes.rows.map(c => c.category_id);

    if (categoryIds.length === 0) {
      console.error("New categories not found!");
      process.exit(1);
    }

    // 2. Fetch the menu items in these categories
    const itemsRes = await pool.query(
      "SELECT menu_item_id, price FROM menu_items WHERE category_id = ANY($1)",
      [categoryIds]
    );
    const menuItems = itemsRes.rows;

    if (menuItems.length === 0) {
      console.error("No menu items found in the new categories!");
      process.exit(1);
    }

    // 3. Fetch users
    const usersRes = await pool.query("SELECT user_id FROM users");
    const users = usersRes.rows.map(r => r.user_id);

    // 4. Generate orders
    const statuses = ["delivered", "delivered", "delivered", "delivered", "delivered", "cancelled"];
    
    let sqlContent = '\n\n-- MORE DEMO RESTAURANT ANALYTICS ORDERS --\n';
    const orderInserts = [];
    const orderItemInserts = [];

    for (let i = 0; i < numOrders; i++) {
      const user_id = users[Math.floor(Math.random() * users.length)];
      const date = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const numItems = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
      let totalAmount = 0;
      const orderItems = [];
      
      const shuffledItems = [...menuItems].sort(() => 0.5 - Math.random());
      const selectedItems = shuffledItems.slice(0, numItems);
      
      for (let j = 0; j < numItems; j++) {
        const item = selectedItems[j];
        const quantity = Math.floor(Math.random() * 2) + 1; // 1 to 2
        totalAmount += item.price * quantity;
        orderItems.push({ menu_item_id: item.menu_item_id, quantity, price: item.price });
      }
      
      const orderRes = await pool.query(
        "INSERT INTO orders (user_id, restaurant_id, total_amount, status, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING order_id",
        [user_id, restaurantId, totalAmount, status, date]
      );
      
      const order_id = orderRes.rows[0].order_id;
      orderInserts.push(`(${order_id}, ${user_id}, ${restaurantId}, ${totalAmount}, '${status}', '${date.toISOString()}')`);
      
      for (const oi of orderItems) {
         await pool.query(
           "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ($1, $2, $3, $4) ON CONFLICT (order_id, menu_item_id) DO NOTHING",
           [order_id, oi.menu_item_id, oi.quantity, oi.price]
         );
         orderItemInserts.push(`(${order_id}, ${oi.menu_item_id}, ${oi.quantity}, ${oi.price})`);
      }
    }

    sqlContent += 'INSERT INTO orders (order_id, user_id, restaurant_id, total_amount, status, created_at) VALUES \n';
    sqlContent += orderInserts.join(',\n') + ' ON CONFLICT DO NOTHING;\n\n';

    sqlContent += 'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES \n';
    sqlContent += orderItemInserts.join(',\n') + ' ON CONFLICT (order_id, menu_item_id) DO NOTHING;\n\n';

    const sqlFilePath = path.join(process.cwd(), '../populate.sql');
    fs.appendFileSync(sqlFilePath, sqlContent);

    console.log(`Successfully populated ${numOrders} orders for the new items and appended to populate.sql!`);
    process.exit(0);
  } catch(e) {
    console.error("Error populating:", e);
    process.exit(1);
  }
};

populateMoreOrders();
