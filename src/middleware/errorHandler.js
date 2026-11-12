import { ZodError } from "zod";
import { logger } from "../lib/logger.js";

export function notFound(req, res) {
  res.status(404).json({ ok: false, message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      message: "Validation failed",
      errors: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ ok: false, message: "Invalid JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ ok: false, message: "Request too large" });
  }
  logger.error(err);
  res.status(500).json({ ok: false, message: "Something went wrong" });
}