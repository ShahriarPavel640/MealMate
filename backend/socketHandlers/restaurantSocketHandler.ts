import prisma from '../prismaClient.js';
import { getIO } from '../socket.js';
import logger from '../utils/logger.js';

export const handleRestaurantSocketEvents = (socket: any) => {
  socket.on('accept_order', async ({ orderId, restaurantId }: any) => {
    logger.info(`Socket accept_order: Order ID: ${orderId}, Restaurant ID: ${restaurantId}`);
    const io = getIO();
    try {
      const order = await prisma.orders.update({
        where: {
          order_id: parseInt(orderId, 10),
          restaurant_id: parseInt(restaurantId, 10),
        },
        data: { status: 'preparing' },
      });

      // Emit order status updated event to the restaurant & customer
      io.to(`restaurant_${restaurantId}`).emit('order_status_updated', order);
      io.to(`customer_${order.user_id}`).emit('order_status_updated', order);

      logger.info(`Order ${orderId} accepted by restaurant ${restaurantId}.`);
    } catch (error: any) {
      logger.error(`Error accepting order via socket: ${error.message}`);
    }
  });

  socket.on('reject_order', async ({ orderId, restaurantId }: any) => {
    logger.info(`Socket reject_order: Order ID: ${orderId}, Restaurant ID: ${restaurantId}`);
    const io = getIO();
    try {
      const order = await prisma.orders.update({
        where: {
          order_id: parseInt(orderId, 10),
          restaurant_id: parseInt(restaurantId, 10),
        },
        data: { status: 'restaurant_rejected' },
      });

      // Emit order status updated event to the restaurant & customer
      io.to(`restaurant_${restaurantId}`).emit('order_status_updated', order);
      io.to(`customer_${order.user_id}`).emit('order_status_updated', order);

      logger.info(`Order ${orderId} rejected by restaurant ${restaurantId}.`);
    } catch (error: any) {
      logger.error(`Error rejecting order via socket: ${error.message}`);
    }
  });
};
