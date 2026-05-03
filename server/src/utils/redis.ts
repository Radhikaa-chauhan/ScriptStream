import Redis from "ioredis";


console.log("[REDIS] Loading Redis connection...");


/**
 * Standard Redis Connection
 * Used by BullMQ for queues and workers.
 */
const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null, // Required by BullMQ
};

console.log("[REDIS] Connecting to:", `${redisConfig.host}:${redisConfig.port}`);
export const redisConnection = new Redis(redisConfig);

redisConnection.on("error", (err) => {
  console.error("[REDIS] ❌ Connection Error:", err);
});

redisConnection.on("connect", () => {
  console.log("[REDIS] ✅ Connected to Redis successfully.");
});
