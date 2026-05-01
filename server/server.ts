import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./src/database/db";
import apiRoutes from "./src/api/routes";
import { initSockets } from "./src/sockets/socketEvents";
import { ingestDrugs } from "./src/rag/drugDatabase";

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

// Initialize API Routes
app.use("/api", apiRoutes);

// Initialize Socket.io
initSockets(io);

// Export for backward compatibility with old graph nodes if they import emitStatus from server.ts directly
export { emitStatus } from "./src/sockets/socketEvents";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
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
    console.error("Failed to start server:", error);
  }
};

startServer();

