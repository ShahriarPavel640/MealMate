import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 5434,
  database: process.env.DB_NAME || "food_panda",
  max: 20,
});

// Log connection status
pool.query("SELECT NOW()")
  .then(res => console.log("Dockerized Database connected successfully. Current database time:", res.rows[0].now))
  .catch(err => console.error("Dockerized Database connection error details:", err));

export default pool;
