import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { interviewRoutes } from "./routes/interview.routes";

function corsOrigins(): boolean | string | string[] {
  if (env.NODE_ENV === "production") {
    return env.CLIENT_URL.split(",").map((o) => o.trim()).filter(Boolean);
  }
  return true;
}

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigins(), credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", uptime: process.uptime() } });
  });

  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } },
    }),
  );
  app.use("/api", interviewRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
