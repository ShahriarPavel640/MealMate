import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres.nesuzbfybutrdmtrtgai",
  password: "2B||!2Bthatisthe?",
  host: "aws-0-ap-southeast-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

try {
  console.log("Connecting to Supabase...");
  const res = await pool.query("SELECT 1 as val");
  console.log("Success! Returned value:", res.rows[0].val);
  
  // Let's check if the restaurants table exists
  const tableCheck = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'restaurants'
    )
  `);
  console.log("Does 'restaurants' table exist?", tableCheck.rows[0].exists);

  if (tableCheck.rows[0].exists) {
    const countCheck = await pool.query("SELECT COUNT(*) FROM restaurants");
    console.log("Total restaurants in Supabase:", countCheck.rows[0].count);
  }
} catch (err) {
  console.error("Connection failed:", err);
} finally {
  await pool.end();
}
