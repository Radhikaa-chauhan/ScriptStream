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

/**
 * Standard Redis Connection
 * Used by BullMQ for queues and workers.
 */
let redisConnection: Redis;

if (process.env.REDIS_URL) {
  // If REDIS_URL is provided (e.g., from Upstash), use it directly
  redisConnection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
} else {
  const redisConfig: RedisOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD, // Added password support
    maxRetriesPerRequest: null,
  };
  
  // If using a cloud host but no REDIS_URL, safely assume TLS might be needed if not localhost
  if (redisConfig.host !== "127.0.0.1" && redisConfig.host !== "localhost") {
    redisConfig.tls = {};
  }

  redisConnection = new Redis(redisConfig);
}

export { redisConnection };

redisConnection.on("error", (err) => {
  console.error("[REDIS] ❌ Connection error:", err.message);
});

redisConnection.on("ready", () => {
  console.log("[REDIS] ✅ Successfully connected to Upstash");
});