import pool from './db.js';

const checkRestaurants = async () => {
  try {
    const res = await pool.query('SELECT restaurant_id, name, email FROM restaurants');
    console.log("Restaurants:");
    console.table(res.rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
checkRestaurants();
