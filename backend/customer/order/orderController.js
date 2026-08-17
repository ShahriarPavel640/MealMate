import pool from "../../db.js";
import { getIO } from "../../socket.js";

// This is the new reusable function for creating orders.
// It's designed to be called from different parts of the application (e.g., COD checkout, payment confirmation).
// It takes a database client as an argument to run within a transaction.
export const createOrderFromCart = async (
  userId,
  cartItems,
  client,
  tran_id = null,
  status = "pending_restaurant_acceptance",
  specialInstructions = {}
) => {
  for (let item of cartItems) {
    const itemQuery = await client.query("SELECT price FROM menu_items WHERE menu_item_id = $1", [item.menu_item_id]);
    if (itemQuery.rows.length === 0) throw new Error("Menu item not found: " + item.menu_item_id);
    item.price = itemQuery.rows[0].price;
  }

  const ordersByRestaurant = cartItems.reduce((acc, item) => {
    const { restaurant_id } = item;
    if (!acc[restaurant_id]) {
      acc[restaurant_id] = [];
    }
    acc[restaurant_id].push(item);
    return acc;
  }, {});

  const createdOrders = [];

  for (const restaurantId in ordersByRestaurant) {
    const items = ordersByRestaurant[restaurantId];
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const instruction = specialInstructions[restaurantId] || "";
    const orderResult = await client.query(
      "INSERT INTO orders (user_id, restaurant_id, total_amount, status, tran_id, special_instructions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [userId, restaurantId, totalAmount, status, tran_id, instruction]
    );
    const order = orderResult.rows[0];
    createdOrders.push(order);

    for (const item of items) {
      await client.query(
        "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [order.order_id, item.menu_item_id, item.quantity, item.price]
      );
    }

    // Create a delivery record for the order
    const locationResult = await client.query(
      "SELECT * FROM user_locations WHERE user_id = $1 AND is_primary = true",
      [userId]
    );

    if (locationResult.rows.length > 0) {
      const location = locationResult.rows[0];
      const address = `${location.street}, ${location.city}, ${location.postal_code}`;
      await client.query(
        "INSERT INTO deliveries (order_id, restaurant_id, dropoff_latitude, dropoff_longitude, dropoff_addr) VALUES ($1, $2, $3, $4, $5)",
        [
          order.order_id,
          restaurantId,
          location.latitude,
          location.longitude,
          address,
        ]
      );
    } else {
      // Handle case where user has no primary location
      // For now, we'll just log a warning. In a real application, you might want to throw an error or use a default location.
      console.warn(
        `User ${userId} has no primary location. Could not create delivery record for order ${order.order_id}.`
      );
    }
  }
  return createdOrders;
};

// This is the handler for the COD (Cash on Delivery) case.
export const createOrder = async (req, res) => {
  const { cartItems, specialInstructions } = req.body;
  const userId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const createdOrders = await createOrderFromCart(userId, cartItems, client, null, "pending_restaurant_acceptance", specialInstructions);

    for (const order of createdOrders) {
      await client.query(
        "INSERT INTO payments (order_id, user_id, method_type, amount, status) VALUES ($1, $2, $3, $4, $5)",
        [order.order_id, userId, "cod", order.total_amount, "pending"]
      );
      
      // Fetch full order details to emit to restaurant
      const fullOrderResult = await client.query(
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
        WHERE o.order_id = $1
        GROUP BY o.order_id, u.name, u.phone_number, r.name, r.phone_number, d.dropoff_addr, p.method_type`,
        [order.order_id]
      );
      
      const fullOrder = fullOrderResult.rows[0] || order;

      // Emit a new order event to the restaurant
      const io = getIO();
      io.to(`restaurant_${order.restaurant_id}`).emit("new_order", fullOrder);

      // Store notification for the restaurant
      await client.query(
        "INSERT INTO notifications (user_id, target_type, target_id, order_id, type, message) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          userId,
          "restaurant",
          order.restaurant_id,
          order.order_id,
          "order_update",
          `You have a new order (#${order.order_id}) from a customer.`,
        ]
      );
    }

    // After creating the order, clear the user's active cart
    await client.query(
      "UPDATE carts SET status = 'completed' WHERE user_id = $1 AND status = 'active'",
      [userId]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Orders created successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating order:", error);
    res.status(500).send("Server error");
  } finally {
    client.release();
  }
};

export const getOrders = async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Fetch all orders for the user
    const ordersResult = await pool.query(
      `SELECT 
        o.order_id, 
        o.status, 
        o.total_amount, 
        o.created_at, 
        o.rider_id, 
        r.name as restaurant_name, 
        r.restaurant_id, 
        u.name as rider_name,
        d.dropoff_latitude,
        d.dropoff_longitude,
        EXISTS(SELECT 1 FROM reviews WHERE user_id = o.user_id AND restaurant_id = o.restaurant_id AND order_id = o.order_id) as has_restaurant_review,
        EXISTS(SELECT 1 FROM reviews WHERE user_id = o.user_id AND rider_id = o.rider_id AND order_id = o.order_id) as has_rider_review
      FROM orders o 
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id 
      LEFT JOIN users u ON o.rider_id = u.user_id 
      LEFT JOIN deliveries d ON o.order_id = d.order_id
      WHERE o.user_id = $1 
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const orders = ordersResult.rows;

    const countResult = await pool.query(`SELECT COUNT(*) FROM orders WHERE user_id = $1`, [userId]);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    if (orders.length === 0) {
      return res.json({ data: [], pagination: { totalItems, totalPages, currentPage: page, limit } }); // No orders found
    }

    // Get all order IDs
    const orderIds = orders.map((order) => order.order_id);

    // Fetch all items for these orders
    const itemsResult = await pool.query(
      `SELECT oi.order_id, oi.quantity, oi.price, mi.name as menu_item_name
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.menu_item_id
       WHERE oi.order_id = ANY($1::int[])`, // Use ANY for efficient lookup of multiple order IDs
      [orderIds]
    );
    const orderItems = itemsResult.rows;

    // Map items to their respective orders
    const ordersWithItems = orders.map((order) => {
      const itemsForThisOrder = orderItems.filter(
        (item) => item.order_id === order.order_id
      );
      return { ...order, items: itemsForThisOrder };
    });

    res.json({
      data: ordersWithItems,
      pagination: { totalItems, totalPages, currentPage: page, limit }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

export const getOrderDetails = async (req, res) => {
  const { orderId } = req.params;
    const userId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT oi.quantity, oi.price, mi.name as menu_item_name FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.menu_item_id JOIN orders o ON oi.order_id = o.order_id WHERE oi.order_id = $1 AND o.user_id = $2", [orderId, userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

