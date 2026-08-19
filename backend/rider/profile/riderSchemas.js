import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone_number: z.string().optional(),
  phone: z.string().optional(),
  vehicle_type: z.string().optional().nullable(),
  latitude: z.union([z.number(), z.string()]).optional().nullable(),
  longitude: z.union([z.number(), z.string()]).optional().nullable(),
});

export const updateAvailabilitySchema = z.object({
  is_available: z.union([z.boolean(), z.string()]),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["out_for_delivery", "delivered", "cancelled"], {
    errorMap: () => ({ message: "Invalid status for rider update" }),
  }),
});
