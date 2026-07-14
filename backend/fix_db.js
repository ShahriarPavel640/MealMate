import pool from './db.js';

async function fix() {
  try {
    await pool.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tran_id_key;');
    console.log("Constraint dropped.");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
fix();
