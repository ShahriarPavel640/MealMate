import pool from './db.js';
import fs from 'fs';
import path from 'path';

const populateReviews = async () => {
  const restaurantEmail = 'restaurant1@gmail.com';
  try {
    // Get restaurant ID
    const restRes = await pool.query("SELECT restaurant_id FROM restaurants WHERE email = $1", [restaurantEmail]);
    if (restRes.rows.length === 0) {
      console.log('Restaurant not found!');
      process.exit(1);
    }
    const restaurantId = restRes.rows[0].restaurant_id;

    // Get some customers
    const custRes = await pool.query("SELECT user_id FROM users WHERE role_id = 'customer' LIMIT 10");
    const customers = custRes.rows.map(r => r.user_id);
    
    if (customers.length === 0) {
      console.log('No customers found to write reviews.');
      process.exit(1);
    }

    // Get some completed orders for this restaurant
    const orderRes = await pool.query("SELECT order_id FROM orders WHERE restaurant_id = $1 LIMIT 20", [restaurantId]);
    const orders = orderRes.rows.map(r => r.order_id);

    if (orders.length === 0) {
      console.log('No orders found for this restaurant.');
      process.exit(1);
    }

    const reviews = [
      { rating: 5.0, comment: 'Amazing food, will definitely order again!' },
      { rating: 4.5, comment: 'Very good, just a bit late on delivery.' },
      { rating: 5.0, comment: 'Perfect portion sizes and delicious taste.' },
      { rating: 4.0, comment: 'Good value for money.' },
      { rating: 3.5, comment: 'Food was okay, nothing special.' },
      { rating: 5.0, comment: 'Absolutely loved the steak!' },
      { rating: 4.5, comment: 'Fries were a bit soggy, but burger was great.' },
      { rating: 5.0, comment: 'Best pizza in town.' },
      { rating: 4.5, comment: 'Really enjoyed the flavors.' },
      { rating: 3.0, comment: 'Not quite what I expected, but edible.' },
      { rating: 5.0, comment: 'Fantastic experience overall!' },
      { rating: 4.0, comment: 'Solid food, arrived warm.' }
    ];

    let insertQueries = `\n-- Inserted via populate_reviews.js\nINSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment) VALUES\n`;
    
    const values = [];
    const dbParams = [];
    let paramIndex = 1;

    for (let i = 0; i < Math.min(reviews.length, orders.length); i++) {
      const customerId = customers[i % customers.length];
      const orderId = orders[i];
      const review = reviews[i];
      
      values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
      dbParams.push(customerId, restaurantId, orderId, review.rating, review.comment);
      
      insertQueries += `(${customerId}, ${restaurantId}, ${orderId}, ${review.rating}, '${review.comment}')${i === Math.min(reviews.length, orders.length) - 1 ? ';' : ','}\n`;
    }

    await pool.query(`INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment) VALUES ${values.join(', ')}`, dbParams);
    
    console.log(`Successfully populated ${Math.min(reviews.length, orders.length)} reviews!`);

    // Append to populate.sql
    const rootDir = path.resolve();
    const populateSqlPath = path.join(rootDir, '..', 'populate.sql');
    if (fs.existsSync(populateSqlPath)) {
      fs.appendFileSync(populateSqlPath, insertQueries);
      console.log('Appended review data to populate.sql');
    } else {
      console.log('populate.sql not found at', populateSqlPath);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error populating reviews:', error);
    process.exit(1);
  }
};

populateReviews();
