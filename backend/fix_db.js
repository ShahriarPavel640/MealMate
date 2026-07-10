import pool from "./db.js";

const fixDatabase = async () => {
  try {
    console.log("--- Fixing Database ---");

    // 1. Enable PostGIS
    await pool.query("CREATE EXTENSION IF NOT EXISTS postgis");
    console.log("Enabled PostGIS extension");

    // 2. Create get_distance_km function
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION get_distance_km(
        lon1 DOUBLE PRECISION,
        lat1 DOUBLE PRECISION,
        lon2 DOUBLE PRECISION,
        lat2 DOUBLE PRECISION
      )
      RETURNS DOUBLE PRECISION AS $$
      BEGIN
        RETURN ST_Distance(
          ST_MakePoint(lon1, lat1)::geography,
          ST_MakePoint(lon2, lat2)::geography
        ) / 1000;
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    `;
    await pool.query(createFunctionQuery);
    console.log("Created get_distance_km function");

    // 3. Fix Restaurant Locations
    // Get all restaurants
    const restaurants = await pool.query("SELECT restaurant_id, name FROM restaurants");
    
    for (const r of restaurants.rows) {
      // Check if location exists
      const loc = await pool.query("SELECT * FROM user_locations WHERE restaurant_id = $1", [r.restaurant_id]);
      
      if (loc.rows.length === 0) {
        // Create location
        // Using random locations around Dhaka (23.8103, 90.4125)
        const lat = 23.8103 + (Math.random() - 0.5) * 0.1;
        const lon = 90.4125 + (Math.random() - 0.5) * 0.1;
        
        await pool.query(`
          INSERT INTO user_locations (restaurant_id, street, city, postal_code, latitude, longitude, is_primary)
          VALUES ($1, '123 Test St', 'Dhaka', '1212', $2, $3, false)
        `, [r.restaurant_id, lat, lon]);
        console.log(`Created location for ${r.name}`);
      } else {
        // Update invalid location if needed (0,0)
        const l = loc.rows[0];
        if (parseFloat(l.latitude) === 0 && parseFloat(l.longitude) === 0) {
           const lat = 23.8103 + (Math.random() - 0.5) * 0.1;
           const lon = 90.4125 + (Math.random() - 0.5) * 0.1;
           await pool.query(`
             UPDATE user_locations SET latitude = $1, longitude = $2 WHERE location_id = $3
           `, [lat, lon, l.location_id]);
           console.log(`Fixed invalid location for ${r.name}`);
        }
      }
    }

    console.log("Database fix completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error fixing database:", err.message);
    process.exit(1);
  }
};

fixDatabase();
