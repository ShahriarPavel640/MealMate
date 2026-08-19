import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone_number: z.string().min(10, "Invalid phone number").optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  prevPassword: z.string().min(1, "Previous password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().optional().nullable(),
    email: z.string().optional(),
    location: z
      .object({
        lat: z.coerce.number().optional().nullable(),
        lng: z.coerce.number().optional().nullable(),
      })
      .optional()
      .nullable(),
    address: z
      .object({
        street: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        postal_code: z.string().optional().nullable(),
      })
      .optional()
      .nullable(),
  })
  .passthrough();
