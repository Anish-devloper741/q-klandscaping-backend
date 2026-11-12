import mongoose from "mongoose";
import { Quote } from "../models/Quote.js";
import { logger } from "../lib/logger.js";
import { sendQuoteEmail } from "../lib/mailer.js";
import { quoteSchema, quoteUpdateSchema, quoteListSchema } from "../validators/quote.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ---------- Public: website form ---------- */

export async function createQuote(req, res, next) {
  try {
    // Honeypot: real users never fill this hidden field, bots do
    if (req.body?.website) return res.status(201).json({ ok: true });

    const data = quoteSchema.parse(req.body);

    const quote = await Quote.create({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      service: data.service,
      location: data.location,
      details: data.details || null,
      ip: req.ip,
    });

    // Send the email in the background so the customer doesn't wait
    sendQuoteEmail(quote).catch((err) => logger.error("Quote email failed:", err.message));

    res.status(201).json({ ok: true, id: quote._id });
  } catch (err) {
    next(err);
  }
}

/* ---------- Admin only ---------- */

export async function listQuotes(req, res, next) {
  try {
    const { page, limit, status, service, search } = quoteListSchema.parse(req.query);

    const filter = {};
    if (status) filter.status = status;
    if (service) filter.service = service;
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: rx }, { phone: rx }, { email: rx }, { location: rx }];
    }

    const [items, total] = await Promise.all([
      Quote.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Quote.countDocuments(filter),
    ]);

    res.json({ ok: true, items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function getQuote(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ ok: false, message: "Quote not found" });
    }
    const quote = await Quote.findById(req.params.id).lean();
    if (!quote) return res.status(404).json({ ok: false, message: "Quote not found" });
    res.json({ ok: true, quote });
  } catch (err) {
    next(err);
  }
}

export async function updateQuote(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ ok: false, message: "Quote not found" });
    }
    const changes = quoteUpdateSchema.parse(req.body);
    const quote = await Quote.findByIdAndUpdate(req.params.id, changes, {
      new: true,
      runValidators: true,
    }).lean();
    if (!quote) return res.status(404).json({ ok: false, message: "Quote not found" });
    res.json({ ok: true, quote });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuote(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ ok: false, message: "Quote not found" });
    }
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) return res.status(404).json({ ok: false, message: "Quote not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function quoteStats(req, res, next) {
  try {
    const rows = await Quote.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.count]));
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    res.json({ ok: true, total, byStatus });
  } catch (err) {
    next(err);
  }
}