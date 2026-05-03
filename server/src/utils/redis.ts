import Redis, { RedisOptions } from "ioredis";


console.log("[REDIS] Loading Redis connection...");


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
  console.error("[REDIS] ❌ Connection Error:", err);
});

redisConnection.on("connect", () => {
  console.log("[REDIS] ✅ Connected to Redis successfully.");
});
