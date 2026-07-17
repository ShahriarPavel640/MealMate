import pool from './db.js';

const fixEmail = async () => {
  try {
    await pool.query("UPDATE restaurants SET email = 'restaurant1@gmail.com' WHERE restaurant_id = 11");
    console.log("Email restored for restaurant 11");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
fixEmail();
