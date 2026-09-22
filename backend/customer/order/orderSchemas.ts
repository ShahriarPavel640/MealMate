import { z } from 'zod';

export const createOrderSchema = z.object({
  cartItems: z
    .array(
      z.object({
        restaurant_id: z.number().int().positive(),
        menu_item_id: z.number().int().positive(),
        quantity: z.number().int().positive(),
        price: z.number().or(z.string().transform((val) => parseFloat(val))),
      })
    )
    .min(1, 'Cart cannot be empty'),
  specialInstructions: z.record(z.string(), z.string().max(500)).optional(),
});
