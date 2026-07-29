import pool from '../db.js';

async function test() {
  try {
    const hours = [
      { day_of_week: 'monday', open_time: '09:30', close_time: '23:00' },
      { day_of_week: 'tuesday', open_time: '10:00', close_time: '22:00' }
    ];
    await pool.query("SELECT upsert_restaurant_hours(11, $1::jsonb)", [JSON.stringify(hours)]);
    const res = await pool.query("SELECT * FROM restaurant_hours WHERE restaurant_id = 11");
    console.log("Result:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
test();
