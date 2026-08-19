import {
  addMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
} from "./menuService.js";
import redisClient from "../../utils/redisClient.js";

export const createMenuCategory = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const { category_name } = req.body;

    const newCategory = await addMenuCategory(restaurantId, category_name);
    if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${req.user.id}`);
    res.status(201).json({ message: "Category added", category: newCategory });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const { category_name } = req.body;

    const updatedCategory = await updateMenuCategory(restaurantId, id, category_name);
    if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${req.user.id}`);
    res.status(200).json({ message: "Category updated", category: updatedCategory });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const id = parseInt(req.params.id, 10);

    const deletedCategory = await deleteMenuCategory(restaurantId, id);
    if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${req.user.id}`);
    res.status(200).json({ message: "Category deleted", category: deletedCategory });
  } catch (err) {
    next(err);
  }
};

export const createMenuItem = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const categoryId = parseInt(req.params.id, 10);
    const { name, description, price } = req.body;

    const newItem = await addMenuItem(restaurantId, categoryId, name, description, price);
    if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${req.user.id}`);
    res.status(201).json({ message: "Menu item added", item: newItem });
  } catch (err) {
    next(err);
  }
};

export const updateMenuItemDetails = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const updatedFields = req.body;

    const updatedItem = await updateMenuItem(restaurantId, id, updatedFields);
    if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${req.user.id}`);
    res.status(200).json({ message: "Menu item updated", item: updatedItem });
  } catch (err) {
    next(err);
  }
};

export const removeMenuItem = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const id = parseInt(req.params.id, 10);

    const deletedItem = await deleteMenuItem(restaurantId, id);
    if (redisClient.isOpen) await redisClient.del(`cache:restaurant:${req.user.id}`);
    res.status(200).json({ message: "Menu item deleted", item: deletedItem });
  } catch (err) {
    next(err);
  }
};
