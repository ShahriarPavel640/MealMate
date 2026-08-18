import * as orderService from "./orderService.js";
import { getIO } from "../../socket.js";
import { AppError } from "../../middleware/errorHandler.js";

export const createOrder = async (req, res, next) => {
  try {
    const { cartItems, specialInstructions } = req.body;
    const userId = req.user.id;

    const createdOrders = await orderService.createCodOrder(
      userId,
      cartItems,
      specialInstructions
    );

    const io = getIO();
    for (const order of createdOrders) {
      // Emit a new order event to the restaurant
      io.to(`restaurant_${order.restaurant_id}`).emit("new_order", order);
    }

    res.status(201).json({
      message: "Order placed successfully",
      orders: createdOrders,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page, limit } = req.query;

    const result = await orderService.getOrders(userId, status, page, limit);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!orderId) throw new AppError("Order ID is required", 400);

    const fullOrder = await orderService.getOrderById(userId, orderId);

    // Tests and frontend seem to expect an array containing the single order object
    res.status(200).json([fullOrder]);
  } catch (err) {
    next(err);
  }
};

export const getRealTimeLocation = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!orderId) throw new AppError("Order ID is required", 400);

    const locations = await orderService.getRealTimeLocation(userId, orderId);

    res.status(200).json(locations);
  } catch (err) {
    next(err);
  }
};
