import pool from "../../db.js";
import { generateToken } from "../../utils/jwtGenerator.js";
import bcrypt from "bcrypt";
import { getIO } from "../../socket.js";

import cloudinary from "../../utils/cloudinary.js";
import fs from "fs";

export const signup = async (req, res) => {
  try {
    const { name, phone, email, latitude, longitude, password } = req.body;

    const restaurant = await pool.query(
      "SELECT * FROM restaurants where email = $1",
      [email]
    );
    if (restaurant.rows.length !== 0) {
      return res.status(409).json({ message: "restaurant already exists" });
    }

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Create restaurant without location
    const newRestaurant = await pool.query(
      "INSERT INTO restaurants (name,phone,email,password) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, phone, email, hashedPassword]
    );
    const newRestaurantId = newRestaurant.rows[0].restaurant_id;

    // 2. Create location and get its ID
    let location_id = null;
    if (latitude !== null && longitude !== null) {
      const locationResult = await pool.query(
        "INSERT INTO user_locations (restaurant_id, latitude, longitude) VALUES ($1, $2, $3) RETURNING location_id",
        [newRestaurantId, latitude, longitude]
      );
      location_id = locationResult.rows[0].location_id;

      // 3. Update restaurant with the new location_id
      await pool.query(
        "UPDATE restaurants SET location_id = $1 WHERE restaurant_id = $2",
        [location_id, newRestaurantId]
      );
    }

    generateToken(newRestaurantId, "restaurant", res);
    res.status(201).json({
      restaurant_id: newRestaurantId,
      name: newRestaurant.rows[0].name,
      phone: newRestaurant.rows[0].phone,
      email: newRestaurant.rows[0].email,
      location_id: location_id,
      average_rating: newRestaurant.rows[0].average_rating,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const restaurant = await pool.query(
      "SELECT * FROM restaurants WHERE email=$1",
      [email]
    );

    if (restaurant.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "user not found. check your email." });
    }
    const validpassword = await bcrypt.compare(
      password,
      restaurant.rows[0].password
    );
    if (!validpassword) {
      return res.status(401).json({ password: "invalid credentials" });
    }
    const restaurant_id = restaurant.rows[0].restaurant_id;
    generateToken(restaurant_id, "restaurant", res);
    res.status(200).json({
      message: "login successfull",
      restaurant_id: restaurant.rows[0].restaurant_id,
      name: restaurant.rows[0].name,
      phone: restaurant.rows[0].phone,
      email: restaurant.rows[0].email,
      location_id: restaurant.rows[0].location_id,
      average_rating: restaurant.rows[0].average_rating,
    });
  } catch (err) {
    console.log(err.message);
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
  const id = req.user.id;
  try {
    const restaurant = await pool.query(
      "SELECT * FROM restaurants where restaurant_id=$1",
      [id]
    );
    res.status(200).json({
      restaurant_id: restaurant.rows[0].restaurant_id,
      name: restaurant.rows[0].name,
      phone: restaurant.rows[0].phone,
      email: restaurant.rows[0].email,
      location_id: restaurant.rows[0].location_id,
      average_rating: restaurant.rows[0].average_rating,
    });
  } catch (err) {
    console.log("Error in verify controller:", err.message);
    res.status(500).json({ message: "Internal server error in verify" });
  }
};

export const add_menu = async (req, res) => {
  const id = req.user.id;
  const { category, name, description, price, is_available, discount } =
    req.body;

  if (!category || category.trim() === "") {
    return res.status(400).json({ message: "Category name is required" });
  }
  try {
    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "restaurant_menu_items",
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path); // Delete temp file after upload
    }
    if (!imageUrl) {
      imageUrl =
        "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop";
    }

    let categoryResult = await pool.query(
      `SELECT * FROM menu_categories WHERE restaurant_id = $1 AND name = $2`,
      [id, category]
    );

    if (categoryResult.rows.length === 0) {
      categoryResult = await pool.query(
        `INSERT INTO menu_categories (restaurant_id, name) VALUES($1, $2) RETURNING *`,
        [id, category.trim()]
      );
    }

    const category_id = categoryResult.rows[0].category_id;

    const discountValue = discount === "" ? null : discount;

    const newItem = await pool.query(
      `INSERT INTO menu_items 
      (category_id, name, description, price, is_available, discount, menu_item_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        category_id,
        name,
        description,
        price,
        is_available,
        discountValue,
        imageUrl,
      ]
    );
    if (newItem.rows.length > 0) {
      const item2 = await pool.query(
        "SELECT M.MENU_ITEM_ID,M.CATEGORY_ID,M.NAME,M.DESCRIPTION,M.PRICE,M.IS_AVAILABLE,M.MENU_ITEM_IMAGE_URL,M.DISCOUNT,C.NAME AS CATEGORY_NAME,C.MENU_CATEGORY_IMAGE_URL AS CATEGORY_IMAGE FROM MENU_ITEMS M JOIN MENU_CATEGORIES C ON (M.CATEGORY_ID = C.CATEGORY_ID) WHERE M.menu_item_id = $1",
        [newItem.rows[0].menu_item_id]
      );
      res.status(201).json({
        message: "Menu item added successfully",
        item: item2.rows[0],
      });
    } else {
      res.status(400).json({ message: "Menu item not added" });
    }
  } catch (err) {
    console.error("Error in add_menu controller:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const edit_menu = async (req, res) => {
  const restaurant_id = req.user.id;
  const menu_item_id = req.params.menu_item_id;

  const {
    name,
    description,
    price,
    is_available,
    discount,
    category,
    menu_item_image_url, // this is for fallback if no new image
  } = req.body;

  if (!category || category.trim() === "") {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    // Step 1: Check if the menu item exists and belongs to this restaurant
    const itemCheck = await pool.query(
      `SELECT mi.*, mc.restaurant_id FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.category_id
       WHERE mi.menu_item_id = $1 AND mc.restaurant_id = $2`,
      [menu_item_id, restaurant_id]
    );

    if (itemCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Menu item not found or not authorized" });
    }

    let imageUrl = menu_item_image_url;

    // Step 2: Handle image upload if new file provided
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      const oldImageUrl = itemCheck.rows[0].menu_item_image_url;
      if (oldImageUrl) {
        const parts = oldImageUrl.split("/");
        const publicIdWithExt = parts[parts.length - 1]; // e.g., abc123.jpg
        const publicId = `restaurant_menu_items/${
          publicIdWithExt.split(".")[0]
        }`;

        await cloudinary.uploader.destroy(publicId).catch(() => {
          console.warn("Previous image deletion failed or skipped.");
        });
      }

      // Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "restaurant_menu_items",
      });
      imageUrl = result.secure_url;

      // Remove temp file
      fs.unlinkSync(req.file.path);
    }

    // Step 3: Check or create category
    let categoryResult = await pool.query(
      `SELECT * FROM menu_categories WHERE restaurant_id = $1 AND name = $2`,
      [restaurant_id, category]
    );

    if (categoryResult.rows.length === 0) {
      categoryResult = await pool.query(
        `INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, $2) RETURNING *`,
        [restaurant_id, category]
      );
    }

    const category_id = categoryResult.rows[0].category_id;

    // Step 4: Perform the update
    const updatedItem = await pool.query(
      `UPDATE menu_items
       SET name = $1,
           description = $2,
           price = $3,
           is_available = $4,
           discount = $5,
           category_id = $6,
           menu_item_image_url = $7
       WHERE menu_item_id = $8
       RETURNING *`,
      [
        name,
        description,
        price,
        is_available,
        discount || null,
        category_id,
        imageUrl,
        menu_item_id,
      ]
    );

    res.status(200).json({
      status: "success",
      message: "Menu item updated successfully",
      item: updatedItem.rows[0],
    });
  } catch (err) {
    console.error("Error in edit_menu controller:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const change_menu_availability = async (req, res) => {
  const restaurant_id = req.user.id;
  const menu_item_id = req.params.menu_item_id;
  const { status } = req.body;

  try {
    // Make sure this item belongs to the authenticated restaurant
    const itemCheck = await pool.query(
      `SELECT mi.* FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.category_id
       WHERE mi.menu_item_id = $1 AND mc.restaurant_id = $2`,
      [menu_item_id, restaurant_id]
    );

    if (itemCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Menu item not found or unauthorized" });
    }

    // Update availability status
    const updateRes = await pool.query(
      `UPDATE menu_items SET is_available = $1 WHERE menu_item_id = $2 RETURNING *`,
      [status, menu_item_id]
    );

    return res.status(200).json({
      message: "Menu item availability updated",
      updatedItem: updateRes.rows[0],
    });
  } catch (err) {
    console.error("Error in change_menu_availability:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const delete_menu = async (req, res) => {
  const restaurant_id = req.user.id;
  const { menu_item_id } = req.params;
  console.log(restaurant_id, menu_item_id);

  try {
    const itemCheck = await pool.query(
      `SELECT mi.* FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.category_id
       WHERE mi.menu_item_id = $1 AND mc.restaurant_id = $2`,
      [menu_item_id, restaurant_id]
    );
    if (itemCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Menu item not found or not authorized" });
    }
    const update = await pool.query(
      "UPDATE menu_items set is_active = false WHERE menu_item_id = $1 returning *",
      [menu_item_id]
    );
    console.log(update.rows);
    res
      .status(200)
      .json({ status: "success", message: "Menu item deleted successfully" });
  } catch (err) {
    console.log("Error in delete_menu controller", err.message);
    res.status(500).json({ message: "internal server error" });
  }
};

export const get_menu = async (req, res) => {
  const restaurant_id = req.user.id;
  try {
    const item = await pool.query(
      `SELECT 
        M.MENU_ITEM_ID,
        M.CATEGORY_ID,
        M.NAME,M.DESCRIPTION,
        M.PRICE,M.IS_AVAILABLE,
        M.MENU_ITEM_IMAGE_URL,
        M.DISCOUNT,
        C.NAME AS CATEGORY_NAME,
        C.MENU_CATEGORY_IMAGE_URL AS CATEGORY_IMAGE 
      FROM MENU_ITEMS M 
      JOIN MENU_CATEGORIES C ON (M.CATEGORY_ID = C.CATEGORY_ID) 
      WHERE 
        C.RESTAURANT_ID = $1 AND M.is_active = true`,
      [restaurant_id]
    );
    res.json(item.rows);
  } catch (err) {
    console.log("Error in get_menu controller", err.message);
    res.status(500).json({ message: "internal server error" });
  }
};
export const get_menu_categories = async (req, res) => {
  const restaurant_id = req.user.id;
  try {
    const result = await pool.query(
      "SELECT DISTINCT c.name FROM menu_categories c JOIN menu_items m ON c.category_id = m.category_id WHERE c.restaurant_id = $1",
      [restaurant_id]
    );

    // Extract names into a flat array
    const categoryNames = result.rows.map((row) => row.name);
    categoryNames.unshift("All");
    res.json(categoryNames);
  } catch (err) {
    console.error("Error in get_categories:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  const id = req.user.id;
  const { prevPassword, newPassword } = req.body;
  try {
    const restaurant = await pool.query(
      "SELECT * FROM restaurants WHERE restaurant_id = $1",
      [id]
    );
    if (restaurant.rows.length === 0) {
      return res.status(404).json({ message: "restaurant not found" });
    }
    const validpassword = await bcrypt.compare(
      prevPassword,
      restaurant.rows[0].password
    );
    if (!validpassword) {
      return res.status(401).json({ password: "invalid previous password" });
    }

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query(
      "UPDATE restaurants SET password = $1 WHERE restaurant_id = $2",
      [hashedPassword, id]
    );
    res.status(200).json({ message: "Password changed successfully.." });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "server error. in change password.." });
  }
};

export const getRestaurantProfile = async (req, res) => {
  const restaurant_id = req.user.id;
  try {
    const restaurantQuery = `
      SELECT 
        r.restaurant_id,
        r.name AS restaurant_name,
        r.image_url,
        r.average_rating AS rating,
        r.phone,
        r.descriptions as description,
        r.email,
        l.street,
        l.city,
        l.postal_code,
        l.longitude,
        l.latitude,
        r.created_at
      FROM restaurants r
      LEFT JOIN user_locations l ON r.restaurant_id = l.restaurant_id
      WHERE r.restaurant_id = $1
    `;
    const restaurantRes = await pool.query(restaurantQuery, [restaurant_id]);
    if (restaurantRes.rowCount === 0) throw new Error("Restaurant not found");
    const r = restaurantRes.rows[0];

    const hoursQuery = `
      SELECT day_of_week, open_time, close_time
      FROM restaurant_hours
      WHERE restaurant_id = $1
      ORDER BY 
        CASE 
          WHEN day_of_week = 'Mon' THEN 1
          WHEN day_of_week = 'Tue' THEN 2
          WHEN day_of_week = 'Wed' THEN 3
          WHEN day_of_week = 'Thu' THEN 4
          WHEN day_of_week = 'Fri' THEN 5
          WHEN day_of_week = 'Sat' THEN 6
          WHEN day_of_week = 'Sun' THEN 7
          ELSE 8
        END
    `;
    const hoursRes = await pool.query(hoursQuery, [restaurant_id]);

    const backendData = {
      restaurant_name: r.restaurant_name,
      phone: r.phone,
      email: r.email,
      street: r.street,
      city: r.city,
      postal_code: r.postal_code,
      latitude: r.latitude,
      longitude: r.longitude,
      restaurant_image: r.image_url,
      rating: r.rating,
      created_at: r.created_at,
      description: r.description,
      delivery_settings: {
        delivery_fee: "",
        min_order: "",
        delivery_time: "",
        delivery_radius: "",
      },
      operating_hours: hoursRes.rows.map((h) => ({
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
      })),
    };
    res.json(backendData);
    return backendData;
  } catch (err) {
    console.error("Error in getRestaurantProfile:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editProfile = async (req, res) => {
  const restaurant_id = req.user.id;

  const {
    restaurant_name,
    phone,
    email,
    description,
    delivery_fee,
    min_order,
    delivery_time,
    delivery_radius,
    operating_hours: operatingHoursRaw,
    latitude,
    longitude,
    street,
    city,
    postal_code,
  } = req.body;

  let operating_hours = [];
  try {
    if (operatingHoursRaw) {
      operating_hours = JSON.parse(operatingHoursRaw);
    }
  } catch (err) {
    console.warn("Invalid JSON for operating_hours");
    return res.status(400).json({ message: "Invalid operating_hours format" });
  }

  try {
    const oldData = await pool.query(
      "SELECT image_url FROM restaurants WHERE restaurant_id = $1",
      [restaurant_id]
    );

    let imageUrl = oldData.rows[0]?.image_url || null;

    if (req.file) {
      if (imageUrl) {
        const parts = imageUrl.split("/");
        const filenameWithExt = parts[parts.length - 1];
        const publicId = `restaurant_profile/${filenameWithExt.split(".")[0]}`;

        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn("Image deletion failed:", err.message);
        }
      }

      const uploaded = await cloudinary.uploader.upload(req.file.path, {
        folder: "restaurant_profile",
      });
      imageUrl = uploaded.secure_url;
      fs.unlinkSync(req.file.path); // remove local temp file
    }

    await pool.query(
      `UPDATE restaurants 
       SET name = $1, phone = $2, image_url = $3, email = $4, descriptionS = $5 
       WHERE restaurant_id = $6`,
      [
        restaurant_name,
        phone,
        imageUrl,
        email,
        description,
        restaurant_id,
      ]
    );

    if (street || city || postal_code || latitude || longitude) {
      const locRes = await pool.query(
        "SELECT location_id FROM user_locations WHERE restaurant_id = $1",
        [restaurant_id]
      );

      if (locRes.rows.length > 0) {
        const location_id = locRes.rows[0].location_id;
        await pool.query(
          "UPDATE user_locations SET street = $1, city = $2, postal_code = $3, latitude=$4, longitude=$5 WHERE location_id = $6",
          [street, city, postal_code, latitude, longitude, location_id]
        );
      } else {
        await pool.query(
          "INSERT INTO user_locations (restaurant_id, street, city, postal_code,latitude,longitude) VALUES ($1, $2, $3, $4,$5,$6)",
          [restaurant_id, street, city, postal_code, latitude, longitude]
        );
      }
    }

    if (Array.isArray(operating_hours)) {
      if (operating_hours.length > 0) {
        await pool.query("SELECT upsert_restaurant_hours($1, $2::jsonb)", [
          restaurant_id,
          JSON.stringify(operating_hours),
        ]);
      } else {
        await pool.query("DELETE FROM restaurant_hours WHERE restaurant_id = $1", [restaurant_id]);
      }
    }

    res.status(200).json({
      message: "Profile updated successfully",
      image_url: imageUrl,
    });
  } catch (err) {
    console.error("Error in editProfile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const get_orders = async (req, res) => {
  const restaurant_id = req.user.id;
  try {
    const orders = await pool.query(
      `SELECT
        o.order_id,
        o.user_id AS customer_id,
        u.name AS customer_name,
        u.phone_number AS customer_phone,
        o.total_amount,
        o.status,
        p.method_type AS payment_method,
        d.dropoff_addr,
        o.created_at,
        o.rider_id,
        r.name AS rider_name,
        r.phone_number AS rider_phone,
        JSON_AGG(
          json_build_object(
          'order_id', oi.order_id,
          'quantity', oi.quantity,
          'menu_item_id', mi.menu_item_id,
          'name', mi.name,
          'price', mi.price,
          'menu_item_image_url',mi.menu_item_image_url
          )
        ) AS items
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      LEFT JOIN users r ON o.rider_id = r.user_id
      LEFT JOIN deliveries d ON o.order_id = d.order_id
      LEFT JOIN payments p ON o.order_id = p.order_id
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN menu_items mi ON mi.menu_item_id = oi.menu_item_id
      WHERE o.restaurant_id = $1
      GROUP BY o.order_id, u.name, u.phone_number, r.name, r.phone_number, d.dropoff_addr, p.method_type
      ORDER BY o.created_at DESC`,
      [restaurant_id]
    );
    res.status(200).json(orders.rows);
  } catch (err) {
    console.error("Error in get_orders controller:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (
    !["preparing", "restaurant_rejected", "ready_for_pickup"].includes(status)
  ) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      "UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *",
      [status, orderId]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderResult.rows[0];

    getIO()
      .to(`restaurant_${order.restaurant_id}`)
      .emit("order_status_updated", order);

    getIO()
      .to(`customer_${order.user_id}`)
      .emit("order_status_updated", order);

    await client.query(
      "INSERT INTO notifications (user_id, target_type, target_id, order_id, type, message) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        order.user_id,
        "user",
        order.user_id,
        orderId,
        "order_update",
        `Your order #${orderId} status has been updated to ${status}.`,
      ]
    );

    if (status === "ready_for_pickup") {
      const deliveryDetailsResult = await client.query(
        `SELECT
          o.*,
          r.name as restaurant_name,
          d.dropoff_addr,
          (
            2.0 + 
            (
              ST_Distance(
                ST_MakePoint(rl.longitude, rl.latitude)::geography,
                ST_MakePoint(d.dropoff_longitude, d.dropoff_latitude)::geography
              ) / 1000 
            ) * 0.50 
          )::decimal(10, 2) AS delivery_fee
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.restaurant_id
         JOIN deliveries d ON o.order_id = d.order_id
         JOIN user_locations rl on rl.restaurant_id = r.restaurant_id
         WHERE o.order_id = $1`,
        [orderId]
      );

      if (deliveryDetailsResult.rows.length > 0) {
        const deliveryDetails = deliveryDetailsResult.rows[0];
        const io = getIO();
        io.to("riders").emit("new_delivery", deliveryDetails);

        const availableRiders = await client.query(
          "SELECT user_id FROM rider_profiles WHERE is_available = true"
        );
        for (const rider of availableRiders.rows) {
          await client.query(
            "INSERT INTO notifications (user_id, target_type, target_id, order_id, type, message) VALUES ($1, $2, $3, $4, $5, $6)",
            [
              order.user_id,
              "rider",
              rider.user_id,
              orderId,
              "delivery_status",
              `A new delivery is available from ${deliveryDetails.restaurant_name}.`,
            ]
          );
        }
      }
    }

    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Order status updated successfully", order: order });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating order status:", error);
    res.status(500).send("Server error");
  } finally {
    client.release();
  }
};

