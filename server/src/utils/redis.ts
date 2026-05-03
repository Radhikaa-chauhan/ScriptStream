import Redis, { RedisOptions } from "ioredis";

console.log("[REDIS] Loading Redis connection...");

/**
 * Standard Redis connection used by BullMQ for queues and workers.
 */
let redisConnection: Redis;

if (process.env.REDIS_URL) {
  redisConnection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
} else {
  const redisConfig: RedisOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  };

  if (redisConfig.host !== "127.0.0.1" && redisConfig.host !== "localhost") {
    redisConfig.tls = {};
  }

  redisConnection = new Redis(redisConfig);
}

export { redisConnection };

redisConnection.on("error", (err) => {
  console.error("[REDIS] Connection Error:", err);
});

redisConnection.on("connect", () => {
  console.log("[REDIS] Connected to Redis successfully.");
});
