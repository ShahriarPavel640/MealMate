import pool from './db.js';
const run = async () => {
  try {
    await pool.query("DELETE FROM restaurant_hours WHERE restaurant_id = 1");
    console.log("Deleted operating hours for restaurant_id 1. It should now be 'Currently Unavailable'.");
  } catch(e) {
    console.log(e);
  } finally {
    pool.end();
  }
}
run();
