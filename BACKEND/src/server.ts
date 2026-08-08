import { createServerInstance } from "./app-server";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { aiService } from "./services";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  if (env.MONGODB_URI) {
    try {
      await connectDatabase();
    } catch (err) {
      logger.error("MongoDB connection failed - exiting.", {
        error: err instanceof Error ? err.message : String(err),
      });
      process.exit(1);
    }
  }

  const { httpServer, io } = createServerInstance();

  httpServer.listen(env.PORT, () => {
    logger.info("server started", {
      port: env.PORT,
      aiProvider: aiService.providerName,
      nodeEnv: env.NODE_ENV,
    });
  });

  const shutdown = (signal: string): void => {
    logger.info("shutting down", { signal });
    io.close(() => {
      httpServer.close(() => process.exit(0));
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

void main();
