import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Admin } from "../src/models/Admin.js";

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env first.");
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 10) {
  console.error("ADMIN_PASSWORD must be at least 10 characters.");
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
const email = ADMIN_EMAIL.trim().toLowerCase();

await Admin.findOneAndUpdate({ email }, { email, passwordHash }, { upsert: true });
console.log(`Admin ready: ${email}`);
await mongoose.disconnect();