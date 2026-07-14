import pool from './db.js';

const populateAnalytics = async () => {
  const restaurantId = 1;
  const numOrders = 150; // Populating 150 orders
  try {
    const usersRes = await pool.query("SELECT user_id FROM users");
    if(usersRes.rows.length === 0) {
      console.log("No customers found. Creating a dummy customer.");
      await pool.query("INSERT INTO users (name, email, password) VALUES ('Analytics Tester', 'tester@example.com', 'password')");
      usersRes.rows.push({user_id: 1}); // Failsafe
    }
    
    // Fetch users again just in case we created one
    const usersFinalRes = await pool.query("SELECT user_id FROM users");
    const users = usersFinalRes.rows.map(r => r.user_id);
    
    const menuRes = await pool.query("SELECT m.menu_item_id, m.price FROM menu_items m JOIN menu_categories c ON m.category_id = c.category_id WHERE c.restaurant_id = $1", [restaurantId]);
    if(menuRes.rows.length === 0) {
      console.log("No menu items found for restaurant 1");
      return;
    }
    const menuItems = menuRes.rows;

    // Mostly delivered
    const statuses = ["delivered", "delivered", "delivered", "delivered", "preparing", "ready_for_pickup", "cancelled"];
    
    for(let i=0; i<numOrders; i++) {
      const user_id = users[Math.floor(Math.random() * users.length)];
      // Random date between now and 30 days ago
      const date = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const numItems = Math.min(menuItems.length, Math.floor(Math.random() * 4) + 1); // 1 to 4 items
      let totalAmount = 0;
      const orderItems = [];
      
      // Shuffle menuItems and pick first numItems
      const shuffledItems = [...menuItems].sort(() => 0.5 - Math.random());
      const selectedItems = shuffledItems.slice(0, numItems);
      
      for(let j=0; j<numItems; j++) {
        const item = selectedItems[j];
        const quantity = Math.floor(Math.random() * 3) + 1;
        totalAmount += item.price * quantity;
        orderItems.push({menu_item_id: item.menu_item_id, quantity, price: item.price});
      }
      
      const orderRes = await pool.query(
        "INSERT INTO orders (user_id, restaurant_id, total_amount, status, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING order_id",
        [user_id, restaurantId, totalAmount, status, date]
      );
      
      const order_id = orderRes.rows[0].order_id;
      
      for(const oi of orderItems) {
         await pool.query(
           "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ($1, $2, $3, $4)",
           [order_id, oi.menu_item_id, oi.quantity, oi.price]
         );
      }
    }
    console.log(`Successfully populated ${numOrders} orders for analytics!`);
    process.exit(0);
  } catch(e) {
    console.error("Error populating:", e);
    process.exit(1);
  }
};
populateAnalytics();
