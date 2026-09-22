import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.enum(['out_for_delivery', 'delivered', 'cancelled']),
});
