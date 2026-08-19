import prisma from "../../prismaClient.js";
import { AppError } from "../../middleware/errorHandler.js";
import redisClient from "../../utils/redisClient.js";
import { getIO } from "../../socket.js";

export const getRiderProfile = async (riderId) => {
  const user = await prisma.users.findUnique({
    where: { user_id: riderId },
    include: {
      rider_profiles: true,
      user_locations: {
        where: { is_primary: true },
        take: 1,
      },
    },
  });

  if (!user || user.role_id !== "rider") {
    throw new AppError("Rider not found", 404);
  }

  const loc = user.user_locations?.[0];

  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    phone_number: user.phone_number,
    vehicle_type: user.rider_profiles?.vehicle_type || null,
    current_location: user.rider_profiles?.current_location || null,
    is_available: user.rider_profiles?.is_available ?? true,
    latitude: loc?.latitude ? Number(loc.latitude) : null,
    longitude: loc?.longitude ? Number(loc.longitude) : null,
  };
};

export const updateRiderProfile = async (riderId, data) => {
  const { name, phone_number, phone, vehicle_type, latitude, longitude } = data;
  const phoneNumber = phone_number || phone || undefined;

  return await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.users.update({
      where: { user_id: riderId },
      data: {
        name: name || undefined,
        phone_number: phoneNumber,
      },
    });

    const updatedProfile = await tx.rider_profiles.upsert({
      where: { user_id: riderId },
      update: {
        vehicle_type: vehicle_type !== undefined ? vehicle_type : undefined,
      },
      create: {
        user_id: riderId,
        vehicle_type: vehicle_type || null,
        is_available: true,
      },
    });

    if (latitude != null && longitude != null) {
      const existingLoc = await tx.user_locations.findFirst({
        where: { user_id: riderId },
      });

      if (existingLoc) {
        await tx.user_locations.update({
          where: { location_id: existingLoc.location_id },
          data: {
            latitude: Number(latitude),
            longitude: Number(longitude),
            is_primary: true,
          },
        });
      } else {
        await tx.user_locations.create({
          data: {
            user_id: riderId,
            latitude: Number(latitude),
            longitude: Number(longitude),
            is_primary: true,
          },
        });
      }

      if (redisClient.isOpen) {
        try {
          await redisClient.geoAdd("active_riders", {
            longitude: Number(longitude),
            latitude: Number(latitude),
            member: riderId.toString(),
          });
        } catch (e) {}
      }
    }

    return {
      message: "Profile updated successfully",
      profile: {
        name: updatedUser.name,
        phone_number: updatedUser.phone_number,
        vehicle_type: updatedProfile.vehicle_type,
        is_available: updatedProfile.is_available,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
      },
    };
  });
};

export const updateRiderAvailability = async (riderId, isAvailable) => {
  const statusBool = Boolean(isAvailable);

  const updatedProfile = await prisma.rider_profiles.update({
    where: { user_id: riderId },
    data: { is_available: statusBool },
  });

  if (!statusBool && redisClient.isOpen) {
    try {
      await redisClient.zRem("active_riders", riderId.toString());
    } catch (e) {}
  }

  return {
    message: `Availability updated to ${statusBool ? "available" : "offline"}`,
    is_available: updatedProfile.is_available,
  };
};

