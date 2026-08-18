import { z } from "zod";

export const initiatePaymentSchema = z.object({
  cartItems: z
    .array(
      z
        .object({
          menu_item_id: z.coerce.number().int().positive(),
          restaurant_id: z.coerce.number().int().positive(),
          quantity: z.coerce.number().int().positive(),
          price: z.union([z.number(), z.string(), z.coerce.number()]).optional(),
        })
        .passthrough()
    )
    .min(1, "Cart items must contain at least one item"),
  customerInfo: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.any().optional(),
    })
    .passthrough()
    .optional(),
  total_amount: z.union([z.number(), z.string()]).optional(),
  tran_id: z.string().optional(),
  paymentMethod: z.string().optional().default("sslcommerz"),
  specialInstructions: z.any().optional(),
});
