import { z } from "zod";

export const createMenuCategorySchema = z.object({
  category_name: z.string().min(1, "Category name is required").max(100, "Category name is too long"),
});

export const updateMenuCategorySchema = z.object({
  category_name: z.string().min(1, "Category name is required").max(100, "Category name is too long"),
});

export const createMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100, "Item name is too long"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100, "Item name is too long"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  isAvailable: z.boolean().optional(),
});
