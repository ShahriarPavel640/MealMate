import { z } from "zod";

export const initiatePaymentSchema = z.object({
  cartItems: z.array(z.object({
    menu_item_id: z.coerce.number().int(),
    restaurant_id: z.coerce.number().int(),
    quantity: z.coerce.number().int().min(1),
    price: z.coerce.number().optional(),
  }).passthrough()).min(1, "Cart cannot be empty"),
  customerInfo: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.any().optional(),
  }).passthrough().optional(),
  paymentMethod: z.string().optional(),
  specialInstructions: z.record(z.any()).optional(),
  total_amount: z.coerce.number().optional(),
  tran_id: z.string().optional(),
}).passthrough();
