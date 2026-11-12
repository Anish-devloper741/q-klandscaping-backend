import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes.js";
import quoteRoutes from "./routes/quote.routes.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET is missing or shorter than 32 characters. Check your .env file.");
  process.exit(1);
}

const app = express();

app.set("trust proxy", 1); // needed on Render/Railway so rate limits see real visitor IPs
app.use(cors({ origin: process.env.CLIENT_ORIGIN.split(",").map((s) => s.trim()) }));
app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.json({ message: "Q & K Landscaping API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/quotes", quoteRoutes);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  }
}

start();