import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./lib/db.js";

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  }
  app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`));
}

start();