import { generateToken } from "../../utils/jwtGenerator.js";
import bcrypt, { compareSync } from "bcrypt";
import pool from "../../db.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password, phone_number, latitude, longitude } =
      req.body;
    const role_id = "customer";

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length !== 0) {
      return res.status(409).json({ message: "user already exist" });
    }

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, phone_number, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, email, hashedPassword, phone_number, role_id]
    );

    let addressData = {
      latitude: null,
      longitude: null,
      street: "",
      city: "",
      postal_code: "",
    };

    if (latitude !== null && longitude !== null) {
      const locationResult = await pool.query(
        "INSERT INTO user_locations (user_id, latitude, longitude, is_primary) VALUES ($1, $2, $3, true) RETURNING *",
        [newUser.rows[0].user_id, latitude, longitude]
      );

      addressData.latitude = locationResult.rows[0].latitude;
      addressData.longitude = locationResult.rows[0].longitude;
    }

    generateToken(newUser.rows[0].user_id, "customer", res);

    res.status(201).json({
      message: "created successfully",
      user_id: newUser.rows[0].user_id,
      name: newUser.rows[0].name,
      email: newUser.rows[0].email,
      phone_number: newUser.rows[0].phone_number,
      role_id: newUser.rows[0].role_id,
      location: {
        latitude: addressData.latitude,
        longitude: addressData.longitude,
      },
      address: {
        street: addressData.street,
        city: addressData.city,
        postal_code: addressData.postal_code,
      },
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  console.log(req.body);

  try {
    //2. check if user dosen't exist

    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1 and role_id = 'customer'",
      [email]
    );

    if (user.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "user not found. check your email." });
    }

    //3. if it does check pass
    const validpassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validpassword) {
      return res.status(401).json({ password: "invalid credentials" });
    }

    //4. give them the jwt token
    const user_id = user.rows[0].user_id;
    generateToken(user_id, "customer", res);

    const addressResult = await pool.query(
      "SELECT longitude, latitude, street, city, postal_code FROM user_locations WHERE user_id = $1",
      [user.rows[0].user_id]
    );

    const address = addressResult.rows[0] || {};

    res.status(200).json({
      message: "Login successful",
      user_id: user.rows[0].user_id,
      name: user.rows[0].name,
      email: user.rows[0].email,
      phone_number: user.rows[0].phone_number,
      role_id: user.rows[0].role_id,
      location: {
        latitude: address.latitude ?? null,
        longitude: address.longitude ?? null,
      },
      address: {
        street: address.street ?? "",
        city: address.city ?? "",
        postal_code: address.postal_code ?? "",
      },
    });
  } catch (err) {
    console.log("Error in login controller", err.message);
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

export const changePassword = async (req, res) => {
  const id = req.user.id;
  const { prevPassword, newPassword } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE user_id = $1", [
      id,
    ]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const validpassword = await bcrypt.compare(
      prevPassword,
      user.rows[0].password
    );
    if (!validpassword) {
      return res.status(401).json({ password: "invalid previous password" });
    }

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query("UPDATE users SET password = $1 WHERE user_id = $2", [
      hashedPassword,
      id,
    ]);
    res.status(200).json({ message: "Password changed successfully.." });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "server error. in change password.." });
  }
};

export const varifyUser = async (req, res) => {
  const id = req.user.id;

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    const addressResult = await pool.query(
      "SELECT latitude, longitude, street, city, postal_code FROM user_locations WHERE user_id = $1 AND is_primary = true",
      [id]
    );

    const location = {
      latitude: addressResult.rows[0]?.latitude ?? null,
      longitude: addressResult.rows[0]?.longitude ?? null,
    };

    const address = {
      street: addressResult.rows[0]?.street ?? "",
      city: addressResult.rows[0]?.city ?? "",
      postal_code: addressResult.rows[0]?.postal_code ?? "",
    };

    res.status(200).json({
      message: "varified user",
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      role_id: user.role_id,
      location,
      address,
    });
  } catch (err) {
    console.log("Error in varifyUser", err.message);
    res.status(500).json({ message: "internal server error" });
  }
};

export const getProfile = async (req, res) => {
  const id = req.user.id;
  try {
    const result = await pool.query("SELECT * FROM users WHERE user_id =  $1", [
      id,
    ]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error in get profile:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  const id = req.user.id;
  const { name, phone, location, address } = req.body;

  const latitude = location?.lat;
  const longitude = location?.lng;

  const street = address?.street ?? "";
  const city = address?.city ?? "";
  const postal_code = address?.postal_code ?? "";

  try {
    let locationResult;

    // Update or insert location with lat/lng
    if (latitude != null && longitude != null) {
      locationResult = await pool.query(
        `UPDATE user_locations 
         SET latitude = $1, longitude = $2, street = $3, city = $4, postal_code = $5 
         WHERE user_id = $6 
         RETURNING *`,
        [latitude, longitude, street, city, postal_code, id]
      );

      if (locationResult.rowCount === 0) {
        await pool.query(
          `INSERT INTO user_locations 
           (user_id, latitude, longitude, street, city, postal_code, is_primary) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, latitude, longitude, street, city, postal_code, true]
        );
      }
    }

    // If lat/lng missing but address provided, update or insert address-only location
    else if (street || city || postal_code) {
      locationResult = await pool.query(
        `UPDATE user_locations 
         SET street = $1, city = $2, postal_code = $3 
         WHERE user_id = $4 
         RETURNING *`,
        [street, city, postal_code, id]
      );

      if (locationResult.rowCount === 0) {
        await pool.query(
          `INSERT INTO user_locations 
           (user_id, street, city, postal_code, is_primary) 
           VALUES ($1, $2, $3, $4, $5)`,
          [id, street, city, postal_code, true]
        );
      }
    }

    // Update name and phone
    const user = await pool.query(
      `UPDATE users 
       SET name = $1, phone_number = $2 
       WHERE user_id = $3 
       RETURNING *`,
      [name, phone, id]
    );

    const updatedUser = user.rows[0];
    console.log("Profile updated:", updatedUser);

    res.status(200).json({
      message: "Profile updated successfully",
      user_id: updatedUser.user_id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone_number: updatedUser.phone_number,
      role_id: updatedUser.role_id,
      address: {
        street: street,
        city: city,
        postal_code: postal_code,
      },
      location: {
        longitude: longitude,
        latitude: latitude,
      },
    });
  } catch (err) {
    console.error("Error in updateProfile:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
