import prisma from "../../prismaClient.js";

export const fetchLastWeekRevenueByDay = async (restaurantId) => {
  const result = await prisma.$queryRaw`
    SELECT 
        TO_CHAR(created_at, 'Dy') AS day,
        DATE_TRUNC('day', created_at) AS date,
        SUM(total_amount)::float AS revenue,
        COUNT(*)::int AS orders
    FROM orders
    WHERE 
        status = 'delivered' 
        AND restaurant_id = ${restaurantId}
        AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY day, date
    ORDER BY date;
  `;

  return result.map((row) => ({
    day: row.day ? row.day.trim() : "",
    revenue: row.revenue || 0,
    orders: row.orders || 0,
  }));
};

export const fetchLastMonthRevenueByWeek = async (restaurantId) => {
  const result = await prisma.$queryRaw`
    SELECT
        TO_CHAR(DATE_TRUNC('week', created_at), 'Mon DD') AS week,
        DATE_TRUNC('week', created_at) AS week_start_date,
        SUM(total_amount)::FLOAT AS revenue,
        COUNT(*)::int AS orders
    FROM orders
    WHERE
        status = 'delivered'
        AND restaurant_id = ${restaurantId}
        AND created_at >= NOW() - INTERVAL '4 weeks'
    GROUP BY week, week_start_date
    ORDER BY week_start_date;
  `;

  return result.map((row) => ({
    week: row.week ? row.week.trim() : "",
    revenue: row.revenue || 0,
    orders: row.orders || 0,
  }));
};

export const fetchTopSellingItems = async (restaurantId) => {
  const result = await prisma.$queryRaw`
    SELECT 
      MI.name,
      SUM(OI.quantity)::int AS orders,
      ROUND(SUM(OI.quantity * OI.price)::NUMERIC, 2)::float AS revenue
    FROM order_items OI
    JOIN orders O ON O.order_id = OI.order_id
    JOIN menu_items MI ON MI.menu_item_id = OI.menu_item_id
    WHERE O.restaurant_id = ${restaurantId}
      AND O.status = 'delivered'
    GROUP BY MI.name
    ORDER BY orders DESC
    LIMIT 5;
  `;

  return result.map((row) => ({
    name: row.name,
    orders: parseInt(row.orders, 10) || 0,
    revenue: `Tk ${Number(row.revenue || 0).toFixed(2)}`,
  }));
};

export const fetchCategoryWiseSales = async (restaurantId) => {
  const result = await prisma.$queryRaw`
    SELECT 
      MC.name AS category_name,
      SUM(OI.quantity)::int AS total_sold
    FROM orders O
    JOIN order_items OI ON O.order_id = OI.order_id
    JOIN menu_items MI ON OI.menu_item_id = MI.menu_item_id
    JOIN menu_categories MC ON MI.category_id = MC.category_id
    WHERE O.status = 'delivered'
      AND O.restaurant_id = ${restaurantId}
      AND O.created_at >= NOW() - INTERVAL '1 month'
    GROUP BY MC.name
    ORDER BY total_sold DESC;
  `;

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

  return result.map((row, idx) => ({
    name: row.category_name,
    value: parseInt(row.total_sold, 10) || 0,
    color: colors[idx % colors.length],
  }));
};

export const fetchLastTwoWeekRevenue = async (restaurantId) => {
  const result = await prisma.$queryRaw`
    SELECT
      COALESCE(SUM(CASE 
        WHEN created_at >= NOW() - INTERVAL '7 days' THEN total_amount 
        ELSE 0 
      END), 0)::float AS last_week,
      
      COALESCE(SUM(CASE 
        WHEN created_at >= NOW() - INTERVAL '14 days' 
             AND created_at < NOW() - INTERVAL '7 days' 
        THEN total_amount 
        ELSE 0 
      END), 0)::float AS second_last_week
    FROM orders
    WHERE 
      restaurant_id = ${restaurantId} 
      AND status = 'delivered'
  `;

  return result[0] || { last_week: 0, second_last_week: 0 };
};

export const fetchLastTwoWeekOrderCount = async (restaurantId) => {
  const result = await prisma.$queryRaw`
    SELECT
      COUNT(*) FILTER (
        WHERE created_at >= NOW()::date - INTERVAL '7 days'
          AND created_at < NOW()::date + INTERVAL '1 day'
      )::int AS last_week,
      COUNT(*) FILTER (
        WHERE created_at >= NOW()::date - INTERVAL '14 days'
          AND created_at < NOW()::date - INTERVAL '7 days'
      )::int AS second_last_week
    FROM orders
    WHERE restaurant_id = ${restaurantId}
      AND status = 'delivered'
  `;

  return result[0] || { last_week: 0, second_last_week: 0 };
};

export const fetchLastTwoWeekNewCustomer = async (restaurantId) => {
  const result = await prisma.$queryRaw`
    SELECT
      COUNT(DISTINCT user_id) FILTER (
        WHERE created_at >= NOW()::date - INTERVAL '7 days'
          AND created_at < NOW()::date + INTERVAL '1 day'
      )::int AS last_week,
      COUNT(DISTINCT user_id) FILTER (
        WHERE created_at >= NOW()::date - INTERVAL '14 days'
          AND created_at < NOW()::date - INTERVAL '7 days'
      )::int AS second_last_week
    FROM orders
    WHERE restaurant_id = ${restaurantId} AND status = 'delivered'
  `;

  return result[0] || { last_week: 0, second_last_week: 0 };
};
