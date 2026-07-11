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
    if (riderLocationResult.rows.length === 0) {
      return res.status(400).json({ message: "Rider location not found." });
    }
    const riderLat = riderLocationResult.rows[0].latitude;
    const riderLon = riderLocationResult.rows[0].longitude;

    const availableOrders = await pool.query(
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
        (
          2.0 +
          get_distance_km($1, $2, d.dropoff_longitude, d.dropoff_latitude) * 0.50
        )::decimal(10, 2) AS delivery_fee
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN user_locations rl ON r.location_id = rl.location_id
      JOIN users cu ON o.user_id = cu.user_id
      JOIN deliveries d ON o.order_id = d.order_id
      WHERE d.status = 'pending'
        AND get_distance_km($1, $2, d.dropoff_longitude, d.dropoff_latitude) <= 5
        AND get_distance_km($1, $2, rl.longitude, rl.latitude) <= 5
      ORDER BY distance_km ASC`,
      [riderLon, riderLat]
    );

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
        cu.phone_number AS customer_phone
      FROM orders o
      JOIN deliveries d ON o.order_id = d.order_id
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN users cu ON o.user_id = cu.user_id
      WHERE o.rider_id = $1 AND o.status IN ('preparing', 'ready_for_pickup', 'out_for_delivery')`,
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

    if (user.rows.length === 0 || riderProfile.rows.length === 0) {
      return res.status(404).json({ message: "Rider profile not found" });
    }

    res.status(200).json({
      name: user.rows[0].name,
      email: user.rows[0].email,
      phone_number: user.rows[0].phone_number,
      vehicle_type: riderProfile.rows[0].vehicle_type,
      is_available: riderProfile.rows[0].is_available,
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
        "UPDATE user_locations SET longitude = $1, latitude = $2",
        [longitude, latitude]
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
        o.delivered_at
      FROM orders o
      JOIN deliveries d ON o.order_id = d.order_id
      WHERE o.rider_id = $1 AND o.status = 'delivered'
      ORDER BY o.delivered_at DESC`,
      [riderId]
    );

    res.status(200).json(history.rows);
  } catch (err) {
    console.error("Error fetching delivery history:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user.id;

    // Check if the rider already has an active order (status 'preparing' or 'out_for_delivery')

    const updatedOrder = await pool.query(
      "UPDATE orders SET rider_id = $1, status = 'out_for_delivery' WHERE order_id = $2 AND status = 'ready_for_pickup' RETURNING *",
      [riderId, orderId]
    );

    if (updatedOrder.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Order not found or not ready for pickup" });
    }

    await pool.query(
      "UPDATE deliveries SET status = 'in_transit', start_time = NOW() WHERE order_id = $1",
      [orderId]
    );

    // Fetch rider profile for notification
    const riderProfileResult = await pool.query(
      "SELECT user_id, name, phone_number FROM users WHERE user_id = $1",
      [riderId]
    );
    const riderProfile = riderProfileResult.rows[0];

    // Fetch order details to get customer_id and restaurant_id
    const orderDetailsResult = await pool.query(
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
    await pool.query(
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

    // Store notification for the customer
    await pool.query(
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

    res.status(200).json({
      message: "Order accepted successfully",
      order: updatedOrder.rows[0],
    });
  } catch (err) {
    console.error("Error accepting order:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    let updatedOrder;

    if (status === "delivered") {
      await pool.query(
        "UPDATE payments SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE order_id = $1 AND method_type = 'cod' AND status = 'pending'",
        [orderId]
      );

      updatedOrder = await pool.query(
        "UPDATE orders SET status = $1, delivered_at = NOW() WHERE order_id = $2 RETURNING *",
        [status, orderId]
      );
      await pool.query(
        "UPDATE deliveries SET status = 'delivered', end_time = NOW() WHERE order_id = $1",
        [orderId]
      );
    } else {
      updatedOrder = await pool.query(
        "UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *",
        [status, orderId]
      );
    }

    if (updatedOrder.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder.rows[0],
    });
  } catch (err) {
    console.error("Error updating order status:", err.message);
    res.status(500).json({ message: "Server error" });
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
        d.dropoff_longitude
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

    if (orderResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Order not found or not authorized" });
    }

    res.status(200).json({ order: orderResult.rows[0] });
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
        SUM(2.0 + (ST_Distance(ST_MakePoint(rl.longitude, rl.latitude)::geography, ST_MakePoint(d.dropoff_longitude, d.dropoff_latitude)::geography) / 1000) * 0.50) AS earnings,
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
        SUM(2.0 + (ST_Distance(ST_MakePoint(rl.longitude, rl.latitude)::geography, ST_MakePoint(d.dropoff_longitude, d.dropoff_latitude)::geography) / 1000) * 0.50) AS earnings,
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
        SUM(2.0 + (ST_Distance(ST_MakePoint(rl.longitude, rl.latitude)::geography, ST_MakePoint(d.dropoff_longitude, d.dropoff_latitude)::geography) / 1000) * 0.50) AS earnings
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
