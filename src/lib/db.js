import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

mongoose.set("strictQuery", true);

export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  logger.info("MongoDB connected");
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

export function isDbUp() {
  return mongoose.connection.readyState === 1;
}