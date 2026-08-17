import { z } from "zod";

export const createOrderSchema = z.object({
  cartItems: z.array(z.object({
    menu_item_id: z.coerce.number().int(),
    restaurant_id: z.coerce.number().int(),
    quantity: z.coerce.number().int().min(1),
    price: z.coerce.number().optional(),
  }).passthrough()).min(1),
  specialInstructions: z.record(z.any()).optional(),
});
