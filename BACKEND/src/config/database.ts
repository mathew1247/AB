import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

let connectionPromise: Promise<typeof mongoose> | null = null;

/**
 * Connect to MongoDB once and reuse the connection across serverless
 * warm invocations. Returns immediately (resolved) when MONGODB_URI is not set.
 * Throws if the URI is set but the connection cannot be established.
 */
export function connectDatabase(): Promise<typeof mongoose> {
  if (!env.MONGODB_URI) {
    return Promise.resolve(mongoose);
  }

  if (!connectionPromise) {
    logger.info("connecting to MongoDB");
    connectionPromise = mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    connectionPromise.catch((err: unknown) => {
      connectionPromise = null; // allow a retry on the next call
      logger.error("MongoDB connection failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  return connectionPromise;
}
