import pool from "../../db.js";
import { getIO } from "../../socket.js";

export const getDashboardData = async (req, res) => {
  try {
    const riderId = req.user.id; // Assuming the rider's ID is available in the request object

    if (!riderId) {
      return res
        .status(400)
        .json({ message: "Rider ID not found in request." });
    }

    // Fetch available orders (status = 'pending') and calculate delivery fee, only within 10km radius
    // For this, you need the rider's current location. Let's assume you fetch it from user_locations table:
    const riderLocationResult = await pool.query(
      "SELECT latitude, longitude FROM user_locations WHERE user_id = $1 LIMIT 1",
      [riderId]
    );
    let availableOrders = { rows: [] };

    if (riderLocationResult.rows.length > 0) {
      const riderLat = riderLocationResult.rows[0].latitude;
      const riderLon = riderLocationResult.rows[0].longitude;

      availableOrders = await pool.query(
        `SELECT
          o.order_id,
          o.status,
          o.total_amount,
          r.name AS restaurant_name,
          r.phone AS restaurant_phone,
          r.email AS restaurant_email,
          cu.name AS customer_name,
          cu.phone_number AS customer_phone,
          d.dropoff_addr,
          d.dropoff_latitude,
          d.dropoff_longitude,
          get_distance_km(rl.longitude, rl.latitude, d.dropoff_longitude, d.dropoff_latitude) AS distance_km,
          30.00::decimal(10, 2) AS delivery_fee
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.restaurant_id
        JOIN user_locations rl ON r.location_id = rl.location_id
        JOIN users cu ON o.user_id = cu.user_id
        JOIN deliveries d ON o.order_id = d.order_id
        WHERE o.status = 'ready_for_pickup'
          AND get_distance_km($1, $2, d.dropoff_longitude, d.dropoff_latitude) <= 5
          AND get_distance_km($1, $2, rl.longitude, rl.latitude) <= 5
        ORDER BY o.updated_at DESC NULLS LAST`,
        [riderLon, riderLat]
      );
    }

    // Fetch assigned order with detailed information
    const assignedOrdersResult = await pool.query(
      `SELECT
        o.order_id,
        o.status AS order_status,
        o.total_amount,
        d.dropoff_addr,
        d.dropoff_latitude,
        d.dropoff_longitude,
        r.name AS restaurant_name,
        r.phone AS restaurant_phone,
        r.email AS restaurant_email,
        cu.name AS customer_name,
        cu.phone_number AS customer_phone,
        30.00::decimal(10, 2) AS delivery_fee
      FROM orders o
      JOIN deliveries d ON o.order_id = d.order_id
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN users cu ON o.user_id = cu.user_id
      WHERE o.rider_id = $1 AND o.status = 'out_for_delivery'`,
      [riderId]
    );

    const assignedOrders = assignedOrdersResult.rows;

    // Fetch rider's availability
    const riderProfile = await pool.query(
      "SELECT is_available FROM rider_profiles WHERE user_id = $1",
      [riderId]
    );

    res.status(200).json({
      availableOrders: availableOrders.rows,
      assignedOrders: assignedOrders,
      isAvailable: riderProfile.rows[0]?.is_available,
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getRiderProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await pool.query(
      "SELECT name, email, phone_number FROM users WHERE user_id = $1",
      [userId]
    );

    const riderProfile = await pool.query(
      "SELECT vehicle_type, is_available FROM rider_profiles WHERE user_id = $1",
      [userId]
    );

    const locationInfo = await pool.query(
      "SELECT latitude, longitude FROM user_locations WHERE user_id = $1 LIMIT 1",
      [userId]
    );

    if (user.rows.length === 0 || riderProfile.rows.length === 0) {
      return res.status(404).json({ message: "Rider profile not found" });
    }

    res.status(200).json({
      name: user.rows[0].name,
      email: user.rows[0].email,
      phone_number: user.rows[0].phone_number,
      vehicle_type: riderProfile.rows[0].vehicle_type,
      is_available: riderProfile.rows[0].is_available,
      latitude: locationInfo.rows.length > 0 ? locationInfo.rows[0].latitude : null,
      longitude: locationInfo.rows.length > 0 ? locationInfo.rows[0].longitude : null,
    });
  } catch (err) {
    console.error("Error fetching rider profile:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateRiderProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone_number, vehicle_type, longitude, latitude } = req.body;
    console.log(req.body);

    // Update users table
    await pool.query(
      "UPDATE users SET name = $1, phone_number = $2 WHERE user_id = $3",
      [name, phone_number, userId]
    );

    // Update rider_profiles table
    await pool.query(
      "UPDATE rider_profiles SET vehicle_type = $1 WHERE user_id = $2",
      [vehicle_type, userId]
    );
    const prevLocation = await pool.query(
      "SELECT * FROM user_locations WHERE user_id = $1",
      [userId]
    );
    if (prevLocation.rows.length > 0) {
      await pool.query(
        "UPDATE user_locations SET longitude = $1, latitude = $2 WHERE user_id = $3",
        [longitude, latitude, userId]
      );
    } else {
      await pool.query(
        "INSERT INTO user_locations (user_id, latitude, longitude) VALUES ($1,$2,$3)",
        [userId, latitude, longitude]
      );
    }

    res.status(200).json({ message: "Rider profile updated successfully" });
  } catch (err) {
    console.error("Error updating rider profile:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateRiderAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { is_available } = req.body;

    await pool.query(
      "UPDATE rider_profiles SET is_available = $1 WHERE user_id = $2",
      [is_available, userId]
    );

    res
      .status(200)
      .json({ message: "Rider availability updated successfully" });
  } catch (err) {
    console.error("Error updating rider availability:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDeliveryHistory = async (req, res) => {
  try {
    const riderId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!riderId) {
      return res
        .status(400)
        .json({ message: "Rider ID not found in request." });
    }

    const history = await pool.query(
      `SELECT
        o.order_id,
        o.status,
        o.total_amount,
        o.delivered_at,
        r.name AS restaurant_name,
        cu.name AS customer_name,
        d.dropoff_addr
      FROM orders o
      JOIN deliveries d ON o.order_id = d.order_id
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN users cu ON o.user_id = cu.user_id
      WHERE o.rider_id = $1 AND o.status = 'delivered'
      ORDER BY o.delivered_at DESC
      LIMIT $2 OFFSET $3`,
      [riderId, limit, offset]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM orders WHERE rider_id = $1 AND status = 'delivered'",
      [riderId]
    );
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      history: history.rows,
      currentPage: page,
      totalPages,
      totalItems
    });
  } catch (err) {
    console.error("Error fetching delivery history:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const acceptOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;

    await client.query("BEGIN");

    // Check if the rider already has an active order (status 'out_for_delivery')
    const activeCheck = await client.query(
      "SELECT order_id FROM orders WHERE rider_id = $1 AND status = 'out_for_delivery'",
      [riderId]
    );
    if (activeCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "You can only have one active delivery at a time. Please complete your current delivery to accept new orders." });
    }

    const updatedOrder = await client.query(
      "UPDATE orders SET rider_id = $1, status = 'out_for_delivery' WHERE order_id = $2 AND status = 'ready_for_pickup' RETURNING *",
      [riderId, orderId]
    );

    if (updatedOrder.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Order not found or not ready for pickup" });
    }

    await client.query(
      "UPDATE deliveries SET start_time = NOW() WHERE order_id = $1",
      [orderId]
    );

    // Fetch rider profile for notification
    const riderProfileResult = await client.query(
      "SELECT user_id, name, phone_number FROM users WHERE user_id = $1",
      [riderId]
    );
    const riderProfile = riderProfileResult.rows[0];

    // Fetch order details to get customer_id and restaurant_id
    const orderDetailsResult = await client.query(
      "SELECT user_id, restaurant_id FROM orders WHERE order_id = $1",
      [orderId]
    );
    const { user_id: customerId, restaurant_id: restaurantId } =
      orderDetailsResult.rows[0];

    // Emit order accepted event to restaurant and customer
    const io = getIO();
    io.to(`restaurant_${restaurantId}`).emit("order_accepted", {
      orderId,
      riderProfile,
    });
    io.to(`customer_${customerId}`).emit("order_accepted", {
      orderId,
      riderProfile,
    });

    // Store notification for the restaurant
    await client.query(
      "INSERT INTO notifications (user_id, target_type, target_id, order_id, type, message) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        riderId,
        "restaurant",
        restaurantId,
        orderId,
        "delivery_status",
        `Rider ${riderProfile.name} has accepted order #${orderId}.`,
      ]
    );

    // Emit event to all riders so they remove this delivery from their screen
    io.to("riders").emit("delivery_removed", { orderId });

    // Delete stale "new delivery" notifications for all OTHER riders
    await client.query(
      "DELETE FROM notifications WHERE target_type = 'rider' AND type = 'delivery_status' AND order_id = $1 AND user_id != $2",
      [orderId, riderId]
    );

    // Store notification for the customer
    await client.query(
      "INSERT INTO notifications (user_id, target_type, target_id, order_id, type, message) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        riderId,
        "user",
        customerId,
        orderId,
        "delivery_status",
        `Your order #${orderId} has been accepted by rider ${riderProfile.name}.`,
      ]
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "Order accepted successfully",
      order: updatedOrder.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error accepting order:", err.message);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const updateOrderStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const riderId = req.user.id;

    const validStatuses = ["out_for_delivery", "delivered"];
    if (!validStatuses.includes(status)) {
      client.release();
      return res.status(400).json({ message: "Invalid status update" });
    }

    await client.query("BEGIN");

    let updatedOrder;

    if (status === "delivered") {
      await client.query(
        "UPDATE payments SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE order_id = $1 AND method_type = 'cod' AND status = 'pending'",
        [orderId]
      );

      updatedOrder = await client.query(
        "UPDATE orders SET status = $1, delivered_at = NOW() WHERE order_id = $2 AND rider_id = $3 RETURNING *",
        [status, orderId, riderId]
      );
      await client.query(
        "UPDATE deliveries SET end_time = NOW() WHERE order_id = $1",
        [orderId]
      );
    } else {
      updatedOrder = await client.query(
        "UPDATE orders SET status = $1 WHERE order_id = $2 AND rider_id = $3 RETURNING *",
        [status, orderId, riderId]
      );
    }

    if (updatedOrder.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = updatedOrder.rows[0];

    // Notify customer and restaurant about order status update
    const io = getIO();
    io.to(`customer_${order.user_id}`).emit("order_status_updated", order);
    io.to(`restaurant_${order.restaurant_id}`).emit("order_status_updated", order);

    await client.query(
      "INSERT INTO notifications (user_id, target_type, target_id, order_id, type, message) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        order.user_id,
        "user",
        order.user_id,
        orderId,
        "order_update",
        `Your order #${orderId} status has been updated to ${status} by the rider.`,
      ]
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "Order status updated successfully",
      order: order,

    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating order status:", err.message);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id; // Ensure the rider is authorized to view this order

    const orderResult = await pool.query(
      `SELECT
        o.order_id,
        o.status,
        o.total_amount,
        o.rider_id,
        r.name AS restaurant_name,
        r.phone AS restaurant_phone,
        r.email AS restaurant_email,
        cu.name AS customer_name,
        cu.phone_number AS customer_phone,
        d.dropoff_addr,
        d.dropoff_latitude,
        d.dropoff_longitude,
        30.00::decimal(10, 2) AS delivery_fee,
        o.created_at,
        d.start_time AS accepted_at,
        o.delivered_at
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN users cu ON o.user_id = cu.user_id
      JOIN deliveries d ON o.order_id = d.order_id
      WHERE o.order_id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderResult.rows[0];

    // If the order is pending, any rider can view its details
    // A rider can view an order if it's not yet assigned to any rider (rider_id is NULL)
    // OR if it is assigned to the current rider.
    if (order.rider_id === null || order.rider_id === riderId) {
      return res.status(200).json({ order: order });
    }

    // If the order is assigned to a different rider, deny access.
    return res
      .status(403)
      .json({ message: "Order not authorized for this rider" });
  } catch (err) {
    console.error("Error fetching single order details:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEarnings = async (req, res) => {
  try {
    const riderId = req.user.id;

    // Weekly Earnings
    const weeklyEarnings = await pool.query(
      `SELECT 
        TO_CHAR(DATE_TRUNC('day', o.delivered_at), 'Day') AS day,
        SUM(30.0) AS earnings,
        COUNT(o.order_id) AS orders,
        COALESCE(SUM(EXTRACT(EPOCH FROM (d.end_time - d.start_time))/3600), 0) AS hours
      FROM orders o
      JOIN deliveries d ON o.order_id = d.order_id
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN user_locations rl ON r.location_id = rl.location_id
      WHERE o.rider_id = $1 AND o.delivered_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', o.delivered_at)
      ORDER BY DATE_TRUNC('day', o.delivered_at);`,
      [riderId]
    );

    // Monthly Earnings
    const monthlyEarnings = await pool.query(
      `SELECT 
        TO_CHAR(DATE_TRUNC('month', o.delivered_at), 'Month') AS month,
        SUM(30.0) AS earnings,
        COUNT(o.order_id) AS orders,
        AVG(rev.rating) AS avg_rating
      FROM orders o
      JOIN deliveries d ON o.order_id = d.order_id
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN user_locations rl ON r.location_id = rl.location_id
      LEFT JOIN reviews rev ON o.order_id = rev.order_id AND rev.rider_id = o.rider_id
      WHERE o.rider_id = $1 AND o.delivered_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', o.delivered_at)
      ORDER BY DATE_TRUNC('month', o.delivered_at);`,
      [riderId]
    );

    // Peak Hours Data
    const peakHoursData = await pool.query(
      `SELECT
        CASE
          WHEN EXTRACT(HOUR FROM o.delivered_at) >= 6 AND EXTRACT(HOUR FROM o.delivered_at) < 9 THEN '6-9 AM'
          WHEN EXTRACT(HOUR FROM o.delivered_at) >= 9 AND EXTRACT(HOUR FROM o.delivered_at) < 12 THEN '9-12 PM'
          WHEN EXTRACT(HOUR FROM o.delivered_at) >= 12 AND EXTRACT(HOUR FROM o.delivered_at) < 15 THEN '12-3 PM'
          WHEN EXTRACT(HOUR FROM o.delivered_at) >= 15 AND EXTRACT(HOUR FROM o.delivered_at) < 18 THEN '3-6 PM'
          WHEN EXTRACT(HOUR FROM o.delivered_at) >= 18 AND EXTRACT(HOUR FROM o.delivered_at) < 21 THEN '6-9 PM'
          WHEN EXTRACT(HOUR FROM o.delivered_at) >= 21 AND EXTRACT(HOUR FROM o.delivered_at) < 24 THEN '9-12 AM'
          ELSE 'Other'
        END AS time_slot,
        COUNT(o.order_id) AS orders,
        SUM(30.0) AS earnings
      FROM orders o
      JOIN deliveries d ON o.order_id = d.order_id
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN user_locations rl ON r.location_id = rl.location_id
      WHERE o.rider_id = $1 AND o.delivered_at >= NOW() - INTERVAL '7 days'
      GROUP BY time_slot
      ORDER BY time_slot;`,
      [riderId]
    );

    res.status(200).json({
      weekly: weeklyEarnings.rows,
      monthly: monthlyEarnings.rows,
      peakHours: peakHoursData.rows,
    });
  } catch (err) {
    console.error("Error fetching earnings data:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getRiderReviews = async (req, res) => {
  try {
    const riderId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const reviewsResult = await pool.query(
      `SELECT r.review_id, r.rating, r.comment, r.created_at, u.name AS user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.rider_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [riderId, limit, offset]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM reviews WHERE rider_id = $1",
      [riderId]
    );
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    const avgRatingResult = await pool.query(
      `SELECT COALESCE(AVG(rating), 0)::numeric(10,1) AS average_rating
       FROM reviews
       WHERE rider_id = $1`,
      [riderId]
    );

    res.status(200).json({
      reviews: reviewsResult.rows,
      averageRating: avgRatingResult.rows[0]?.average_rating || 0,
      currentPage: page,
      totalPages,
      totalItems
    });
  } catch (err) {
    console.error("Error fetching rider reviews:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
