import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/middleware/errorHandler.js';
import {
  fetchLastWeekRevenueByDay,
  fetchLastMonthRevenueByWeek,
  fetchTopSellingItems,
  fetchCategoryWiseSales,
  fetchLastTwoWeekRevenue,
  fetchLastTwoWeekOrderCount,
  fetchLastTwoWeekNewCustomer,
} from './statsService.js';

export const getLastWeekRevenueByDay = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid ID', 400);
    const data = await fetchLastWeekRevenueByDay(restaurantId);
    res.json(data);
  } catch (err: any) {
    next(err);
  }
};

export const getLastMonthRevenueByWeek = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid ID', 400);
    const data = await fetchLastMonthRevenueByWeek(restaurantId);
    res.json(data);
  } catch (err: any) {
    next(err);
  }
};

export const getTopSellingItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid ID', 400);
    const data = await fetchTopSellingItems(restaurantId);
    res.json(data);
  } catch (err: any) {
    next(err);
  }
};

export const getCategoryWiseSales = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid ID', 400);
    const data = await fetchCategoryWiseSales(restaurantId);
    res.json(data);
  } catch (err: any) {
    next(err);
  }
};

export const getLastTwoWeekRevenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid ID', 400);
    const data = await fetchLastTwoWeekRevenue(restaurantId);
    res.json(data);
  } catch (err: any) {
    next(err);
  }
};

export const getLastTwoWeekOrderCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid ID', 400);
    const data = await fetchLastTwoWeekOrderCount(restaurantId);
    res.json(data);
  } catch (err: any) {
    next(err);
  }
};

export const getLastTwoWeekNewCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid ID', 400);
    const data = await fetchLastTwoWeekNewCustomer(restaurantId);
    res.json(data);
  } catch (err: any) {
    next(err);
  }
};
//test ci