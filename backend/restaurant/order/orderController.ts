import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/errorHandler.js';
import {
  getRecentOrders as fetchRecentOrders,
  getPaginatedOrders,
  updateOrderStatus,
  getTodayOrderStats,
} from './orderService.js';

export const getRecentOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid restaurant ID', 400);
    const orders = await fetchRecentOrders(restaurantId);
    res.json(orders);
  } catch (err: any) {
    next(err);
  }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid restaurant ID', 400);
    const result = await getPaginatedOrders(restaurantId, req.query);
    res.json(result);
  } catch (err: any) {
    next(err);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    const orderIdRaw = String((req.params.orderId as string) || req.body.order_id);
    const match = orderIdRaw.match(/\d+/);
    const orderId = match ? Number(match[0]) : Number(orderIdRaw);

    if (isNaN(restaurantId) || isNaN(orderId)) {
      throw new AppError('Invalid ID', 400);
    }
    const newStatus = req.body.new_status || req.body.status;

    const updatedOrder = await updateOrderStatus(restaurantId, orderId, newStatus);
    res.json({
      message: 'Order status updated successfully.',
      order: updatedOrder,
    });
  } catch (err: any) {
    next(err);
  }
};

export const todaysOrderStat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid restaurant ID', 400);
    const stats = await getTodayOrderStats(restaurantId);
    res.json(stats);
  } catch (err: any) {
    next(err);
  }
};
