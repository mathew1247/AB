import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env";
import { assertCorsConfigured, expressCorsOptions } from "./config/cors";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { interviewRoutes } from "./routes/interview.routes";
import { authRoutes } from "./routes/auth.routes";

export function createApp(): Express {
  assertCorsConfigured();

  const app = express();

  app.use(helmet());
  app.use(cors(expressCorsOptions));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", uptime: process.uptime() } });
  });

  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests." },
      },
    }),
  );
  app.use("/api", interviewRoutes);
  app.use("/api", authRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
