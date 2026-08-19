import * as cartService from "./cartService.js";
import { AppError } from "../../middleware/errorHandler.js";

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await cartService.getCart(userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await cartService.addToCart(userId, req.body);
    
    // Original controller returns 201 if inserted, 200 if updated.
    // We can just return 200 for both, or let the service return a status code hint.
    // The previous logic returned 201 if checkPrev.rows.length === 0, 200 otherwise.
    // Let's stick to 200 for simplicity or use the message to decide.
    const statusCode = result.message === "Item added to cart" ? 201 : 200;
    res.status(statusCode).json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteCartItem = async (req, res, next) => {
  try {
    const { cart_item_id } = req.params;
    if (!cart_item_id) throw new AppError("Cart item ID is required", 400);

    const userId = req.user.id;
    const result = await cartService.deleteCartItem(userId, cart_item_id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
