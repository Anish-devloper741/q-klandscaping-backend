import rateLimit from "express-rate-limit";

const base = { standardHeaders: true, legacyHeaders: false };

export const globalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 300,
});

// Quote form: 10 requests per IP per hour
export const quoteLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { ok: false, message: "Too many requests. Please try again later." },
});

// Admin login: 10 attempts per IP per 15 minutes
export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { ok: false, message: "Too many login attempts. Try again later." },
});