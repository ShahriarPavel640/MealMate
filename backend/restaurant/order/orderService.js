import prisma from "../../prismaClient.js";
import { AppError } from "../../middleware/errorHandler.js";
import { getIO } from "../../socket.js";

export const getRecentOrders = async (restaurantId) => {
  const orders = await prisma.orders.findMany({
    where: { restaurant_id: restaurantId },
    orderBy: { created_at: "desc" },
    take: 15,
    include: {
      users_orders_user_idTousers: { select: { name: true, phone_number: true } },
      order_items: {
        include: {
          menu_items: { select: { name: true, price: true } },
        },
      },
    },
  });

  return orders.map((order) => {
    const items = order.order_items.map((oi) => ({
      name: oi.menu_items?.name || "Unknown Item",
      quantity: oi.quantity || 1,
      price: parseFloat(oi.menu_items?.price ?? oi.price ?? 0),
    }));

    const calculatedTotal = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const customerUser = order.users_orders_user_idTousers;

    return {
      order_id: order.order_id,
      id: `#ORD-${String(order.order_id).padStart(3, "0")}`,
      customer: customerUser?.name || "Customer",
      customer_name: customerUser?.name || "Customer",
      phone: customerUser?.phone_number || "",
      customer_phone: customerUser?.phone_number || "",
      created_at: order.created_at,
      items,
      total: parseFloat(order.total_amount ? Number(order.total_amount).toFixed(2) : calculatedTotal.toFixed(2)),
      total_amount: parseFloat(order.total_amount ? Number(order.total_amount).toFixed(2) : calculatedTotal.toFixed(2)),
      status: order.status,
      orderTime: new Date(order.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      paymentMethod: order.payment_method || "Cash on Delivery",
    };
  });
};

export const getPaginatedOrders = async (restaurantId, { page = 1, limit = 5, status = "all" }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 5;
  const offset = (pageNum - 1) * limitNum;

  const where = { restaurant_id: restaurantId };
  if (status && status !== "all") {
    where.status = status;
  }

  const [totalItems, orders] = await Promise.all([
    prisma.orders.count({ where }),
    prisma.orders.findMany({
      where,
      orderBy: { order_id: "desc" },
      skip: offset,
      take: limitNum,
      include: {
        users_orders_user_idTousers: { select: { name: true, phone_number: true } },
        order_items: {
          include: {
            menu_items: { select: { name: true, price: true } },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / limitNum);

  const formattedOrders = orders.map((order) => {
    const items = order.order_items.map((oi) => ({
      name: oi.menu_items?.name || "Item",
      quantity: oi.quantity || 1,
      price: parseFloat(oi.menu_items?.price ?? oi.price ?? 0),
    }));

    const total = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const customerUser = order.users_orders_user_idTousers;

    return {
      order_id: order.order_id,
      id: `#ORD-${String(order.order_id).padStart(3, "0")}`,
      customer: customerUser?.name || "Customer",
      customer_name: customerUser?.name || "Customer",
      phone: customerUser?.phone_number || "",
      customer_phone: customerUser?.phone_number || "",
      address: order.dropoff_addr || "",
      dropoff_addr: order.dropoff_addr || "",
      items,
      total: parseFloat(order.total_amount ? Number(order.total_amount).toFixed(2) : total.toFixed(2)),
      total_amount: parseFloat(order.total_amount ? Number(order.total_amount).toFixed(2) : total.toFixed(2)),
      status: order.status,
      orderTime: new Date(order.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      created_at: order.created_at,
      estimatedTime: "25 min",
      paymentMethod: order.payment_method || "Credit Card",
      payment_method: order.payment_method || "Credit Card",
      special_instructions: order.special_instructions || null,
    };
  });

  return {
    data: formattedOrders,
    pagination: {
      totalItems,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
    },
  };
};

export const updateOrderStatus = async (restaurantId, orderIdRaw, newStatus) => {
  const match = String(orderIdRaw).match(/\d+/);
  const orderId = match ? parseInt(match[0], 10) : parseInt(orderIdRaw, 10);

  if (!orderId || isNaN(orderId)) {
    throw new AppError("Invalid order ID", 400);
  }

  const order = await prisma.orders.findFirst({
    where: {
      order_id: orderId,
      restaurant_id: restaurantId,
    },
  });

  if (!order) {
    throw new AppError("Order not found or unauthorized", 404);
  }

  if (newStatus === "cancelled" || newStatus === "restaurant_rejected") {
    if (order.status !== "pending" && order.status !== "pending_restaurant_acceptance" && order.status !== "pending_payment") {
      throw new AppError("Cannot cancel an order that is already being prepared or delivered", 400);
    }
  }

  const updatedOrder = await prisma.orders.update({
    where: { order_id: orderId },
    data: { 
      status: newStatus,
      updated_at: new Date(),
    },
  });

  try {
    const io = getIO();
    if (io) {
      io.to(`restaurant_${restaurantId}`).emit("order_status_updated", updatedOrder);
      if (order.user_id) {
        io.to(`customer_${order.user_id}`).emit("order_status_updated", updatedOrder);
      }
    }
  } catch (e) {
    // ignore if socket server is not connected
  }

  if (order.user_id) {
    try {
      await prisma.notifications.create({
        data: {
          user_id: order.user_id,
          target_type: "user",
          target_id: order.user_id,
          order_id: orderId,
          type: "order_update",
          message: `Your order #${orderId} status has been updated to ${newStatus}.`,
        },
      });
    } catch (e) {}
  }

  if (newStatus === "ready_for_pickup") {
    try {
      const deliveryDetails = await prisma.orders.findUnique({
        where: { order_id: orderId },
        include: {
          restaurants: {
            include: {
              user_locations: true,
            },
          },
          deliveries: true,
        },
      });

      if (deliveryDetails && deliveryDetails.restaurants?.user_locations) {
        const restLoc = deliveryDetails.restaurants.user_locations;
        let availableRiders = [];

        try {
          const redis = (await import("../../utils/redisClient.js")).default;
          if (redis.isOpen && restLoc.longitude && restLoc.latitude) {
            const nearbyRiderIds = await redis.geoRadius(
              "active_riders",
              { longitude: Number(restLoc.longitude), latitude: Number(restLoc.latitude) },
              5,
              "km"
            );

            for (const rId of nearbyRiderIds) {
              const isActive = await redis.get(`rider_active:${rId}`);
              if (isActive) {
                availableRiders.push({ user_id: parseInt(rId, 10) });
              }
            }
          }
        } catch (err) {}

        if (availableRiders.length === 0 && restLoc.longitude && restLoc.latitude) {
          const pgRiders = await prisma.$queryRaw`
            SELECT DISTINCT rp.user_id 
            FROM rider_profiles rp
            JOIN user_locations ul ON rp.user_id = ul.user_id
            WHERE rp.is_available = true 
              AND get_distance_km(${Number(restLoc.longitude)}, ${Number(restLoc.latitude)}, ul.longitude, ul.latitude) <= 5
          `;
          availableRiders = pgRiders;
        }

        const io = getIO();
        for (const rider of availableRiders) {
          if (io) {
            io.to(`rider_${rider.user_id}`).emit("new_delivery", deliveryDetails);
          }
          await prisma.notifications.create({
            data: {
              user_id: rider.user_id,
              target_type: "rider",
              target_id: rider.user_id,
              order_id: orderId,
              type: "delivery_status",
              message: `New delivery order #${orderId} available for pickup.`,
            },
          });
        }
      }
    } catch (err) {}
  }

  return updatedOrder;
};

export const getTodayOrderStats = async (restaurantId) => {
  const result = await prisma.$queryRaw`
    SELECT
      SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total_amount ELSE 0 END)::FLOAT AS revenue_today,
      SUM(CASE WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN total_amount ELSE 0 END)::FLOAT AS revenue_yesterday,
      COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END)::INT AS orders_today,
      COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN 1 END)::INT AS orders_yesterday
    FROM orders
    WHERE restaurant_id = ${restaurantId} AND status = 'delivered'
  `;

  const row = result[0] || {};
  const revenue_today = parseFloat(row.revenue_today) || 0;
  const revenue_yesterday = parseFloat(row.revenue_yesterday) || 0;
  const orders_today = parseInt(row.orders_today, 10) || 0;
  const orders_yesterday = parseInt(row.orders_yesterday, 10) || 0;

  const avgOrderValueToday = orders_today > 0 ? revenue_today / orders_today : 0;
  const avgOrderValueYesterday = orders_yesterday > 0 ? revenue_yesterday / orders_yesterday : 0;

  const calcChange = (today, yesterday) => {
    if (yesterday === 0) return { change: "+100%", type: "increase" };
    const diff = today - yesterday;
    const percent = ((diff / yesterday) * 100).toFixed(1);
    return {
      change: `${diff >= 0 ? "+" : ""}${percent}%`,
      type: diff >= 0 ? "increase" : "decrease",
    };
  };

  return [
    {
      title: "Today's Revenue",
      value: `Tk ${revenue_today.toFixed(2)}`,
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
};
