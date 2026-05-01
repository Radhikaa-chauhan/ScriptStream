import { Server, Socket } from "socket.io";

let ioInstance: Server | null = null;

export const initSockets = (io: Server) => {
  ioInstance = io;

  io.on("connection", (socket: Socket) => {
    console.log("Client connected via Socket.io:", socket.id);

    // Optional: Clients can join a room based on their user ID to receive private logs
    socket.on("join", (userId: string) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined room ${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

/**
 * Global helper to broadcast AI status updates
 * This will be called by LangGraph nodes
 */
export const emitStatus = (status: string, log: string, userId?: string) => {
  if (!ioInstance) {
    console.warn("Socket.io not initialized, cannot emit:", status, log);
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
