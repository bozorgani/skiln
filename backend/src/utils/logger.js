/**
 * Logger utility برای مدیریت لاگ‌های پروژه
 * در محیط production فقط خطاها لاگ می‌شوند
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  info: (...args) => {
    if (isDevelopment || !isProduction) {
      console.log('[INFO]', ...args);
    }
  },

  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  warn: (...args) => {
    if (isDevelopment || !isProduction) {
      console.warn('[WARN]', ...args);
    }
  },

  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
};

module.exports = logger;