export const getDashboardData = async (riderId, { page = 1, limit = 5, lat, lon }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 5;
  const offset = (pageNum - 1) * limitNum;

  let riderLat = lat ? parseFloat(lat) : null;
  let riderLon = lon ? parseFloat(lon) : null;

  if (!riderLat || !riderLon) {
    if (redisClient.isOpen) {
      try {
        const geoPos = await redisClient.geoPos("active_riders", riderId.toString());
        if (geoPos && geoPos[0]) {
          riderLon = parseFloat(geoPos[0].longitude);
          riderLat = parseFloat(geoPos[0].latitude);
        }
      } catch (err) {}
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

  // Active delivery (if rider is delivering an order right now)
  const activeOrder = await prisma.orders.findFirst({
    where: {
      rider_id: riderId,
      status: "out_for_delivery",
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

    availableOrdersRaw = queryResult;

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
    totalAvailable = countRes[0]?.count || 0;
  } else {
    // Fallback if no location is available yet
    const rawOrders = await prisma.orders.findMany({
      where: {
        status: "ready_for_pickup",
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
      orderBy: { created_at: "asc" },
    });

    totalAvailable = await prisma.orders.count({
      where: {
        status: "ready_for_pickup",
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

export const acceptOrder = async (riderId, orderIdRaw) => {
  const orderId = parseInt(orderIdRaw, 10);

  // Check if rider already has an active delivery
  const activeCheck = await prisma.orders.findFirst({
    where: {
      rider_id: riderId,
      status: "out_for_delivery",
    },
  });

  if (activeCheck) {
    throw new AppError("You can only have one active delivery at a time. Please complete your current delivery to accept new orders.", 400);
  }

  const order = await prisma.orders.findUnique({
    where: { order_id: orderId },
  });

  if (!order || order.status !== "ready_for_pickup") {
    throw new AppError("Order not found or not ready for pickup", 404);
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.orders.update({
      where: { order_id: orderId },
      data: {
        rider_id: riderId,
        status: "out_for_delivery",
      },
    });

    await tx.deliveries.updateMany({
      where: { order_id: orderId },
      data: { start_time: new Date() },
    });

    const riderUser = await tx.users.findUnique({
      where: { user_id: riderId },
      select: { user_id: true, name: true, phone_number: true },
    });

    await tx.notifications.create({
      data: {
        user_id: updated.user_id,
        target_type: "user",
        target_id: updated.user_id,
        order_id: orderId,
        type: "order_update",
        message: `Your order #${orderId} has been picked up by ${riderUser?.name || "the rider"}.`,
      },
    });

    return updated;
  });

  const io = getIO();
  io.to(`customer_${updatedOrder.user_id}`).emit("order_status_updated", updatedOrder);
  io.to(`restaurant_${updatedOrder.restaurant_id}`).emit("order_status_updated", updatedOrder);

  return updatedOrder;
};

export const updateOrderStatus = async (riderId, orderIdRaw, status) => {
  const orderId = parseInt(orderIdRaw, 10);

  const order = await prisma.orders.findUnique({
    where: { order_id: orderId },
  });

  if (!order || order.rider_id !== riderId) {
    throw new AppError("Order not found or not assigned to this rider", 404);
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const isDelivered = status === "delivered";

    const updated = await tx.orders.update({
      where: { order_id: orderId },
      data: {
        status,
        delivered_at: isDelivered ? new Date() : undefined,
      },
    });

    if (isDelivered) {
      await tx.deliveries.updateMany({
        where: { order_id: orderId },
        data: { end_time: new Date() },
      });
    }

    await tx.notifications.create({
      data: {
        user_id: updated.user_id,
        target_type: "user",
        target_id: updated.user_id,
        order_id: orderId,
        type: "order_update",
        message: `Your order #${orderId} status has been updated to ${status} by the rider.`,
      },
    });

    return updated;
  });

  const io = getIO();
  io.to(`customer_${updatedOrder.user_id}`).emit("order_status_updated", updatedOrder);
  io.to(`restaurant_${updatedOrder.restaurant_id}`).emit("order_status_updated", updatedOrder);

  return updatedOrder;
};

export const getOrderDetails = async (riderId, orderIdRaw) => {
  const orderId = parseInt(orderIdRaw, 10);

  const order = await prisma.orders.findUnique({
    where: { order_id: orderId },
    include: {
      restaurants: true,
      users_orders_user_idTousers: true,
      deliveries: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.rider_id !== null && order.rider_id !== riderId) {
    throw new AppError("Order not authorized for this rider", 403);
  }

  const del = order.deliveries?.[0];

  return {
    order_id: order.order_id,
    status: order.status,
    total_amount: order.total_amount,
    rider_id: order.rider_id,
    restaurant_name: order.restaurants?.name,
    restaurant_phone: order.restaurants?.phone,
    restaurant_email: order.restaurants?.email,
    customer_name: order.users_orders_user_idTousers?.name,
    customer_phone: order.users_orders_user_idTousers?.phone_number,
    dropoff_addr: del?.dropoff_addr,
    dropoff_latitude: del?.dropoff_latitude ? Number(del.dropoff_latitude) : null,
    dropoff_longitude: del?.dropoff_longitude ? Number(del.dropoff_longitude) : null,
    delivery_fee: 30.0,
    created_at: order.created_at,
    accepted_at: del?.start_time,
    delivered_at: order.delivered_at,
  };
};

export const getDeliveryHistory = async (riderId, { page = 1, limit = 10 }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const offset = (pageNum - 1) * limitNum;

  const where = {
    rider_id: riderId,
    status: "delivered",
  };

  const [totalItems, orders] = await Promise.all([
    prisma.orders.count({ where }),
    prisma.orders.findMany({
      where,
      orderBy: { delivered_at: "desc" },
      skip: offset,
      take: limitNum,
      include: {
        deliveries: true,
        restaurants: { select: { name: true } },
        users_orders_user_idTousers: { select: { name: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / limitNum);

  return {
    history: orders.map((o) => ({
      order_id: o.order_id,
      status: o.status,
      total_amount: o.total_amount,
      delivered_at: o.delivered_at,
      restaurant_name: o.restaurants?.name,
      customer_name: o.users_orders_user_idTousers?.name,
      dropoff_addr: o.deliveries?.[0]?.dropoff_addr,
    })),
    currentPage: pageNum,
    totalPages,
    totalItems,
  };
};

export const getEarnings = async (riderId) => {
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

export const getRiderReviews = async (riderId, { page = 1, limit = 5 }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 5;
  const offset = (pageNum - 1) * limitNum;

  const where = { rider_id: riderId };

  const [totalItems, reviews, avgResult] = await Promise.all([
    prisma.reviews.count({ where }),
    prisma.reviews.findMany({
      where,
      orderBy: { created_at: "desc" },
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
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      user_name: r.users?.name || "Anonymous",
    })),
    averageRating: avgResult._avg.rating ? Number(avgResult._avg.rating.toFixed(1)) : 0,
    currentPage: pageNum,
    totalPages,
    totalItems,
  };
};
