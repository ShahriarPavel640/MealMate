import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/middleware/errorHandler.js';
import {
  addMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from './menuService.js';
import redisClient from '@/utils/redisClient.js';

export const createMenuCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    if (isNaN(restaurantId)) throw new AppError('Invalid user ID', 400);
    const { category_name } = req.body;

    const newCategory = await addMenuCategory(restaurantId, category_name);
    if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${req.user!.id}`);
    res.status(201).json({ message: 'Category added', category: newCategory });
  } catch (err: any) {
    next(err);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    const id = Number(req.params.id);
    if (isNaN(restaurantId) || isNaN(id)) throw new AppError('Invalid ID', 400);
    const { category_name } = req.body;

    const updatedCategory = await updateMenuCategory(restaurantId, id, category_name);
    if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${req.user!.id}`);
    res.status(200).json({ message: 'Category updated', category: updatedCategory });
  } catch (err: any) {
    next(err);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    const id = Number(req.params.id);
    if (isNaN(restaurantId) || isNaN(id)) throw new AppError('Invalid ID', 400);

    const deletedCategory = await deleteMenuCategory(restaurantId, id);
    if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${req.user!.id}`);
    res.status(200).json({ message: 'Category deleted', category: deletedCategory });
  } catch (err: any) {
    next(err);
  }
};

export const createMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    const categoryId = Number(req.params.id);
    if (isNaN(restaurantId) || isNaN(categoryId)) throw new AppError('Invalid ID', 400);
    const { name, description, price } = req.body;

    const newItem = await addMenuItem(restaurantId, categoryId, name, description, price);
    if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${req.user!.id}`);
    res.status(201).json({ message: 'Menu item added', item: newItem });
  } catch (err: any) {
    next(err);
  }
};

export const updateMenuItemDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    const id = Number(req.params.id);
    if (isNaN(restaurantId) || isNaN(id)) throw new AppError('Invalid ID', 400);
    const updatedFields = req.body;

    const updatedItem = await updateMenuItem(restaurantId, id, updatedFields);
    if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${req.user!.id}`);
    res.status(200).json({ message: 'Menu item updated', item: updatedItem });
  } catch (err: any) {
    next(err);
  }
};

export const removeMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = Number(req.user!.id);
    const id = Number(req.params.id);
    if (isNaN(restaurantId) || isNaN(id)) throw new AppError('Invalid ID', 400);

    const deletedItem = await deleteMenuItem(restaurantId, id);
    if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${req.user!.id}`);
    res.status(200).json({ message: 'Menu item deleted', item: deletedItem });
  } catch (err: any) {
    next(err);
  }
};
