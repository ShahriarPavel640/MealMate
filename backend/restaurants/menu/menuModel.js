// menu-management/menuModel.js
import pool from "../../db.js";  // Make sure to correctly import your DB pool

// Function to add a new menu category
export const addMenuCategory = async (restaurantId, categoryName) => {
  const query = `
    INSERT INTO menu_categories (restaurant_id, name)
    VALUES ($1, $2)
    RETURNING *`;
  const values = [restaurantId, categoryName];

  const result = await pool.query(query, values);
  return result.rows[0]; // Returns the newly created category
};

// Function to update an existing menu category
export const updateMenuCategory = async (categoryId, newCategoryName) => {
  const query = `
    UPDATE menu_categories
    SET name = $1
    WHERE category_id = $2
    RETURNING *`;
  const values = [newCategoryName, categoryId];

  const result = await pool.query(query, values);
  return result.rows[0]; // Returns the updated category
};

// Function to delete a menu category
export const deleteMenuCategory = async (categoryId) => {
  const query = `
    DELETE FROM menu_categories
    WHERE category_id = $1
    RETURNING *`;
  const values = [categoryId];

  const result = await pool.query(query, values);
  return result.rows[0]; // Returns the deleted category
};

// Function to add a new menu item
export const addMenuItem = async (categoryId, name, description, price) => {
  const query = `
    INSERT INTO menu_items (category_id, name, description, price)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
  const values = [categoryId, name, description, price];

  const result = await pool.query(query, values);
  return result.rows[0]; // Returns the newly created menu item
};

// Function to update an existing menu item
export const updateMenuItem = async (menuItemId, updatedFields) => {
  const { name, description, price, isAvailable } = updatedFields;
  const query = `
    UPDATE menu_items
    SET name = $1, description = $2, price = $3, is_available = $4
    WHERE menu_item_id = $5
    RETURNING *`;
  const values = [name, description, price, isAvailable, menuItemId];

  const result = await pool.query(query, values);
  return result.rows[0]; // Returns the updated menu item
};

// Function to delete a menu item
export const deleteMenuItem = async (menuItemId) => {
  const query = `
    DELETE FROM menu_items
    WHERE menu_item_id = $1
    RETURNING *`;
  const values = [menuItemId];

  const result = await pool.query(query, values);
  return result.rows[0]; // Returns the deleted menu item
};
