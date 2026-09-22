import { Request, Response, NextFunction } from 'express';
import {
  acceptOrder as acceptRiderOrder,
  updateOrderStatus as updateRiderOrderStatus,
  getOrderDetails as fetchOrderDetails,
  getDeliveryHistory as fetchDeliveryHistory,
} from './orderService.js';

export const getDeliveryHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riderIdRaw = req.user!.id;
    const riderId = Number(riderIdRaw);
    if (isNaN(riderId)) return res.status(400).json({ message: "Invalid rider ID" });
    const result = await fetchDeliveryHistory(riderId, req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const acceptOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riderIdRaw = req.user!.id;
    const riderId = Number(riderIdRaw);
    if (isNaN(riderId)) return res.status(400).json({ message: "Invalid rider ID" });
    const orderIdRaw = req.params.orderId;
    const orderId = Number(orderIdRaw);
    if (isNaN(orderId)) return res.status(400).json({ message: "Invalid order ID" });
    const order = await acceptRiderOrder(riderId, orderId);
    res.status(200).json({
      message: 'Order accepted successfully',
      order,
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riderIdRaw = req.user!.id;
    const riderId = Number(riderIdRaw);
    if (isNaN(riderId)) return res.status(400).json({ message: "Invalid rider ID" });
    const orderIdRaw = req.params.orderId;
    const orderId = Number(orderIdRaw);
    if (isNaN(orderId)) return res.status(400).json({ message: "Invalid order ID" });
    const { status } = req.body;
    const order = await updateRiderOrderStatus(riderId, orderId, status);
    res.status(200).json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riderIdRaw = req.user!.id;
    const riderId = Number(riderIdRaw);
    if (isNaN(riderId)) return res.status(400).json({ message: "Invalid rider ID" });
    const orderIdRaw = req.params.orderId;
    const orderId = Number(orderIdRaw);
    if (isNaN(orderId)) return res.status(400).json({ message: "Invalid order ID" });
    const order = await fetchOrderDetails(riderId, orderId);
    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
};
