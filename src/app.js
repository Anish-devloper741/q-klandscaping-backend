import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env.js";
import { globalLimiter } from "./middleware/rateLimiters.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1); 

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN.split(",").map((s) => s.trim()),
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "20kb" }));
app.use(globalLimiter);

app.get("/", (req, res) => res.json({ ok: true, service: "Q & K Landscaping API" }));
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;