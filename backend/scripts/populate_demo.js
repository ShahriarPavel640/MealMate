import pool from './db.js';

const populateDemo = async () => {
  const restaurantEmail = 'restaurant1@gmail.com';
  const numOrders = 250;

  try {
    const restRes = await pool.query("SELECT restaurant_id FROM restaurants WHERE email = $1", [restaurantEmail]);
    if (restRes.rows.length === 0) {
      console.error("Demo restaurant not found!");
      process.exit(1);
    }
    const restaurantId = restRes.rows[0].restaurant_id;

    console.log(`Found demo restaurant ID: ${restaurantId}`);

    // Create a new category
    const catRes = await pool.query(
      "INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, $2) RETURNING category_id",
      [restaurantId, 'Signature Dishes']
    );
    const categoryId = catRes.rows[0].category_id;

    // Insert 6 menu items
    const menuItemsData = [
      { name: 'Truffle Mushroom Burger', description: 'A delicious burger with truffle mayo and wild mushrooms.', price: 450, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60' },
      { name: 'Spicy Chicken Wings', description: 'Crispy wings tossed in our signature hot sauce.', price: 320, img: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=500&q=60' },
      { name: 'Classic Margherita Pizza', description: 'Wood-fired pizza with fresh basil and mozzarella.', price: 650, img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=60' },
      { name: 'Beef Bolognese Pasta', description: 'Slow-cooked beef ragu with fresh pappardelle.', price: 550, img: 'https://images.unsplash.com/photo-1621996311210-911364d08b3e?auto=format&fit=crop&w=500&q=60' },
      { name: 'Caesar Salad', description: 'Crisp romaine, parmesan, croutons, and Caesar dressing.', price: 280, img: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=60' },
      { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with a gooey center.', price: 250, img: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=500&q=60' }
    ];

    const insertedMenuItems = [];
    for (const item of menuItemsData) {
      const res = await pool.query(
        "INSERT INTO menu_items (category_id, name, description, price, is_available, menu_item_image_url) VALUES ($1, $2, $3, $4, true, $5) RETURNING menu_item_id, price",
        [categoryId, item.name, item.description, item.price, item.img]
      );
      insertedMenuItems.push(res.rows[0]);
    }
    console.log(`Inserted ${insertedMenuItems.length} menu items.`);

    // Fetch users for orders
    let usersRes = await pool.query("SELECT user_id FROM users");
    if (usersRes.rows.length === 0) {
      console.log("No customers found. Creating a dummy customer.");
      await pool.query("INSERT INTO users (name, email, password) VALUES ('Analytics Tester', 'tester@example.com', 'password') RETURNING user_id");
      usersRes = await pool.query("SELECT user_id FROM users");
    }
    const users = usersRes.rows.map(r => r.user_id);

    // Generate orders
    const statuses = ["delivered", "delivered", "delivered", "delivered", "delivered", "cancelled"];
    
    for (let i = 0; i < numOrders; i++) {
      const user_id = users[Math.floor(Math.random() * users.length)];
      // Random date between now and 30 days ago
      const date = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const numItems = Math.floor(Math.random() * 3) + 1; // 1 to 3 distinct items
      let totalAmount = 0;
      const orderItems = [];
      
      const shuffledItems = [...insertedMenuItems].sort(() => 0.5 - Math.random());
      const selectedItems = shuffledItems.slice(0, numItems);
      
      for (let j = 0; j < numItems; j++) {
        const item = selectedItems[j];
        const quantity = Math.floor(Math.random() * 3) + 1; // 1 to 3 quantity
        totalAmount += item.price * quantity;
        orderItems.push({ menu_item_id: item.menu_item_id, quantity, price: item.price });
      }
      
      const orderRes = await pool.query(
        "INSERT INTO orders (user_id, restaurant_id, total_amount, status, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING order_id",
        [user_id, restaurantId, totalAmount, status, date]
      );
      
      const order_id = orderRes.rows[0].order_id;
      
      for (const oi of orderItems) {
         await pool.query(
           "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ($1, $2, $3, $4)",
           [order_id, oi.menu_item_id, oi.quantity, oi.price]
         );
      }
    }

    console.log(`Successfully populated ${numOrders} orders for the new menu items!`);
    process.exit(0);
  } catch(e) {
    console.error("Error populating:", e);
    process.exit(1);
  }
};

populateDemo();
