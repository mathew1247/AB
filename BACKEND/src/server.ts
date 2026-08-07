import { createServer } from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { env } from "./config/env";
import { aiService, interviewService } from "./services";
import { registerInterviewSocket } from "./socket/interview.socket";
import { logger } from "./utils/logger";

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.NODE_ENV === "production" ? env.CLIENT_URL.split(",") : true,
    credentials: true,
  },
});

registerInterviewSocket(io, interviewService);

httpServer.listen(env.PORT, () => {
  logger.info("server started", {
    port: env.PORT,
    aiProvider: aiService.providerName,
    nodeEnv: env.NODE_ENV,
  });
});

function shutdown(signal: string): void {
  logger.info("shutting down", { signal });
  io.close(() => {
    httpServer.close(() => {
      process.exit(0);
    });
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
