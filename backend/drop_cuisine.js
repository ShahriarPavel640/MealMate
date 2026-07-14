import pool from "./db.js";

async function alterDB() {
    try {
        await pool.query("ALTER TABLE restaurants DROP COLUMN IF EXISTS cuisine_type");
        console.log("Successfully dropped cuisine_type from restaurants");
    } catch (err) {
        console.error("Error dropping column:", err);
    } finally {
        process.exit();
    }
}

alterDB();
