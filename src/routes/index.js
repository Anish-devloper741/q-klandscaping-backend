import { Router } from "express";
import { isDbUp } from "../lib/db.js";
import authRoutes from "./auth.routes.js";
import quoteRoutes from "./quote.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  const up = isDbUp();
  res.status(up ? 200 : 503).json({ ok: up, db: up ? "up" : "down" });
});

router.use("/auth", authRoutes);
router.use("/quotes", quoteRoutes);

export default router;