import { createServer, type Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { createApp } from "./app";
import { socketCorsOptions } from "./config/cors";
import { interviewService } from "./services";
import { registerInterviewSocket } from "./socket/interview.socket";

export interface ServerInstance {
  app: ReturnType<typeof createApp>;
  httpServer: HttpServer;
  io: SocketServer;
}

/**
 * Builds the Express app + HTTP server + Socket.IO server with the socket
 * handlers registered. No side effects (no listen).
 */
export function createServerInstance(): ServerInstance {
  const app = createApp();
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, { cors: socketCorsOptions });
  registerInterviewSocket(io, interviewService);
  return { app, httpServer, io };
}
