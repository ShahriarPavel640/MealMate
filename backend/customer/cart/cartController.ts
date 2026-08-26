import { Request, Response, NextFunction } from 'express';
import * as cartService from './cartService.js';
import { AppError } from '../../middleware/errorHandler.js';

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.user!.id);
    if (isNaN(userId)) throw new AppError('Invalid user ID', 400);
    const result = await cartService.getCart(userId);
    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.user!.id);
    if (isNaN(userId)) throw new AppError('Invalid user ID', 400);
    const result = await cartService.addToCart(userId, req.body);

    // Original controller returns 201 if inserted, 200 if updated.
    // We can just return 200 for both, or let the service return a status code hint.
    // The previous logic returned 201 if checkPrev.rows.length === 0, 200 otherwise.
    // Let's stick to 200 for simplicity or use the message to decide.
    const statusCode = result.message === 'Item added to cart' ? 201 : 200;
    res.status(statusCode).json(result);
  } catch (err: any) {
    next(err);
  }
};

export const deleteCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartItemId = Number(req.params.cart_item_id);
    if (isNaN(cartItemId)) throw new AppError('Invalid cart item ID', 400);

    const userId = Number(req.user!.id);
    if (isNaN(userId)) throw new AppError('Invalid user ID', 400);
    
    const result = await cartService.deleteCartItem(userId, cartItemId);
    res.status(200).json(result);
  } catch (err: any) {
    next(err);
  }
};
