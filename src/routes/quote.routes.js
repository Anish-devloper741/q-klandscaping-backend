import { Router } from "express";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import { Quote, QUOTE_STATUSES } from "../models/Quote.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Website form: 10 requests per IP per hour (stops spam)
const quoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many requests. Please try again later." },
});

/* ============ PUBLIC: the website form (no login) ============ */

router.post("/", quoteLimiter, async (req, res) => {
  try {
    // Hidden spam trap: real visitors never fill it, bots do
    if (req.body?.website) return res.status(201).json({ ok: true });

    const { name, phone, email, service, location, details } = req.body;

    if (!name || !phone || !service || !location) {
      return res.status(400).json({ ok: false, message: "Please fill in all required fields" });
    }

    const quote = await Quote.create({ name, phone, email, service, location, details });
    res.status(201).json({ ok: true, id: quote._id });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ ok: false, message: "Some information is too long or invalid" });
    }
    console.error(err);
    res.status(500).json({ ok: false, message: "Something went wrong" });
  }
});

/* ============ ADMIN ONLY (login token required) ============ */

// Counts for the dashboard cards
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const rows = await Quote.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.count]));
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    const last7Days = await Quote.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    res.json({ ok: true, total, last7Days, byStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Something went wrong" });
  }
});

// List leads: ?page=1&limit=20&status=NEW&search=ali
router.get("/", requireAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const status = String(req.query.status || "");
    const search = String(req.query.search || "").trim().slice(0, 100);

    const filter = {};
    if (QUOTE_STATUSES.includes(status)) filter.status = status;
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: rx }, { phone: rx }, { email: rx }, { location: rx }, { service: rx }];
    }

    const [items, total] = await Promise.all([
      Quote.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Quote.countDocuments(filter),
    ]);

    res.json({ ok: true, items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Something went wrong" });
  }
});

// Change a lead's status and/or notes
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ ok: false, message: "Lead not found" });
    }

    const changes = {};
    if (req.body?.status !== undefined) {
      if (!QUOTE_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ ok: false, message: "Invalid status" });
      }
      changes.status = req.body.status;
    }
    if (req.body?.notes !== undefined) changes.notes = String(req.body.notes);

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ ok: false, message: "Nothing to update" });
    }

    const quote = await Quote.findByIdAndUpdate(req.params.id, changes, {
      new: true,
      runValidators: true,
    }).lean();

    if (!quote) return res.status(404).json({ ok: false, message: "Lead not found" });
    res.json({ ok: true, quote });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ ok: false, message: "Notes are too long" });
    }
    console.error(err);
    res.status(500).json({ ok: false, message: "Something went wrong" });
  }
});

// Delete a lead
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ ok: false, message: "Lead not found" });
    }
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) return res.status(404).json({ ok: false, message: "Lead not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Something went wrong" });
  }
});

export default router;  