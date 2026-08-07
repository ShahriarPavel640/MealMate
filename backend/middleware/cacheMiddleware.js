import redisClient from "../utils/redisClient.js";

/**
 * Cache middleware for Express
 * @param {function} keyGenerator - Function that takes req and returns the cache key string
 * @param {number} ttl - Time to live in seconds (default 300s = 5 minutes)
 */
export const cacheMiddleware = (keyGenerator, ttl = 300) => {
  return async (req, res, next) => {
    // Resilience: bypass if Redis is down
    if (!redisClient.isOpen) {
      return next();
    }

    try {
      const key = keyGenerator(req);
      if (!key) return next();

      const cachedData = await redisClient.get(key);
      if (cachedData) {
        // Cache Hit
        console.log(`[Redis Cache HIT] ${key}`);
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Cache Miss - Intercept response
      console.log(`[Redis Cache MISS] ${key} - Fetching from DB...`);
      const originalJson = res.json;
      res.json = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setEx(key, ttl, JSON.stringify(body)).catch((err) => {
            console.error("Redis SetEx Error:", err);
          });
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error (bypassing):", error);
      next();
    }
  };
};
