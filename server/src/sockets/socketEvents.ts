import { Server, Socket } from "socket.io";

console.log("[SOCKETS] Loading socket events module...");

let ioInstance: Server | null = null;

export const initSockets = (io: Server) => {
  console.log("[SOCKETS] Initializing Socket.io...");
  ioInstance = io;

  io.on("connection", (socket: Socket) => {
    console.log("[SOCKETS] 🔗 Client connected via Socket.io:", socket.id);

    // Optional: Clients can join a room based on their user ID to receive private logs
    socket.on("join", (userId: string) => {
      socket.join(userId);
      console.log(`[SOCKETS] Socket ${socket.id} joined room ${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("[SOCKETS] 🔘 Client disconnected:", socket.id);
    });
  });
  console.log("[SOCKETS] ✅ Socket.io initialized");
};

/**
 * Global helper to broadcast AI status updates
 * This will be called by LangGraph nodes
 */
export const emitStatus = (status: string, log: string, userId?: string) => {
  console.log(`[SOCKETS] Broadcasting [${status}]:`, log);
  if (!ioInstance) {
    console.warn("[SOCKETS] ⚠️ Socket.io not initialized, cannot emit:", status, log);
    return;
  }

  if (userId) {
    // Emit only to specific user room
    ioInstance.to(userId).emit("ai_status", { status, log, timestamp: new Date() });
  } else {
    // Broadcast to all (for general logs or V1 MVP)
    ioInstance.emit("ai_status", { status, log, timestamp: new Date() });
  }
};

/**
 * Emit the final analysis result so the client can navigate to the Results page
 * with real data. Fires the `job:completed` event the useSocket hook already
 * listens for.
 */
export const emitResult = (result: {
  extractedData: any;
  schedule: any;
  safetyWarnings: string[];
}, userId?: string) => {
  console.log("[SOCKETS] Broadcasting job:completed with full analysis result");
  if (!ioInstance) {
    console.warn("[SOCKETS] ⚠️ Socket.io not initialized, cannot emit result");
    return;
  }

  if (userId) {
    ioInstance.to(userId).emit("job:completed", { result });
  } else {
    ioInstance.emit("job:completed", { result });
  }
};
