import pool from "../../db.js";

export const getAvailableOrders = async () => {
  const result = await pool.query(
    "SELECT * FROM orders WHERE status = 'pending'"
  );
  return result.rows;
};

export const getAssignedOrder = async (riderId) => {
  const result = await pool.query(
    "SELECT * FROM orders WHERE rider_id = $1 AND status IN ('preparing', 'out_for_delivery')",
    [riderId]
  );
  return result.rows[0];
};

export const getRiderAvailability = async (userId) => {
  const result = await pool.query(
    "SELECT is_available FROM rider_profiles WHERE user_id = $1",
    [userId]
  );
  return result.rows[0]?.is_available;
};

export const updateRiderAvailability = async (userId, isAvailable) => {
  const result = await pool.query(
    "UPDATE rider_profiles SET is_available = $1 WHERE user_id = $2 RETURNING *",
    [isAvailable, userId]
  );
  return result.rows[0];
};

export const acceptOrder = async (orderId, riderId) => {
  const result = await pool.query(
    "UPDATE orders SET rider_id = $1, status = 'preparing' WHERE order_id = $2 AND status = 'pending' RETURNING *",
    [riderId, orderId]
  );
  return result.rows[0];
};

export const updateOrderStatus = async (orderId, status) => {
  const result = await pool.query(
    "UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *",
    [status, orderId]
  );
  return result.rows[0];
};

export const getDeliveryHistory = async (riderId) => {
  const result = await pool.query(
    "SELECT * FROM orders WHERE rider_id = $1 AND status = 'delivered' ORDER BY delivered_at DESC",
    [riderId]
  );
  return result.rows;
};
