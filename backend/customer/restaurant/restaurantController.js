import * as restaurantService from "./restaurantService.js";
import { AppError } from "../../middleware/errorHandler.js";

export const getNearbyRestaurants = async (req, res, next) => {
  try {
    const id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;

    const result = await restaurantService.getNearbyRestaurants(id, page, limit);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getRestaurants = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;

    const result = await restaurantService.getRestaurants(page, limit);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getRestaurant = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) throw new AppError("Restaurant ID is required", 400);

    const result = await restaurantService.getRestaurant(id);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getRestaurantByLocation = async (req, res, next) => {
  try {
    const latitude = req.query.latitude || req.body?.latitude;
    const longitude = req.query.longitude || req.body?.longitude;
    const radius = req.query.radius || req.body?.radius || 5000;

    if (!latitude || !longitude) {
      throw new AppError("Latitude and longitude are required", 400);
    }

    const result = await restaurantService.getRestaurantByLocation(latitude, longitude, radius);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getReviewsAll = async (req, res, next) => {
  try {
    const restaurantId = req.query.restaurant_id || req.user?.id;

    if (!restaurantId) {
      throw new AppError("restaurant_id query parameter is required", 400);
    }

    const reviews = await restaurantService.getReviewsAll(restaurantId);

    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

export const toggleFavoriteRestaurant = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const restaurantId = req.params.id;

    if (!restaurantId) {
      throw new AppError("Restaurant ID is required", 400);
    }

    const result = await restaurantService.toggleFavoriteRestaurant(userId, restaurantId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getRestaurantsSearchByName = async (req, res, next) => {
  try {
    const rest_name = req.query.name || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;

    const result = await restaurantService.getRestaurantsSearchByName(rest_name, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const result = await restaurantService.getCategories();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getMenus = async (req, res, next) => {
  try {
    const result = await restaurantService.getMenus();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getMenuItem = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) throw new AppError("Menu item ID is required", 400);
    
    const result = await restaurantService.getMenuItem(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
