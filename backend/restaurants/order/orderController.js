import pool from "../../db.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
dayjs.extend(relativeTime);

export const getRecentOrders = async (req, res) => {
  const restaurantId = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT 
        O.order_id,
        O.status,
        O.total_amount,
        U.name AS customer,
        U.phone_number,
        O.created_at,
        MI.name AS menu_item_name,
        MI.price,
        OI.quantity
      FROM orders O
      JOIN users U ON O.user_id = U.user_id
      JOIN order_items OI ON O.order_id = OI.order_id
      JOIN menu_items MI ON OI.menu_item_id = MI.menu_item_id
      WHERE O.restaurant_id = $1
      ORDER BY O.created_at DESC
      LIMIT 15
      `,
      [restaurantId]
    );

    const ordersMap = {};

    for (const row of result.rows) {
      const orderId = row.order_id;

      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          id: `#ORD-${String(orderId).padStart(3, "0")}`,
          customer: row.customer,
          phone: row.phone_number,
          created_at: row.created_at,
          items: [],
          total: 0,
          status: row.status,
          orderTime: new Date(row.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          paymentMethod: row.payment_method,
        };
      }

      ordersMap[orderId].items.push({
        name: row.menu_item_name,
        quantity: row.quantity,
        price: parseFloat(row.price),
      });

      ordersMap[orderId].total += row.quantity * parseFloat(row.price);
    }

    const orders = Object.values(ordersMap).map((order) => ({
      ...order,
      total: parseFloat(order.total.toFixed(2)),
    }));

    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrders = async (req, res) => {
  const restaurantId = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT 
        O.order_id,
        O.status,
        O.created_at,
        U.name AS customer,
        U.phone_number,
        MI.name AS menu_item_name,
        MI.price,
        CI.quantity
      FROM orders O
      JOIN users U ON O.user_id = U.user_id
      JOIN carts C ON O.cart_id = C.cart_id
      JOIN cart_item CI ON CI.cart_id = C.cart_id
      JOIN menu_items MI ON CI.menu_item_id = MI.menu_item_id
      WHERE O.restaurant_id = $1
      ORDER BY O.order_id DESC
      `,
      [restaurantId]
    );

    const ordersMap = {};

    for (const row of result.rows) {
      const orderId = row.order_id;

      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          id: `#ORD-${String(orderId).padStart(3, "0")}`,
          customer: row.customer,
          phone: row.phone,
          address: row.address,
          items: [],
          total: 0,
          status: row.status,
          orderTime: new Date(row.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          estimatedTime: "25 min", // static placeholder
          paymentMethod: "Credit Card", // static placeholder
        };
      }

      ordersMap[orderId].items.push({
        name: row.menu_item_name,
        quantity: row.quantity,
        price: parseFloat(row.price),
      });

      ordersMap[orderId].total += row.quantity * parseFloat(row.price);
    }

    const orders = Object.values(ordersMap).map((order) => ({
      ...order,
      total: parseFloat(order.total.toFixed(2)),
    }));

    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

function extractOrderNumber(orderId) {
  const match = orderId.match(/\d+/); // matches one or more digits
  return match ? parseInt(match[0], 10) : null;
}

export const updateStatus = async (req, res) => {
  const restaurant_id = req.user.id;
  const { order_id, new_status } = req.body;

  console.log("order id: ", order_id);

  const order_id_new = extractOrderNumber(order_id);

  try {
    const result = await pool.query(
      "SELECT status FROM orders WHERE order_id = $1 AND restaurant_id = $2",
      [order_id_new, restaurant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    const currentStatus = result.rows[0].status;

    if (new_status === "cancelled") {
      if (currentStatus === "pending") {
        await pool.query(
          "UPDATE orders SET status = 'cancelled' WHERE order_id = $1 AND restaurant_id = $2",
          [order_id_new, restaurant_id]
        );
        return res.json({ message: "Order cancelled successfully." });
      } else {
        return res.json({ message: "YOU CAN NOT CANCEL THIS ORDER MAN :)" });
      }
    } else {
      await pool.query(
        "UPDATE orders SET status = $1 WHERE order_id = $2 AND restaurant_id = $3",
        [new_status, order_id_new, restaurant_id]
      );
      return res.json({ message: "Order status updated successfully." });
    }
  } catch (err) {
    console.error("Error updating order status:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const todaysOrderStat = async (req, res) => {
  const restaurant_id = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT
        -- Revenue
        SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total_amount ELSE 0 END)::FLOAT AS revenue_today,
        SUM(CASE WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN total_amount ELSE 0 END)::FLOAT AS revenue_yesterday,

        -- Orders
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) AS orders_today,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN 1 END) AS orders_yesterday
      FROM orders
      WHERE restaurant_id = $1 AND status = 'delivered'
      `,
      [restaurant_id]
    );

    let { revenue_today, revenue_yesterday, orders_today, orders_yesterday } =
      result.rows[0];

    revenue_today = parseFloat(revenue_today) || 0;
    revenue_yesterday = parseFloat(revenue_yesterday) || 0;
    orders_today = parseInt(orders_today, 10) || 0;
    orders_yesterday = parseInt(orders_yesterday, 10) || 0;

    const avgOrderValueToday =
      orders_today > 0 ? revenue_today / orders_today : 0;
    const avgOrderValueYesterday =
      orders_yesterday > 0 ? revenue_yesterday / orders_yesterday : 0;

    const calcChange = (today, yesterday) => {
      if (yesterday === 0) return { change: "+100%", type: "increase" };
      const diff = today - yesterday;
      const percent = ((diff / yesterday) * 100).toFixed(1);
      return {
        change: `${diff >= 0 ? "+" : ""}${percent}%`,
        type: diff >= 0 ? "increase" : "decrease",
      };
    };

    const stats = [
      {
        title: "Today's Revenue",
        value: `Tk ${revenue_today?.toFixed(2) || "0.00"}`,
        ...calcChange(revenue_today, revenue_yesterday),
        description: "vs yesterday",
      },
      {
        title: "Orders Today",
        value: `${orders_today}`,
        ...calcChange(orders_today, orders_yesterday),
        description: "vs yesterday",
      },
      {
        title: "Avg Order Value",
        value: `Tk ${avgOrderValueToday.toFixed(2)}`,
        ...calcChange(avgOrderValueToday, avgOrderValueYesterday),
        description: "vs yesterday",
      },
    ];

    res.json(stats);
  } catch (err) {
    console.error("Error in today's order stat:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
