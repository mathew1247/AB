import { createServerInstance } from "./app-server";

/**
 * Vercel Fluid Compute entry.
 *
 * Vercel's Node.js runtime captures the http.Server exported here and keeps it
 * alive across invocations on the same warm instance, which is what allows
 * Socket.IO connections to survive between requests.
 *
 * The Express app serves /health and /api/*, and Socket.IO answers on the
 * default /socket.io/* path (routed via vercel.json so the frontend needs no
 * custom path/transport configuration).
 */

const { httpServer } = createServerInstance();

export default httpServer;
