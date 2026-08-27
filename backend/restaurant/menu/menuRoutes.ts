import express from 'express';
import {
  createMenuCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItemDetails,
  removeMenuItem,
} from './menuController.js';
import authorization from '@/middleware/authorization.js';
import authorizeRoles from '@/middleware/authorizeRoles.js';
import { validate } from '@/middleware/validate.js';
import {
  createMenuCategorySchema,
  updateMenuCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} from './menuSchemas.js';

const router = express.Router();

router.post(
  '/restaurants/:id/categories',
  authorization,
  authorizeRoles('restaurant'),
  validate(createMenuCategorySchema),
  createMenuCategory
);

router.put(
  '/categories/:id',
  authorization,
  authorizeRoles('restaurant'),
  validate(updateMenuCategorySchema),
  updateCategory
);

router.delete('/categories/:id', authorization, authorizeRoles('restaurant'), deleteCategory);

router.post(
  '/categories/:id/items',
  authorization,
  authorizeRoles('restaurant'),
  validate(createMenuItemSchema),
  createMenuItem
);

router.put(
  '/menu-items/:id',
  authorization,
  authorizeRoles('restaurant'),
  validate(updateMenuItemSchema),
  updateMenuItemDetails
);

router.delete('/menu-items/:id', authorization, authorizeRoles('restaurant'), removeMenuItem);

export default router;
