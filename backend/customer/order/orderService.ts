import { Prisma } from '@prisma/client';
import prisma from '../../prismaClient.js';
import { AppError } from '../../middleware/errorHandler.js';
import logger from '../../utils/logger.js';
import { z } from 'zod';
import { createOrderSchema } from './orderSchemas.js';

type CartItems = z.infer<typeof createOrderSchema>['cartItems'];
type SpecialInstructions = z.infer<typeof createOrderSchema>['specialInstructions'];

// This is the new reusable function for creating orders.
// It uses a Prisma Transaction Client (`tx`) to ensure atomicity.
export const createOrderFromCart = async (
  userId: number,
  cartItems: CartItems,
  tx: Prisma.TransactionClient,
  tran_id: string | null = null,
  status: string = 'pending_restaurant_acceptance',
  specialInstructions: SpecialInstructions = {}
) => {
  // Server-side price verification: Fetch actual prices from DB to prevent manipulation
  for (let item of cartItems) {
    const dbItem = await tx.menu_items.findUnique({
      where: { menu_item_id: item.menu_item_id },
      select: { price: true },
    });
    if (!dbItem) {
      throw new AppError(`Menu item not found: ${item.menu_item_id}`, 404);
    }
    item.price = dbItem.price.toNumber();
  }

  const ordersByRestaurant = cartItems.reduce((acc: Record<string, CartItems>, item: CartItems[0]) => {
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
    // Calculate total amount in memory, preserving decimal parsing
    const totalAmount = items.reduce(
      (sum: number, item: CartItems[0]) => sum + parseFloat(String(item.price)) * parseInt(String(item.quantity)),
      0
    );

    const instruction = specialInstructions[restaurantId] || '';

    const order = await tx.orders.create({
      data: {
        user_id: userId,
        restaurant_id: Number(restaurantId),
        total_amount: totalAmount,
        status: status as import('@prisma/client').order_status,
        tran_id: tran_id,
        special_instructions: instruction,
      },
    });
    createdOrders.push(order);

    for (const item of items) {
      await tx.order_items.create({
        data: {
          order_id: order.order_id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: parseFloat(String(item.price)),
        },
      });
    }

    // Create a delivery record for the order
    const location = await tx.user_locations.findFirst({
      where: {
        user_id: userId,
        is_primary: true,
      },
    });

    if (location) {
      const address = `${location.street}, ${location.city}, ${location.postal_code}`;
      await tx.deliveries.create({
        data: {
          order_id: order.order_id,
          restaurant_id: Number(restaurantId),
          dropoff_latitude: location.latitude,
          dropoff_longitude: location.longitude,
          dropoff_addr: address,
        },
      });
    } else {
      logger.warn(
        `User ${userId} has no primary location. Could not create delivery record for order ${order.order_id}.`
      );
    }
  }
  return createdOrders;
};

// Fetches the full order details needed for emitting Socket.IO events and frontend state
export const fetchFullOrderDetails = async (
  orderId: number,
  tx: Prisma.TransactionClient = prisma
) => {
  const result = await tx.$queryRaw<Array<{restaurant_id: number, customer_id: number, [key: string]: unknown}>>`
    SELECT
      o.order_id,
      o.restaurant_id,
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
        'menu_item_image_url', mi.menu_item_image_url
        )
      ) AS items
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN users r ON o.rider_id = r.user_id
    LEFT JOIN deliveries d ON o.order_id = d.order_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN menu_items mi ON mi.menu_item_id = oi.menu_item_id
    WHERE o.order_id = ${orderId}
    GROUP BY o.order_id, o.restaurant_id, u.name, u.phone_number, r.name, r.phone_number, d.dropoff_addr, p.method_type
  `;
  return result[0];
};

export const createCodOrder = async (userId: number, cartItems: CartItems, specialInstructions: SpecialInstructions) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Create the base orders from the cart items
    const createdOrders = await createOrderFromCart(
      userId,
      cartItems,
      tx,
      null,
      'pending_restaurant_acceptance',
      specialInstructions
    );

    const processedOrders = [];

    for (const order of createdOrders) {
      // 2. Create the COD payment record
      await tx.payments.create({
        data: {
          order_id: order.order_id,
          user_id: userId,
          method_type: 'cod',
          amount: order.total_amount,
          status: 'pending',
        },
      });

      // 3. Fetch full order details
      const fullOrder = await fetchFullOrderDetails(order.order_id, tx);
      processedOrders.push(fullOrder || order);

      // 4. Store notification for the restaurant
      await tx.notifications.create({
        data: {
          user_id: userId,
          target_type: 'restaurant',
          target_id: order.restaurant_id!,
          order_id: order.order_id,
          type: 'order_update',
          message: `You have a new order (#${order.order_id}) from a customer.`,
        },
      });
    }

    // 5. Clear the user's active cart
    await tx.carts.updateMany({
      where: {
        user_id: userId,
        status: 'active',
      },
      data: {
        status: 'completed',
      },
    });

    return processedOrders;
  });
};

