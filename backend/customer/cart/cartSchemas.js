import { z } from "zod";

export const addToCartSchema = z.object({
  menu_item_id: z.number().int().positive("Invalid menu item ID"),
  restaurant_id: z.number().int().positive("Invalid restaurant ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});
