import { z } from 'zod';

export const updateOrderStatusSchema = z
  .object({
    order_id: z.union([z.string(), z.number()]).optional(),
    new_status: z.string().optional(),
    status: z.string().optional(),
  })
  .refine((data: Record<string, unknown>) => data.new_status || (data.status as string), {
    message: 'Status is required',
  });

export const orderQuerySchema = z.object({
  status: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
