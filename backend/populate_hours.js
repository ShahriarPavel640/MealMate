import pool from './db.js';

const run = async () => {
  try {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get all restaurants
    const res = await pool.query('SELECT restaurant_id FROM restaurants');
    const restaurants = res.rows;
    
    console.log(`Found ${restaurants.length} restaurants. Populating 24/7 hours...`);
    
    let count = 0;
    for (const r of restaurants) {
      for (const day of days) {
        // Insert or update to 24/7
        await pool.query(
          `INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time) 
           VALUES ($1, $2, '00:00:00', '23:59:59')
           ON CONFLICT (restaurant_id, day_of_week) 
           DO UPDATE SET open_time = '00:00:00', close_time = '23:59:59'`,
          [r.restaurant_id, day]
        );
        count++;
      }
    }
    console.log(`Successfully populated/updated ${count} operating hour records! All restaurants are now open 24/7.`);
  } catch (err) {
    console.error("Error populating hours:", err.message);
  } finally {
    pool.end();
  }
};

run();
