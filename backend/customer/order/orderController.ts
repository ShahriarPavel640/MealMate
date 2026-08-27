import { Request, Response, NextFunction } from 'express';
import * as orderService from './orderService.js';
import { getIO } from '@/socket.js';
import { AppError } from '@/middleware/errorHandler.js';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cartItems, specialInstructions } = req.body;
    const userId = Number(req.user!.id);
    if (isNaN(userId)) throw new AppError('Invalid user ID', 400);

    const createdOrders = await orderService.createCodOrder(userId, cartItems, specialInstructions);

    const io = getIO();
    for (const order of createdOrders) {
      // Emit a new order event to the restaurant
      io.to(`restaurant_${order.restaurant_id}`).emit('new_order', order);
    }

    res.status(201).json({
      message: 'Order placed successfully',
      orders: createdOrders,
    });
  } catch (err: any) {
    next(err);
  }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.user!.id);
    if (isNaN(userId)) throw new AppError('Invalid user ID', 400);
    const status = (req.query.status as string) as import('@prisma/client').order_status | undefined; const page = req.query.page ? Number(req.query.page) : undefined; const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const result = await orderService.getOrders(userId, status, page, limit);

    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const orderIdNum = Number(orderId);
    if (isNaN(orderIdNum)) throw new AppError('Invalid order ID', 400);

    const userId = Number(req.user!.id);
    if (isNaN(userId)) throw new AppError('Invalid user ID', 400);

    const fullOrder = await orderService.getOrderById(userId, orderIdNum);

    // Tests and frontend seem to expect an array containing the single order object
    res.status(200).json([fullOrder]);
  } catch (err: any) {
    next(err);
  }
};

export const getRealTimeLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const orderIdNum = Number(orderId);
    if (isNaN(orderIdNum)) throw new AppError('Invalid order ID', 400);

    const userId = Number(req.user!.id);
    if (isNaN(userId)) throw new AppError('Invalid user ID', 400);

    const locations = await orderService.getRealTimeLocation(userId, orderIdNum);

    res.status(200).json(locations);
  } catch (err: any) {
    next(err);
  }
};
