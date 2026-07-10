// menu-management/menuController.js
//import { checkRestaurant } from "../middleware/checkRestaurant.js";  // Assuming you have this middleware

import {
  addMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
} from "./menuModel.js";  // Import functions from the menuModel

// Add a menu category
export const createMenuCategory = async (req, res) => {
  const restaurant_id = req.params.restaurant_id || req.params.id; // Get restaurant_id from URL params
  const { category_name } = req.body; // Get category name from request body

  try {
    const newCategory = await addMenuCategory(restaurant_id, category_name);
    res.status(201).json({ message: "Category added", category: newCategory });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Update an existing menu category
export const updateCategory = async (req, res) => {
  const { id } = req.params; // Get category_id from URL params
  const { category_name } = req.body; // Get new category name from request body

  try {
    const updatedCategory = await updateMenuCategory(id, category_name);
    res.status(200).json({ message: "Category updated", category: updatedCategory });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a menu category
export const deleteCategory = async (req, res) => {
  const { id } = req.params; // Get category_id from URL params

  try {
    const deletedCategory = await deleteMenuCategory(id);
    res.status(200).json({ message: "Category deleted", category: deletedCategory });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Add a menu item to a category
export const createMenuItem = async (req, res) => {
  const { id } = req.params; // Get category_id from URL params
  const { name, description, price } = req.body; // Get item details from request body

  try {
    const newItem = await addMenuItem(id, name, description, price);
    res.status(201).json({ message: "Menu item added", item: newItem });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a menu item
export const updateMenuItemDetails = async (req, res) => {
  const { id } = req.params; // Get menu_item_id from URL params
  const updatedFields = req.body; // Get updated fields from request body

  try {
    const updatedItem = await updateMenuItem(id, updatedFields);
    res.status(200).json({ message: "Menu item updated", item: updatedItem });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a menu item
export const removeMenuItem = async (req, res) => {
  const { id } = req.params; // Get menu_item_id from URL params

  try {
    const deletedItem = await deleteMenuItem(id);
    res.status(200).json({ message: "Menu item deleted", item: deletedItem });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};
