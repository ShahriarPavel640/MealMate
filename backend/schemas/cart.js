import { z } from "zod";

export const addToCartSchema = z.object({
  menu_item_id: z.coerce.number().int(),
  restaurant_id: z.coerce.number().int(),
  quantity: z.coerce.number().int().min(1),
}).passthrough();
