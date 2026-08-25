import prisma from "../../prismaClient.js";
import { AppError } from "../../middleware/errorHandler.js";
import { getIO } from "../../socket.js";

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
