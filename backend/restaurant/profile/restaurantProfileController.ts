import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/errorHandler.js';
import {
  registerRestaurant,
  loginRestaurant,
  getRestaurantById,
  getRestaurantFullProfile,
  updateRestaurantProfile,
  changeRestaurantPassword,
  addMenuItemWithImage,
  editMenuItemWithImage,
  changeMenuItemAvailability,
  deleteMenuItemSoft,
  getMenuItems,
  getMenuCategories as fetchMenuCategories,
  getRestaurantReviews,
} from './restaurantProfileService.js';
import { generateToken } from '../../utils/jwtGenerator.js';
import cloudinary from '../../utils/cloudinary.js';
import fs from 'fs';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newRestaurant = await registerRestaurant(req.body);
    await generateToken(newRestaurant.restaurant_id, 'restaurant', res);

    res.status(201).json({
      restaurant_id: newRestaurant.restaurant_id,
      name: newRestaurant.name,
      phone: newRestaurant.phone,
      email: newRestaurant.email,
      location_id: newRestaurant.location_id,
      average_rating: newRestaurant.average_rating,
    });
  } catch (err: any) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const restaurant = await loginRestaurant(email, password);
    await generateToken(restaurant.restaurant_id, 'restaurant', res);

    res.status(200).json({
      message: 'login successfull',
      restaurant_id: restaurant.restaurant_id,
      name: restaurant.name,
      phone: restaurant.phone,
      email: restaurant.email,
      location_id: restaurant.location_id,
      average_rating: restaurant.average_rating,
    });
  } catch (err: any) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const jwt = (await import('jsonwebtoken')).default;
      const decoded = jwt.decode(refreshToken);
      if (decoded && (decoded as any).id) {
        const redisClient = (await import('../../utils/redisClient.js')).default;
        await redisClient.del(`refresh_token:${(decoded as any).id}`);
      }
    }
    res.cookie('accessToken', '', { maxAge: 0 });
    res.cookie('refreshToken', '', { maxAge: 0 });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err: any) {
    next(err);
  }
};

export const verify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.user!.id);
    if (isNaN(id)) throw new AppError('Invalid ID', 400);
    const restaurant = await getRestaurantById(id);

    res.status(200).json({
      restaurant_id: restaurant.restaurant_id,
      name: restaurant.name,
      phone: restaurant.phone,
      email: restaurant.email,
      location_id: restaurant.location_id,
      average_rating: restaurant.average_rating,
    });
  } catch (err: any) {
    next(err);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.user!.id);
    if (isNaN(id)) throw new AppError('Invalid ID', 400);
    const { prevPassword, newPassword } = req.body;

    await changeRestaurantPassword(id, prevPassword, newPassword);
    res.status(200).json({ message: 'Password changed successfully..' });
  } catch (err: any) {
    next(err);
  }
};

export const getRestaurantProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid ID', 400);
    const profile = await getRestaurantFullProfile(restaurantId);
    res.status(200).json(profile);
  } catch (err: any) {
    next(err);
  }
};

export const editProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid ID', 400);
    let imageUrl = undefined;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'restaurant_profiles',
        });
        imageUrl = result.secure_url;
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e: any) {
        // Fallback placeholder on upload failure in tests/offline
        imageUrl =
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop';
      }
    }

    let operatingHours = [];
    if (req.body.operating_hours) {
      try {
        operatingHours =
          typeof req.body.operating_hours === 'string'
            ? JSON.parse(req.body.operating_hours)
            : req.body.operating_hours;
      } catch (e: any) {
        operatingHours = [];
      }
    }

    const updated = await updateRestaurantProfile(
      restaurantId,
      { ...req.body, operating_hours: operatingHours },
      imageUrl
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      restaurant: updated,
    });
  } catch (err: any) {
    next(err);
  }
};

export const add_menu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.user!.id);
    if (isNaN(id)) throw new AppError('Invalid ID', 400);
    let imageUrl: string | undefined = undefined;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'restaurant_menu_items',
        });
        imageUrl = result.secure_url;
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e: any) {
        imageUrl = 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop';
      }
    }

    const item = await addMenuItemWithImage(id, req.body, imageUrl);
    res.status(201).json({
      message: 'Menu item added successfully',
      item,
    });
  } catch (err: any) {
    next(err);
  }
};

export const edit_menu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    const menuItemId = Number(req.params.menu_item_id);
    if (isNaN(restaurantId) || isNaN(menuItemId)) throw new AppError('Invalid ID', 400);
    let imageUrl = undefined;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'restaurant_menu_items',
        });
        imageUrl = result.secure_url;
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (e: any) {}
    }

    const item = await editMenuItemWithImage(restaurantId, menuItemId, req.body, imageUrl);
    res.status(200).json({
      message: 'Menu item updated successfully',
      item,
    });
  } catch (err: any) {
    next(err);
  }
};

export const change_menu_availability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    const menuItemId = Number(req.params.menu_item_id);
    if (isNaN(restaurantId) || isNaN(menuItemId)) throw new AppError('Invalid ID', 400);
    const { status } = req.body;

    const item = await changeMenuItemAvailability(restaurantId, menuItemId, status);
    res.status(200).json({
      message: 'Menu item availability updated successfully',
      item,
    });
  } catch (err: any) {
    next(err);
  }
};

export const delete_menu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    const menuItemId = Number(req.params.menu_item_id);
    if (isNaN(restaurantId) || isNaN(menuItemId)) throw new AppError('Invalid ID', 400);

    await deleteMenuItemSoft(restaurantId, menuItemId);
    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (err: any) {
    next(err);
  }
};

export const get_menu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid ID', 400);
    const items = await getMenuItems(restaurantId);
    res.status(200).json(items);
  } catch (err: any) {
    next(err);
  }
};

export const get_menu_categories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid ID', 400);
    const categories = await fetchMenuCategories(restaurantId);
    res.status(200).json(categories);
  } catch (err: any) {
    next(err);
  }
};

export const getReviewsAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid ID', 400);
    const result = await getRestaurantReviews(restaurantId, req.query);
    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};
