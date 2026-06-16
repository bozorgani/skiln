/**
 * Rate Limiter Middleware ساده
 * برای جلوگیری از درخواست‌های بیش از حد
 */

const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 دقیقه
    max = 100, // حداکثر 100 درخواست در هر پنجره زمانی
    message = 'Too many requests, please try again later',
  } = options;

  const requests = new Map();

  // پاکسازی خودکار درخواست‌های قدیمی
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requests.entries()) {
      if (now - value.resetTime > windowMs) {
        requests.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = requests.get(key);

    if (!record || now - record.resetTime > windowMs) {
      // شروع پنجره زمانی جدید
      requests.set(key, {
        count: 1,
        resetTime: now,
      });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((windowMs - (now - record.resetTime)) / 1000),
      });
    }

    record.count += 1;
    next();
  };
};

module.exports = rateLimiter;

