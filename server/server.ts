import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./src/database/db";
import apiRoutes from "./src/api/routes";
import { initSockets } from "./src/sockets/socketEvents";
import { ingestDrugs } from "./src/rag/drugDatabase";

console.log("[SERVER] Loading server.ts...");
dotenv.config();
console.log("[SERVER] Environment loaded");

const app = express();
console.log("[SERVER] Express app created");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("Welcome to ScriptStream API");
});

// Initialize API Routes
console.log("[SERVER] Initializing API routes...");
app.use("/api", apiRoutes);
console.log("[SERVER] API routes ready");

// Initialize Socket.io
console.log("[SERVER] Initializing Socket.io...");
initSockets(io);
console.log("[SERVER] Socket.io initialized");

// Initialize BullMQ Worker
import "./src/workers/graphWorker";

// Legacy export removed to prevent circular dependencies

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    console.log("[SERVER] Starting server...");
    await connectDB(); // Ensure MongoDB URI is in .env

    // Bootstrap ChromaDB drug database (idempotent — skips if already seeded)
    try {
      await ingestDrugs();
    } catch (ragError) {
      console.warn("[Server] ChromaDB bootstrap failed. RAG will work in degraded mode:", ragError);
    }

    server.listen(PORT, () => {
      console.log(`ScriptStream Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[SERVER] ❌ Failed to start server:", error);
  }
};

startServer();
