/**
 * Rate limiter with Redis support and in-memory fallback.
 *
 * Production:
 *   Set REDIS_URL=redis://redis:6379 to use Redis and share rate limits across instances.
 * Development / single instance:
 *   Without REDIS_URL it falls back to in-memory storage.
 */

const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');

const memoryRequests = new Map();
let cleanupStarted = false;

const defaultKeyGenerator = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  return forwardedIp || req.ip || req.connection.remoteAddress || 'unknown';
};

const hashKey = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const startMemoryCleanup = (windowMs) => {
  if (cleanupStarted) return;
  cleanupStarted = true;
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryRequests.entries()) {
      if (now - value.resetTime > windowMs) memoryRequests.delete(key);
    }
  }, Math.min(windowMs, 60 * 1000));
  interval.unref?.();
};

const setRateLimitHeaders = (res, { limit, remaining, retryAfter }) => {
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(remaining, 0)));
  if (retryAfter !== undefined) {
    res.setHeader('Retry-After', String(retryAfter));
  }
};

const memoryHit = (key, windowMs, max) => {
  const now = Date.now();
  const record = memoryRequests.get(key);

  if (!record || now - record.resetTime > windowMs) {
    memoryRequests.set(key, { count: 1, resetTime: now });
    return { count: 1, retryAfter: Math.ceil(windowMs / 1000) };
  }

  record.count += 1;
  return {
    count: record.count,
    retryAfter: Math.max(Math.ceil((windowMs - (now - record.resetTime)) / 1000), 1),
  };
};

const redisHit = async (client, key, windowMs) => {
  const count = await client.incr(key);
  if (count === 1) {
    await client.pExpire(key, windowMs);
  }
  const ttl = await client.pTTL(key);
  return {
    count,
    retryAfter: Math.max(Math.ceil((ttl > 0 ? ttl : windowMs) / 1000), 1),
  };
};

const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later',
    keyGenerator = defaultKeyGenerator,
    namespace = 'global',
  } = options;

  startMemoryCleanup(windowMs);

  return async (req, res, next) => {
    try {
      const rawKey = keyGenerator(req);
      const key = `rl:${namespace}:${hashKey(rawKey)}`;
      const client = await getRedisClient();
      const result = client
        ? await redisHit(client, key, windowMs)
        : memoryHit(key, windowMs, max);

      const remaining = max - result.count;
      setRateLimitHeaders(res, { limit: max, remaining });

      if (result.count > max) {
        setRateLimitHeaders(res, { limit: max, remaining: 0, retryAfter: result.retryAfter });
        return res.status(429).json({
          success: false,
          message,
          retryAfter: result.retryAfter,
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = rateLimiter;
