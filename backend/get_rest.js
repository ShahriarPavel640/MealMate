import pool from './db.js';
const query = async () => {
  const res = await pool.query("SELECT * FROM restaurants WHERE email = 'restaurant1@gmail.com'");
  console.log(res.rows[0]);
  const locRes = await pool.query("SELECT * FROM user_locations WHERE restaurant_id = $1", [res.rows[0].restaurant_id]);
  console.log(locRes.rows[0]);
  process.exit();
};
query();
