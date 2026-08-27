import { Request, Response, NextFunction } from 'express';
import redisClient from '@/utils/redisClient.js';
import * as aiService from './aiService.js';

export const generateMenuDescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const description = await aiService.generateMenuDescriptionService(name);
    res.status(200).json({ description });
  } catch (err) {
    next(err);
  }
};

export const summarizeReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantIdRaw = req.params.restaurantId;
    const restaurantId = Number(restaurantIdRaw);
    if (isNaN(restaurantId)) {
      return res.status(400).json({ message: 'Invalid restaurant ID' });
    }

    const cacheKey = `cache:review_summary:${restaurantId}`;
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.status(200).json({ summary: cached });
      }
    }

    const summary = await aiService.summarizeReviewsService(restaurantId);

    if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 86400, summary);
    }

    res.status(200).json({ summary });
  } catch (err) {
    next(err);
  }
};
