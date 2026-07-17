import pool from './db.js';
import fs from 'fs';
import path from 'path';

const addMoreCategories = async () => {
  const restaurantEmail = 'restaurant1@gmail.com';
  try {
    const restRes = await pool.query("SELECT restaurant_id FROM restaurants WHERE email = $1", [restaurantEmail]);
    if (restRes.rows.length === 0) {
      console.error("Demo restaurant not found!");
      process.exit(1);
    }
    const restaurantId = restRes.rows[0].restaurant_id;

    const newCategories = ['Appetizers', 'Main Courses', 'Desserts & Beverages'];
    const insertedCategories = [];

    for (const cat of newCategories) {
      const catRes = await pool.query(
        "INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, $2) RETURNING category_id, name",
        [restaurantId, cat]
      );
      insertedCategories.push(catRes.rows[0]);
    }

    const menuItemsData = {
      'Appetizers': [
        { name: 'Garlic Bread', description: 'Toasted baguette with garlic butter and herbs.', price: 150, img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=500&q=60' },
        { name: 'Loaded Nachos', description: 'Crispy tortilla chips topped with cheese, jalapenos, and salsa.', price: 220, img: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=500&q=60' }
      ],
      'Main Courses': [
        { name: 'Grilled Salmon', description: 'Fresh salmon fillet served with roasted asparagus and lemon butter.', price: 850, img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=60' },
        { name: 'Steak Frites', description: 'Ribeye steak with crispy french fries and peppercorn sauce.', price: 1200, img: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=500&q=60' }
      ],
      'Desserts & Beverages': [
        { name: 'New York Cheesecake', description: 'Classic creamy cheesecake with a graham cracker crust.', price: 300, img: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=500&q=60' },
        { name: 'Iced Caramel Macchiato', description: 'Espresso combined with vanilla syrup, milk, and caramel over ice.', price: 180, img: 'https://images.unsplash.com/photo-1572490122747-3968b75bf699?auto=format&fit=crop&w=500&q=60' },
        { name: 'Fresh Mint Lemonade', description: 'Refreshing lemonade blended with fresh mint leaves.', price: 120, img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=60' }
      ]
    };

    let sqlContent = '\n\n-- MORE DEMO RESTAURANT CATEGORIES AND ITEMS --\n';
    sqlContent += 'INSERT INTO menu_categories (category_id, restaurant_id, name) VALUES \n';
    const categoryRows = insertedCategories.map(c => `(${c.category_id}, ${restaurantId}, '${c.name.replace(/'/g, "''")}')`);
    sqlContent += categoryRows.join(',\n') + ' ON CONFLICT DO NOTHING;\n\n';

    sqlContent += 'INSERT INTO menu_items (menu_item_id, category_id, name, description, price, is_available, is_active, menu_item_image_url) VALUES \n';
    const itemRows = [];

    for (const cat of insertedCategories) {
      const items = menuItemsData[cat.name];
      for (const item of items) {
        const res = await pool.query(
          "INSERT INTO menu_items (category_id, name, description, price, is_available, is_active, menu_item_image_url) VALUES ($1, $2, $3, $4, true, true, $5) RETURNING menu_item_id",
          [cat.category_id, item.name, item.description, item.price, item.img]
        );
        const itemId = res.rows[0].menu_item_id;
        itemRows.push(`(${itemId}, ${cat.category_id}, '${item.name.replace(/'/g, "''")}', '${item.description.replace(/'/g, "''")}', ${item.price}, true, true, '${item.img}')`);
      }
    }

    sqlContent += itemRows.join(',\n') + ' ON CONFLICT DO NOTHING;\n\n';

    const sqlFilePath = path.join(process.cwd(), '../populate.sql');
    fs.appendFileSync(sqlFilePath, sqlContent);
    
    console.log("Successfully added new categories and items, and updated populate.sql!");
    process.exit(0);
  } catch(e) {
    console.error("Error populating:", e);
    process.exit(1);
  }
};

addMoreCategories();
