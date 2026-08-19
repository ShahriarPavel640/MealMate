import { z } from "zod";

// The Customer Restaurant module primarily consists of GET requests.
// This schema file is maintained for architectural consistency across modules.
// If any POST/PUT routes with payloads are added in the future, define schemas here.

export const locationQuerySchema = z.object({
  latitude: z.number().or(z.string().transform(Number)).optional(),
  longitude: z.number().or(z.string().transform(Number)).optional(),
  radius: z.number().or(z.string().transform(Number)).optional(),
});