export const getReviewsAll = async (req, res) => {
  const restaurantId = req.user.id;

  try {
    const reviews = await pool.query(
      `
      SELECT 
        r.review_id,
        r.rating, 
        r.comment, 
        r.created_at, 
        u.name AS user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      JOIN orders o ON o.order_id = r.order_id
      WHERE r.restaurant_id = $1
      ORDER BY r.created_at DESC
      `,
      [restaurantId]
    );

    res.status(200).json(reviews.rows);
  } catch (error) {
    console.error("Error fetching restaurant reviews:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getIndividualMenuReview = async (req, res) => {
  const restaurant_id = req.user.id;
  const { id: menu_item_id } = req.params;
  try {
    const reviews = await pool.query(
      `
      SELECT 
        r.review_id,
        r.rating, 
        r.comment, 
        r.created_at, 
        u.name AS user_name,
        mi.name AS menu_item_name,
        mi.menu_item_image_url,
        mi.description
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      JOIN orders o ON o.order_id = r.order_id
      JOIN order_items oi ON oi.order_id = o.order_id
      JOIN menu_items mi ON oi.menu_item_id = mi.menu_item_id
      WHERE r.restaurant_id = $1 AND mi.menu_item_id = $2
      ORDER BY r.created_at DESC
      `,
      [restaurant_id, menu_item_id]
    );

    res.status(200).json(reviews.rows);
  } catch (error) {
    console.error("Error fetching menu item reviews:", error);
    res.status(500).json({ message: "Server error" });
  }
};
