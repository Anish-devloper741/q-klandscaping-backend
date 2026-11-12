import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(1).max(200),
});