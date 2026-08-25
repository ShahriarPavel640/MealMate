import {
  acceptOrder as acceptRiderOrder,
  updateOrderStatus as updateRiderOrderStatus,
  getOrderDetails as fetchOrderDetails,
  getDeliveryHistory as fetchDeliveryHistory,
} from "./orderService.js";

export const getDeliveryHistory = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const result = await fetchDeliveryHistory(riderId, req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const acceptOrder = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;
    const order = await acceptRiderOrder(riderId, orderId);
    res.status(200).json({
      message: "Order accepted successfully",
      order,
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await updateRiderOrderStatus(riderId, orderId, status);
    res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderDetails = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;
    const order = await fetchOrderDetails(riderId, orderId);
    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
};
