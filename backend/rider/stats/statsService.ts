import prisma from '../../prismaClient.js';
import redisClient from '../../utils/redisClient.js';

export const getDashboardData = async (riderId: number, { page = 1, limit = 5, lat, lon }: { page?: string | number, limit?: string | number, lat?: string | number, lon?: string | number }) => {
  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 5;
  const offset = (pageNum - 1) * limitNum;

  let riderLat = lat ? parseFloat(String(lat)) : null;
  let riderLon = lon ? parseFloat(String(lon)) : null;

  if (!riderLat || !riderLon) {
    if (redisClient.isOpen) {
      try {
        const geoPos = await redisClient.geoPos('active_riders', riderId.toString());
        if (geoPos && geoPos[0]) {
          riderLon = parseFloat(geoPos[0].longitude);
          riderLat = parseFloat(geoPos[0].latitude);
        }
      } catch (err) { /* ignore */ }
    }
  }

  if (!riderLat || !riderLon) {
    const loc = await prisma.user_locations.findFirst({
      where: { user_id: riderId },
    });
    if (loc) {
      riderLat = Number(loc.latitude);
      riderLon = Number(loc.longitude);
    }
  }

  // Active delivery
  const activeOrder = await prisma.orders.findFirst({
    where: {
      rider_id: riderId,
      status: 'out_for_delivery',
    },
    include: {
      restaurants: {
        include: {
          user_locations_restaurants_location_idTouser_locations: true,
        },
      },
      users_orders_user_idTousers: true,
      deliveries: true,
    },
  });

  let activeDelivery = null;
  if (activeOrder) {
    const restLoc = activeOrder.restaurants?.user_locations_restaurants_location_idTouser_locations;
    const del = activeOrder.deliveries?.[0];
    activeDelivery = {
      order_id: activeOrder.order_id,
      status: activeOrder.status,
      total_amount: activeOrder.total_amount,
      restaurant_name: activeOrder.restaurants?.name,
      restaurant_phone: activeOrder.restaurants?.phone,
      restaurant_email: activeOrder.restaurants?.email,
      restaurant_street: restLoc?.street,
      restaurant_city: restLoc?.city,
      customer_name: activeOrder.users_orders_user_idTousers?.name,
      customer_phone: activeOrder.users_orders_user_idTousers?.phone_number,
      dropoff_addr: del?.dropoff_addr,
      dropoff_latitude: del?.dropoff_latitude,
      dropoff_longitude: del?.dropoff_longitude,
      delivery_fee: 30.0,
      created_at: activeOrder.created_at,
      accepted_at: del?.start_time,
    };
  }

  // Available orders for pickup
  let availableOrdersRaw = [];
  let totalAvailable = 0;

  if (riderLat && riderLon) {
    const queryResult = await prisma.$queryRaw`
      SELECT
        o.order_id,
        o.status,
        o.total_amount,
        r.name AS restaurant_name,
        r.phone AS restaurant_phone,
        r.email AS restaurant_email,
        rl.street AS restaurant_street,
        rl.city AS restaurant_city,
        cu.name AS customer_name,
        cu.phone_number AS customer_phone,
        d.dropoff_addr,
        d.dropoff_latitude,
        d.dropoff_longitude,
        30.00::decimal(10, 2) AS delivery_fee,
        o.created_at,
        ROUND((6371 * acos(
          cos(radians(${riderLat})) * cos(radians(rl.latitude)) *
          cos(radians(rl.longitude) - radians(${riderLon})) +
          sin(radians(${riderLat})) * sin(radians(rl.latitude))
        ))::numeric, 2) AS distance_km
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN user_locations rl ON r.location_id = rl.location_id
      JOIN users cu ON o.user_id = cu.user_id
      JOIN deliveries d ON o.order_id = d.order_id
      WHERE o.status = 'ready_for_pickup'
        AND (o.rider_id IS NULL OR o.rider_id = ${riderId})
        AND (6371 * acos(
          cos(radians(${riderLat})) * cos(radians(rl.latitude)) *
          cos(radians(rl.longitude) - radians(${riderLon})) +
          sin(radians(${riderLat})) * sin(radians(rl.latitude))
        )) <= 5
      ORDER BY distance_km ASC, o.created_at ASC
      LIMIT ${limitNum} OFFSET ${offset};
    `;

    availableOrdersRaw = queryResult as unknown[];

    const countRes = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN user_locations rl ON r.location_id = rl.location_id
      WHERE o.status = 'ready_for_pickup'
        AND (o.rider_id IS NULL OR o.rider_id = ${riderId})
        AND (6371 * acos(
          cos(radians(${riderLat})) * cos(radians(rl.latitude)) *
          cos(radians(rl.longitude) - radians(${riderLon})) +
          sin(radians(${riderLat})) * sin(radians(rl.latitude))
        )) <= 5;
    `;
    totalAvailable = (countRes as {count: number}[])[0]?.count || 0;
  } else {
    // Fallback if no location is available yet
    const rawOrders = await prisma.orders.findMany({
      where: {
        status: 'ready_for_pickup',
        OR: [{ rider_id: null }, { rider_id: riderId }],
      },
      include: {
        restaurants: {
          include: {
            user_locations_restaurants_location_idTouser_locations: true,
          },
        },
        users_orders_user_idTousers: true,
        deliveries: true,
      },
      skip: offset,
      take: limitNum,
      orderBy: { created_at: 'asc' },
    });

    totalAvailable = await prisma.orders.count({
      where: {
        status: 'ready_for_pickup',
        OR: [{ rider_id: null }, { rider_id: riderId }],
      },
    });

    availableOrdersRaw = rawOrders.map((o) => {
      const restLoc = o.restaurants?.user_locations_restaurants_location_idTouser_locations;
      const del = o.deliveries?.[0];
      return {
        order_id: o.order_id,
        status: o.status,
        total_amount: o.total_amount,
        restaurant_name: o.restaurants?.name,
        restaurant_phone: o.restaurants?.phone,
        restaurant_email: o.restaurants?.email,
        restaurant_street: restLoc?.street,
        restaurant_city: restLoc?.city,
        customer_name: o.users_orders_user_idTousers?.name,
        customer_phone: o.users_orders_user_idTousers?.phone_number,
        dropoff_addr: del?.dropoff_addr,
        dropoff_latitude: del?.dropoff_latitude,
        dropoff_longitude: del?.dropoff_longitude,
        delivery_fee: 30.0,
        created_at: o.created_at,
        distance_km: null,
      };
    });
  }

  const totalPages = Math.ceil(totalAvailable / limitNum);

  return {
    activeDelivery,
    availableOrders: availableOrdersRaw,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalOrders: totalAvailable,
      limit: limitNum,
    },
  };
};

export const getEarnings = async (riderId: number) => {
  const weeklyEarnings = await prisma.$queryRaw`
    SELECT 
      TO_CHAR(DATE_TRUNC('day', o.delivered_at), 'Day') AS day,
      SUM(30.0)::float AS earnings,
      COUNT(o.order_id)::int AS orders,
      COALESCE(SUM(EXTRACT(EPOCH FROM (d.end_time - d.start_time))/3600), 0)::float AS hours
    FROM orders o
    JOIN deliveries d ON o.order_id = d.order_id
    WHERE o.rider_id = ${riderId} AND o.delivered_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE_TRUNC('day', o.delivered_at)
    ORDER BY DATE_TRUNC('day', o.delivered_at);
  `;

  const monthlyEarnings = await prisma.$queryRaw`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', o.delivered_at), 'Month') AS month,
      SUM(30.0)::float AS earnings,
      COUNT(o.order_id)::int AS orders,
      COALESCE(AVG(rev.rating), 0)::float AS avg_rating
    FROM orders o
    JOIN deliveries d ON o.order_id = d.order_id
    LEFT JOIN reviews rev ON o.order_id = rev.order_id AND rev.rider_id = o.rider_id
    WHERE o.rider_id = ${riderId} AND o.delivered_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', o.delivered_at)
    ORDER BY DATE_TRUNC('month', o.delivered_at);
  `;

  const peakHoursData = await prisma.$queryRaw`
    SELECT
      CASE
        WHEN EXTRACT(HOUR FROM o.delivered_at) >= 6 AND EXTRACT(HOUR FROM o.delivered_at) < 9 THEN '6-9 AM'
        WHEN EXTRACT(HOUR FROM o.delivered_at) >= 9 AND EXTRACT(HOUR FROM o.delivered_at) < 12 THEN '9-12 PM'
        WHEN EXTRACT(HOUR FROM o.delivered_at) >= 12 AND EXTRACT(HOUR FROM o.delivered_at) < 15 THEN '12-3 PM'
        WHEN EXTRACT(HOUR FROM o.delivered_at) >= 15 AND EXTRACT(HOUR FROM o.delivered_at) < 18 THEN '3-6 PM'
        WHEN EXTRACT(HOUR FROM o.delivered_at) >= 18 AND EXTRACT(HOUR FROM o.delivered_at) < 21 THEN '6-9 PM'
        WHEN EXTRACT(HOUR FROM o.delivered_at) >= 21 AND EXTRACT(HOUR FROM o.delivered_at) < 24 THEN '9-12 AM'
        ELSE 'Other'
      END AS time_slot,
      COUNT(o.order_id)::int AS orders,
      SUM(30.0)::float AS earnings
    FROM orders o
    JOIN deliveries d ON o.order_id = d.order_id
    WHERE o.rider_id = ${riderId} AND o.delivered_at >= NOW() - INTERVAL '7 days'
    GROUP BY time_slot
    ORDER BY time_slot;
  `;

  return {
    weekly: weeklyEarnings,
    monthly: monthlyEarnings,
    peakHours: peakHoursData,
  };
};

export const getRiderReviews = async (riderId: number, { page = 1, limit = 5 }: { page?: string | number, limit?: string | number }) => {
  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 5;
  const offset = (pageNum - 1) * limitNum;

  const where = { rider_id: riderId };

  const [totalItems, reviews, avgResult] = await Promise.all([
    prisma.reviews.count({ where }),
    prisma.reviews.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limitNum,
      include: {
        users: { select: { name: true } },
      },
    }),
    prisma.reviews.aggregate({
      where,
      _avg: { rating: true },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / limitNum);

  return {
    reviews: reviews.map((r) => ({
      review_id: r.review_id,
      rating: (r as {rating: number}).rating,
      comment: r.comment,
      created_at: r.created_at,
      user_name: r.users?.name || 'Anonymous',
    })),
    averageRating: avgResult._avg.rating ? Number(avgResult._avg.rating.toFixed(1)) : 0,
    currentPage: pageNum,
    totalPages,
    totalItems,
  };
};