export const getOrders = async (userId: number, status?: import('@prisma/client').order_status, page: number = 1, limit: number = 10) => {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  let whereClause: import('@prisma/client').Prisma.ordersWhereInput = { user_id: userId };

  if (status) {
    if (String(status) === 'ongoing') {
      whereClause.status = {
        in: ['pending_restaurant_acceptance', 'preparing', 'out_for_delivery'],
      };
    } else if (String(status) === 'past') {
      whereClause.status = {
        in: ['delivered', 'cancelled'],
      };
    } else {
      whereClause.status = status;
    }
  }

  const [totalCount, orders] = await Promise.all([
    prisma.orders.count({ where: whereClause }),
    prisma.orders.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip,
      take: limitNum,
      include: {
        restaurants: {
          select: {
            name: true,
            image_url: true,
          },
        },
        order_items: {
          include: {
            menu_items: {
              select: {
                name: true,
                price: true,
                menu_item_image_url: true,
              },
            },
          },
        },
        payments: {
          select: {
            method_type: true,
            status: true,
          },
        },
        deliveries: {
          take: 1,
          select: {
            dropoff_latitude: true,
            dropoff_longitude: true,
            dropoff_addr: true,
          },
        },
        reviews: {
          select: {
            restaurant_id: true,
            rider_id: true,
          },
        },
      },
    }),
  ]);

  // Map the results to match the structure expected by OrderHistoryPage and customer tests
  const formattedOrders = orders.map((o) => {
    const delivery = o.deliveries?.[0] || {};
    const hasRestaurantReview = o.reviews?.some((r) => r.restaurant_id != null) ?? false;
    const hasRiderReview = o.reviews?.some((r) => r.rider_id != null) ?? false;

    return {
      order_id: o.order_id,
      restaurant_id: o.restaurant_id,
      rider_id: o.rider_id,
      restaurant_name: o.restaurants?.name,
      restaurant_image: o.restaurants?.image_url,
      total_amount: o.total_amount,
      status: o.status,
      created_at: o.created_at,
      payment_method: o.payments?.method_type,
      payment_status: o.payments?.status,
      dropoff_latitude: delivery.dropoff_latitude,
      dropoff_longitude: delivery.dropoff_longitude,
      dropoff_addr: delivery.dropoff_addr,
      has_restaurant_review: hasRestaurantReview,
      has_rider_review: hasRiderReview,
      items: o.order_items.map((oi) => ({
        order_item_id: (oi as import('@prisma/client').order_items & { order_item_id?: number }).order_item_id,
        quantity: oi.quantity,
        price: oi.price,
        name: oi.menu_items?.name,
        image: oi.menu_items?.menu_item_image_url,
      })),
    };
  });

  const totalPages = Math.ceil(totalCount / limitNum) || 1;

  return {
    data: formattedOrders,
    orders: formattedOrders,
    pagination: {
      totalCount,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
    },
  };
};

export const getOrderById = async (userId: number, orderId: number) => {
  // Use queryRaw for the same complex flattening since we already wrote it above
  const result = await fetchFullOrderDetails(orderId, prisma);

  if (!result) {
    throw new AppError('Order not found', 404);
  }

  if (result.customer_id !== userId) {
    throw new AppError('Unauthorized access to order', 403);
  }

  return result;
};

export const getRealTimeLocation = async (userId: number, orderId: number) => {
  // Verify order ownership
  const order = await prisma.orders.findUnique({
    where: { order_id: orderId },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.user_id !== userId) {
    throw new AppError('Unauthorized access to order', 403);
  }

  if (!order.rider_id) {
    throw new AppError('No rider assigned yet', 400);
  }

  // Get rider's location
  const riderLocation = await prisma.user_locations.findFirst({
    where: {
      user_id: order.rider_id,
      is_primary: true,
    },
    select: {
      latitude: true,
      longitude: true,
    },
  });

  if (!riderLocation) {
    throw new AppError('Rider location not available', 404);
  }

  // Get dropoff location
  const delivery = await prisma.deliveries.findFirst({
    where: { order_id: orderId },
    select: {
      dropoff_latitude: true,
      dropoff_longitude: true,
    },
  });

  if (!delivery) {
    throw new AppError('Delivery information not found', 404);
  }

  return {
    rider: {
      latitude: riderLocation.latitude,
      longitude: riderLocation.longitude,
    },
    dropoff: {
      latitude: delivery.dropoff_latitude,
      longitude: delivery.dropoff_longitude,
    },
  };
};
