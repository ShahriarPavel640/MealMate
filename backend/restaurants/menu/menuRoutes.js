// menu-management/menuRoutes.js

import express from "express";
//import { checkRestaurant } from "../../middleware/checkRestaurant.js"; // Import checkRestaurant middleware
import {
  createMenuCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItemDetails,
  removeMenuItem
} from "./menuController.js"; // Import controller functions
import authorization from "../../middleware/authorization.js";
//import { checkRestaurant } from "../../middleware/checkRestaurant.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";

const router = express.Router();

// Add menu category
router.post("/restaurants/:id/categories",authorization,authorizeRoles("restaurant"),  createMenuCategory);

// Edit menu category
router.put("/categories/:id",authorization,authorizeRoles("restaurant"),  updateCategory);

// Delete menu category
router.delete("/categories/:id",authorization,authorizeRoles("restaurant"),  deleteCategory);

// Add menu item
router.post("/categories/:id/items",authorization,authorizeRoles("restaurant"),  createMenuItem);

// Update menu item
router.put("/menu-items/:id",authorization,authorizeRoles("restaurant"),  updateMenuItemDetails);

// Delete menu item
router.delete("/menu-items/:id",authorization,authorizeRoles("restaurant"),  removeMenuItem);

export default router;
