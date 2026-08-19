import { z } from "zod";

export const riderSignupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone_number: z.string().optional(),
  phone: z.string().optional(),
  vehicle_type: z.string().optional().nullable(),
  current_location: z.string().optional().nullable(),
  latitude: z.union([z.number(), z.string()]).optional().nullable(),
  longitude: z.union([z.number(), z.string()]).optional().nullable(),
  is_available: z.union([z.boolean(), z.string()]).optional(),
});

export const riderLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
