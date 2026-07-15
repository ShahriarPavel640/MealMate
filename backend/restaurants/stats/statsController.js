import pool from "../../db.js";

export const getLastWeekRevenueByDay = async (req, res) => {
  const restaurant_id = req.user.id;
  try {
    try {
      const result = await pool.query(
        `
        SELECT 
            TO_CHAR(created_at, 'Dy') AS day,
            DATE_TRUNC('day', created_at) AS date,
            SUM(total_amount)::float AS revenue,
            COUNT(*) AS orders
        FROM orders
        WHERE 
            status = 'delivered' 
            AND restaurant_id = $1
            AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY day, date
        ORDER BY date;
    `,
        [restaurant_id]
      );

      // Format result to match your desired structure
      const formatted = result.rows.map((row) => ({
        day: row.day.trim(), // Remove trailing spaces (e.g. 'Mon ')
        revenue: row.revenue,
        orders: row.orders,
      }));

      res.json(formatted);
    } catch (err) {
      console.error("Error fetching daily revenue:", err.message);
      res.status(500).json({ message: "Internal server error" });
    }
  } catch (err) {
    console.error("Error fetching daily revenue stats:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getLastMonthRevenueByWeek = async (req, res) => {
  const restaurant_id = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT
          TO_CHAR(DATE_TRUNC('week', created_at), 'Mon DD') AS week,
          DATE_TRUNC('week', created_at) AS week_start_date,
          SUM(total_amount)::FLOAT AS revenue,
          COUNT(*) AS orders
      FROM orders
      WHERE
          status = 'delivered'
          AND restaurant_id = $1
          AND created_at >= NOW() - INTERVAL '4 weeks'
      GROUP BY week, week_start_date
      ORDER BY week_start_date;
      `,
      [restaurant_id]
    );

    const formatted = result.rows.map((row) => ({
      week: row.week.trim(),
      revenue: row.revenue,
      orders: row.orders,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching weekly revenue:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTopSellingItems = async (req, res) => {
  const restaurant_id = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT 
        MI.name,
        SUM(OI.quantity) AS orders,
        ROUND(SUM(OI.quantity * OI.price)::NUMERIC, 2) AS revenue
      FROM order_items OI
      JOIN orders O ON O.order_id = OI.order_id
      JOIN menu_items MI ON MI.menu_item_id = OI.menu_item_id
      WHERE O.restaurant_id = $1
        AND O.status = 'delivered'
      GROUP BY MI.name
      ORDER BY orders DESC
      LIMIT 5;
      `,
      [restaurant_id]
    );

    const topItems = result.rows.map((row) => ({
      name: row.name,
      orders: parseInt(row.orders),
      revenue: `Tk ${Number(row.revenue).toFixed(2)}`,
    }));

    res.json(topItems);
  } catch (err) {
    console.error("Error fetching top items:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCategoryWiseSales = async (req, res) => {
  const restaurantId = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT 
        MC.name AS category_name,
        SUM(OI.quantity) AS total_sold
      FROM orders O
      JOIN order_items OI ON O.order_id = OI.order_id
      JOIN menu_items MI ON OI.menu_item_id = MI.menu_item_id
      JOIN menu_categories MC ON MI.category_id = MC.category_id
      WHERE O.status = 'delivered'
        AND O.restaurant_id = $1
        AND O.created_at >= NOW() - INTERVAL '1 month'
      GROUP BY MC.name
      ORDER BY total_sold DESC;
      `,
      [restaurantId]
    );

    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#FFD166",
      "#6A0572",
      "#118AB2",
    ];

    const formatted = result.rows.map((row, idx) => ({
      name: row.category_name,
      value: parseInt(row.total_sold),
      color: colors[idx % colors.length],
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching category sales:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getLastTwoWeekRevenue = async (req, res) => {
  const restaurant_id = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT
        COALESCE(SUM(CASE 
          WHEN   created_at >= NOW() - INTERVAL '7 days' THEN total_amount 
          ELSE 0 
        END), 0) AS last_week,
        
        COALESCE(SUM(CASE 
          WHEN   created_at   >= NOW() - INTERVAL '14 days' 
               AND   created_at   < NOW() - INTERVAL '7 days' 
          THEN total_amount 
          ELSE 0 
        END), 0) AS second_last_week
      FROM orders
      WHERE 
        restaurant_id = $1 
        AND status = 'delivered'
      `,
      [restaurant_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getting revenue:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLastTwoWeekOrderCount = async (req, res) => {
  const restaurant_id = req.user.id;
  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE created_at   >= NOW()::date - INTERVAL '7 days'
            AND created_at   < NOW()::date + INTERVAL '1 day'
        ) AS last_week,
        COUNT(*) FILTER (
          WHERE created_at   >= NOW()::date - INTERVAL '14 days'
            AND created_at   < NOW()::date - INTERVAL '7 days'
        ) AS second_last_week
      FROM orders
      WHERE restaurant_id = $1
        AND status = 'delivered'
      `,
      [restaurant_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error getting last two week order count:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getLastTwoWeekNewCustomer = async (req, res) => {
  const restaurant_id = req.user.id;

  try {
    const result = await pool.query(
      `
      WITH first_orders AS (
        SELECT user_id, MIN(created_at  ) AS first_order_date
        FROM orders
        WHERE restaurant_id = $1 AND status = 'delivered'
        GROUP BY user_id
      )
      SELECT
        COUNT(*) FILTER (
          WHERE first_order_date >= NOW()::date - INTERVAL '7 days'
            AND first_order_date < NOW()::date + INTERVAL '1 day'
        ) AS last_week,
        COUNT(*) FILTER (
          WHERE first_order_date >= NOW()::date - INTERVAL '14 days'
            AND first_order_date < NOW()::date - INTERVAL '7 days'
        ) AS second_last_week
      FROM first_orders
      `,
      [restaurant_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error in getLastTwoWeekNewCustomer:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
