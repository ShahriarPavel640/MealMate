import pool from './db.js';

const checkUser = async () => {
  try {
    const res = await pool.query("SELECT * FROM restaurants WHERE email = 'restaurant1@gmail.com'");
    console.log(res.rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
checkUser();
