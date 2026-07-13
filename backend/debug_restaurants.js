import pool from "./db.js";

const debugRestaurants = async () => {
  try {
    console.log("--- Debugging Restaurants ---");

    // 1. Check Restaurants count
    const resRestaurants = await pool.query("SELECT COUNT(*) FROM restaurants");
    console.log("Total Restaurants:", resRestaurants.rows[0].count);

    // 2. Check User Locations count
    const resLocations = await pool.query("SELECT COUNT(*) FROM user_locations");
    console.log("Total User Locations:", resLocations.rows[0].count);

    // 3. Check Restaurant Locations (in user_locations)
    const resRestLocations = await pool.query("SELECT COUNT(*) FROM user_locations WHERE restaurant_id IS NOT NULL");
    console.log("Total Restaurant Locations:", resRestLocations.rows[0].count);

    // 4. Check if get_distance_km exists
    const resFunc = await pool.query("SELECT proname FROM pg_proc WHERE proname = 'get_distance_km'");
    console.log("Function get_distance_km exists:", resFunc.rows.length > 0);

    // 5. List first 5 restaurants with their locations if any
    const resList = await pool.query(`
      SELECT r.restaurant_id, r.name, l.latitude, l.longitude 
      FROM restaurants r
      LEFT JOIN user_locations l ON r.restaurant_id = l.restaurant_id
      LIMIT 5
    `);
    console.log("Sample Restaurants:", resList.rows);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

debugRestaurants();
