import { Request, Response, NextFunction } from 'express';
import * as restaurantService from './restaurantService.js';
import { AppError } from '@/middleware/errorHandler.js';

export const getNearbyRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.user!.id);
    if (isNaN(id)) throw new AppError('Invalid user ID', 400);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;

    const result = await restaurantService.getNearbyRestaurants(id, page, limit);

    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};

export const getRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;

    const result = await restaurantService.getRestaurants(page, limit);

    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};

export const getRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError('Invalid restaurant ID', 400);

    const result = await restaurantService.getRestaurant(id);

    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};

export const getRestaurantByLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const latitudeRaw = (req.query.latitude as string) || req.body?.latitude;
    const longitudeRaw = (req.query.longitude as string) || req.body?.longitude;
    const radiusRaw = (req.query.radius as string) || req.body?.radius || 5000;

    if (!latitudeRaw || !longitudeRaw) {
      throw new AppError('Latitude and longitude are required', 400);
    }

    const latitude = Number(latitudeRaw);
    const longitude = Number(longitudeRaw);
    const radius = Number(radiusRaw);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
      throw new AppError('Invalid coordinates or radius', 400);
    }

    const result = await restaurantService.getRestaurantByLocation(latitude, longitude, radius);

    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};

export const getReviewsAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantIdRaw = req.query.restaurant_id || req.user?.id;
    if (!restaurantIdRaw) {
      throw new AppError('restaurant_id is required', 400);
    }
    const restaurantId = Number(restaurantIdRaw);
    if (isNaN(restaurantId)) throw new AppError('Invalid restaurant ID', 400);

    const reviews = await restaurantService.getReviewsAll(restaurantId);

    res.status(200).json(reviews);
  } catch (error: any) {
    next(error);
  }
};

export const toggleFavoriteRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.user!.id);
    if (isNaN(userId)) throw new AppError('Invalid user ID', 400);

    const restaurantId = Number(req.params.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid restaurant ID', 400);

    const result = await restaurantService.toggleFavoriteRestaurant(userId, restaurantId);
    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};

export const getRestaurantsSearchByName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rest_name = (req.query.name as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;

    const result = await restaurantService.getRestaurantsSearchByName(rest_name, page, limit);
    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await restaurantService.getCategories();
    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};

export const getMenus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await restaurantService.getMenus();
    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};

export const getMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError('Invalid menu item ID', 400);

    const result = await restaurantService.getMenuItem(id);
    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};
