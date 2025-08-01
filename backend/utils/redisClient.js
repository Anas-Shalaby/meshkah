const Redis = require("ioredis");

// Create Redis client
const redisClient = new Redis(process.env.REDIS_URL);

// Handle Redis connection events
redisClient.on("connect", () => {
  console.log("Successfully connected to Redis");
});

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
});

redisClient.on("close", () => {
  console.log("Redis connection closed");
});

// Helper function to get a value with TTL
redisClient.getWithTTL = async (key) => {
  const [value, ttl] = await Promise.all([
    redisClient.get(key),
    redisClient.ttl(key),
  ]);
  return { value, ttl };
};

// Helper function to increment a counter with expiry
redisClient.incrementWithExpiry = async (key, expirySeconds) => {
  const multi = redisClient.multi();
  multi.incr(key);
  multi.expire(key, expirySeconds);
  const results = await multi.exec();
  return results[0][1]; // Return the incremented value
};

module.exports = redisClient;
