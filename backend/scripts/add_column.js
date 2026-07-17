import pool from "./db.js";

async function alterDB() {
    try {
        await pool.query("ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true");
        console.log("Successfully added is_active to menu_items");
        
        // Let's also set it to true for any existing items
        await pool.query("UPDATE menu_items SET is_active = true WHERE is_active IS NULL");
        console.log("Successfully updated existing items to is_active = true");
        
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
alterDB();
