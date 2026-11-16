import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

mongoose.set("strictQuery", true);

let connecting = null;

// Safe to call many times: connects once, then reuses the same connection.
// On Vercel the server can start fresh at any request, so every request calls this first.
export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  if (!connecting) {
    connecting = mongoose
      .connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .then(() => logger.info("MongoDB connected"))
      .catch((err) => {
        connecting = null; // allow a retry on the next request
        throw err;
      });
  }
  await connecting;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

export function isDbUp() {
  return mongoose.connection.readyState === 1;
}