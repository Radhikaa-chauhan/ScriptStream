import { Redis, RedisOptions } from "ioredis";

// Load from your .env file
const REDIS_URL = process.env.UPSTASH_REDIS_URL || "redis://127.0.0.1:6379";

const redisOptions: RedisOptions = {
  // CRITICAL for Upstash: Force DB 0
  db: 0,
  
  // CRITICAL for BullMQ: Must be null
  maxRetriesPerRequest: null,

  // Upstash requires TLS for external connections
  tls: REDIS_URL.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,

  // Important for Upstash/Serverless: 
  // Prevents Upstash from killing the connection when the worker is idle
  keepAlive: 10000,

  // Optional: Auto-reconnect strategies
  retryStrategy(times) {
    console.warn(`[REDIS] Retrying connection: attempt ${times}`);
    return Math.min(times * 50, 2000);
  },
};

console.log("[REDIS] Initializing connection...");

export const redisConnection = new Redis(REDIS_URL, redisOptions);

redisConnection.on("error", (err) => {
  console.error("[REDIS] ❌ Connection error:", err.message);
});

redisConnection.on("ready", () => {
  console.log("[REDIS] ✅ Successfully connected to Upstash");
});