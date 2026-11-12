import { z } from "zod";
import { QUOTE_STATUSES } from "../models/Quote.js";

// Must match the service options on your Contact page
export const SERVICES = [
  "Luxury Swimming Pool",
  "Modern Villa Garden Pathway",
  "Modern Villa Garden",
  "Fire Pit & Outdoor Seating",
  "Landscape Lighting",
  "Other Landscaping Work",
];

export const quoteSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[+()\d\s-]{7,20}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(150).optional().or(z.literal("")),
  service: z.enum(SERVICES, { message: "Choose a valid service" }),
  location: z.string().trim().min(2, "Location is required").max(150),
  details: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const quoteUpdateSchema = z
  .object({
    status: z.enum(QUOTE_STATUSES),
    notes: z.string().trim().max(2000),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update" });

export const quoteListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(QUOTE_STATUSES).optional(),
  service: z.enum(SERVICES).optional(),
  search: z.string().trim().max(100).optional(),
});