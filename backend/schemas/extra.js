import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(1).max(1000).optional(),
  order_id: z.coerce.number().optional(),
  orderId: z.coerce.number().optional(),
  restaurant_id: z.coerce.number().optional(),
  restaurantId: z.coerce.number().optional(),
  rider_id: z.coerce.number().optional(),
  riderId: z.coerce.number().optional()
});

export const menuSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  availability_status: z.boolean().optional(),
  category_id: z.coerce.number().positive().optional(),
  category_name: z.string().optional()
});

export const orderStatusSchema = z.object({
  order_id: z.coerce.string().optional(),
  orderId: z.coerce.string().optional(),
  status: z.enum(["pending", "pending_restaurant_acceptance", "accepted", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "cancelled"]).optional(),
  new_status: z.enum(["pending", "pending_restaurant_acceptance", "accepted", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "cancelled"]).optional()
}).refine(data => data.status || data.new_status, {
  message: "status or new_status is required"
});

export const riderAuthSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  phone_number: z.string().min(10).max(15).optional(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  vehicle_type: z.enum(["bicycle", "motorcycle", "car", "van"]).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

export const restaurantAuthSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  phone_number: z.string().min(10).max(15).optional(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  address: z.any().optional(),
  cuisine_type: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});






