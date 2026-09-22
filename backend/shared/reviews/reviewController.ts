import { Request, Response, NextFunction } from 'express';
import * as reviewService from './reviewService.js';

export const submitRestaurantReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.user!.id);
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID' });
    const result = await reviewService.submitRestaurantReviewService(userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const submitRiderReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.user!.id);
    if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID' });
    const result = await reviewService.submitRiderReviewService(userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getRestaurantReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantIdRaw = req.params.restaurantId;
    const restaurantId = Number(restaurantIdRaw);
    if (isNaN(restaurantId)) return res.status(400).json({ message: 'Invalid restaurant ID' });
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const skip = (page - 1) * limit;

    const result = await reviewService.getRestaurantReviewsService(restaurantId, skip, limit, page);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getRiderReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riderIdRaw = req.user!.id;
    const riderId = Number(riderIdRaw);
    if (isNaN(riderId)) return res.status(400).json({ message: "Invalid rider ID" });
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const skip = (page - 1) * limit;

    const result = await reviewService.getRiderReviewsService(riderId, skip, limit, page);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
