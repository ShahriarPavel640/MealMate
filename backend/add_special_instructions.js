import pool from "./db.js";

async function alterDB() {
    try {
        await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT");
        console.log("Successfully added special_instructions to orders");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
alterDB();
