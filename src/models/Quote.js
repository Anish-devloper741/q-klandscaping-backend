import mongoose from "mongoose";

export const QUOTE_STATUSES = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

const quoteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 150 },
    service: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true, maxlength: 150 },
    details: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: QUOTE_STATUSES, default: "NEW", index: true },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

export const Quote = mongoose.model("Quote", quoteSchema);