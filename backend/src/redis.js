const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null; // Stop retrying after 3 attempts
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true, // Don't connect until first command
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

// Cache helper: get cached or compute & store
async function cached(key, ttlSeconds, computeFn) {
  try {
    await redis.connect().catch(() => {}); // Ensure connected
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit);
  } catch (err) {
    // Redis down — fall through to compute
    console.warn('Redis cache miss (error):', err.message);
  }

  const result = await computeFn();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(result));
  } catch {
    // Silently fail cache write
  }

  return result;
}

// Invalidate keys by pattern
async function invalidate(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn('Redis invalidation error:', err.message);
  }
}

module.exports = { redis, cached, invalidate };
