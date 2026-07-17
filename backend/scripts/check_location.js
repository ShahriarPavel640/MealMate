import pool from './db.js';

const checkLocation = async () => {
  try {
    const res = await pool.query('SELECT restaurant_id, name, location_id FROM restaurants WHERE restaurant_id = 11');
    console.log(res.rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
checkLocation();
