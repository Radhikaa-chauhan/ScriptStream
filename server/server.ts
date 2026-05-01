import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./src/database/db";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Socket.io for real-time AI execution logs
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

/**
 * Global helper to broadcast AI status updates
 * This will be called by our LangGraph nodes
 */
export const emitStatus = (status: string, log: string) => {
  io.emit("ai_status", { status, log });
};

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // await connectDB(); // Enable once MongoDB URI is in .env
    server.listen(PORT, () => {
      console.log(`MediScript Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
