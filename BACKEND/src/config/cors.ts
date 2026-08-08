import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * Single source of truth for allowed origins.
 * Used by BOTH Express (cors middleware) and Socket.IO.
 *
 * CLIENT_URL supports comma-separated origins, e.g.
 *   CLIENT_URL=http://localhost:5500,https://your-frontend.onrender.com
 */

export function allowedOrigins(): string[] {
  return env.CLIENT_URL.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin: string): boolean {
  const origins = allowedOrigins();
  if (origins.length === 0) {
    return true; // nothing configured -> permissive (dev); fail-fast in production via assertCorsConfigured
  }
  return origins.includes(origin);
}

/**
 * Origin callback compatible with both the `cors` package and Socket.IO.
 * Requests without an Origin header (curl, Postman, health checks, server-to-server)
 * are allowed.
 */
export function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error("Not allowed by CORS"));
}

export const expressCorsOptions = {
  origin: corsOriginCallback,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

export const socketCorsOptions = {
  origin: corsOriginCallback,
  methods: ["GET", "POST"],
  credentials: false,
};

/** Fail fast in production if CLIENT_URL was forgotten (would otherwise allow all origins). */
export function assertCorsConfigured(): void {
  if (env.NODE_ENV === "production" && allowedOrigins().length === 0) {
    logger.error("CLIENT_URL must be configured in production (CORS).");
    throw new Error("CLIENT_URL must be configured in production.");
  }
}
