import pool from "../../db.js";
import { generateToken } from "../../utils/jwtGenerator.js";
import bcrypt from "bcrypt";

export const signup = async (req, res) => {
  const {
    name,
    email,
    password,
    phone_number,
    vehicle_type,
    current_location,
    latitude,
    longitude,
    is_available = true,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check if the email already exists in the users table
    const existingUser = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length !== 0) {
      // If a user with the same email already exists, return an error
      return res.status(409).json({ message: "Email already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert into users table
    const newUser = await client.query(
      `INSERT INTO users (name, email, password, phone_number, role_id)
       VALUES ($1, $2, $3, $4, 'rider') RETURNING *`,
      [name, email, hashedPassword, phone_number]
    );

    const userId = newUser.rows[0].user_id;

    // Insert into rider_profiles table
    await client.query(
      `INSERT INTO rider_profiles (user_id, vehicle_type, current_location, is_available)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, vehicle_type, current_location, is_available]
    );

    // Insert into user_locations table so rider dashboard works immediately
    if (latitude && longitude) {
      await client.query(
        `INSERT INTO user_locations (user_id, latitude, longitude)
         VALUES ($1, $2, $3)`,
        [userId, latitude, longitude]
      );
    }

    await client.query("COMMIT");

    // Generate token and respond
    generateToken(userId, "rider", res);

    res.status(201).json({
      message: "Rider registered successfully",
      user_id: userId,
      name: newUser.rows[0].name,
      email: newUser.rows[0].email,
      phone_number: newUser.rows[0].phone_number,
      vehicle_type,
      current_location,
      is_available,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error during rider signup:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if the rider exists with role_id = 'rider'
    const rider = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role_id = 'rider'",
      [email]
    );

    if (rider.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Rider not found. Check your email." });
    }

    // 2. Compare passwords
    const validPassword = await bcrypt.compare(
      password,
      rider.rows[0].password
    );
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userId = rider.rows[0].user_id;

    // 3. Fetch rider profile info
    const profile = await pool.query(
      "SELECT vehicle_type, current_location, is_available FROM rider_profiles WHERE user_id = $1",
      [userId]
    );

    // 4. Generate JWT and set cookie
    generateToken(userId, "rider", res);

    // 5. Return rider info
    res.status(200).json({
      message: "Login successful",
      user_id: userId,
      name: rider.rows[0].name,
      email: rider.rows[0].email,
      phone_number: rider.rows[0].phone_number,
      vehicle_type: profile.rows[0]?.vehicle_type,
      current_location: profile.rows[0]?.current_location,
      is_available: profile.rows[0]?.is_available,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "internal server error" });
  }
};
export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.log("Error in logout controller", err.message);
    res.status(500).json({ message: "internal server error" });
  }
};

export const verify = async (req, res) => {
  try {
    const userId = req.user.id;
    const rider = await pool.query(
      "SELECT user_id, name, email, phone_number FROM users WHERE user_id = $1 AND role_id = 'rider'",
      [userId]
    );

    if (rider.rows.length === 0) {
      return res.status(404).json({ message: "Rider not found." });
    }

    const profile = await pool.query(
      "SELECT vehicle_type, current_location, is_available FROM rider_profiles WHERE user_id = $1",
      [userId]
    );

    res.status(200).json({
      user_id: rider.rows[0].user_id,
      name: rider.rows[0].name,
      email: rider.rows[0].email,
      phone_number: rider.rows[0].phone_number,
      vehicle_type: profile.rows[0]?.vehicle_type,
      current_location: profile.rows[0]?.current_location,
      is_available: profile.rows[0]?.is_available,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "internal server error" });
  }
};
