import {
  getRecentOrders as fetchRecentOrders,
  getPaginatedOrders,
  updateOrderStatus,
  getTodayOrderStats
} from "./orderService.js";

export const getRecentOrders = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const orders = await fetchRecentOrders(restaurantId);
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const result = await getPaginatedOrders(restaurantId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const orderId = req.params.orderId || req.body.order_id;
    const newStatus = req.body.new_status || req.body.status;

    const updatedOrder = await updateOrderStatus(restaurantId, orderId, newStatus);
    res.json({
      message: "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
};

export const todaysOrderStat = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const stats = await getTodayOrderStats(restaurantId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
