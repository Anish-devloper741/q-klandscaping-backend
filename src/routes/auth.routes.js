import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { Admin } from "../models/Admin.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Stops password guessing: 10 attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many login attempts. Try again in 15 minutes." },
});

// Makes a wrong email take as long as a wrong password
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password || password.length > 200) {
      return res.status(400).json({ ok: false, message: "Enter your email and password" });
    }

    const admin = await Admin.findOne({ email }).select("+passwordHash");
    const valid = await bcrypt.compare(password, admin ? admin.passwordHash : DUMMY_HASH);

    if (!admin || !valid) {
      return res.status(401).json({ ok: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ email: admin.email }, process.env.JWT_SECRET, {
      subject: String(admin._id),
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      algorithm: "HS256",
    });

    res.json({ ok: true, token, admin: { email: admin.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Something went wrong" });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, admin: req.admin });
});

export default router;