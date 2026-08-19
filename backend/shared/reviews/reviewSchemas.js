import { z } from "zod";

export const restaurantReviewSchema = z.object({
  restaurantId: z.coerce.number().int().positive(),
  orderId: z.coerce.number().int().positive(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().optional(),
});

export const riderReviewSchema = z.object({
  riderId: z.coerce.number().int().positive(),
  orderId: z.coerce.number().int().positive(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().optional(),
});
