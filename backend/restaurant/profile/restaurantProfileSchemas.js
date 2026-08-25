import { z } from "zod";

export const restaurantRegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  phone_number: z.string().optional(),
  latitude: z.union([z.number(), z.string()]).optional().nullable(),
  longitude: z.union([z.number(), z.string()]).optional().nullable(),
  street: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
});

export const restaurantLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  prevPassword: z.string().min(1, "Previous password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const editProfileSchema = z.object({
  restaurant_name: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  description: z.string().optional(),
  delivery_fee: z.union([z.number(), z.string()]).optional(),
  min_order: z.union([z.number(), z.string()]).optional(),
  delivery_time: z.string().optional(),
  delivery_radius: z.union([z.number(), z.string()]).optional(),
  operating_hours: z.string().optional(),
  latitude: z.union([z.number(), z.string()]).optional(),
  longitude: z.union([z.number(), z.string()]).optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
});

export const addMenuSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  price: z.union([z.number(), z.string()]),
  is_available: z.union([z.boolean(), z.string()]).optional(),
  discount: z.union([z.number(), z.string()]).optional().nullable(),
});

export const changeAvailabilitySchema = z.object({
  status: z.union([z.boolean(), z.string()]),
});
