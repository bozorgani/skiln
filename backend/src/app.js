const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const ApiError = require('./core/ApiError');
const rateLimiter = require('./middlewares/rateLimiter');
const routes = require('./routes');

const app = express();

// Configure helmet with relaxed CORS settings for video streaming
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin for video files
  crossOriginOpenerPolicy: { policy: "unsafe-none" }, // Relax COOP for video streaming
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      mediaSrc: ["'self'", "http://localhost:5000", "https:"], // Allow media from localhost and https
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - باید origin مشخص باشد وقتی credentials: true است
const allowedOrigins = [
  'http://localhost:3000', // Frontend
  'http://localhost:3001', // Admin Panel
  process.env.FRONTEND_URL,
  process.env.ADMIN_PANEL_URL,
].filter(Boolean); // حذف مقادیر undefined/null

app.use(
  cors({
    origin: (origin, callback) => {
      // در development یا وقتی origin وجود ندارد (مثل Postman)، allow کن
      if (!origin || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      // در production، فقط origins مجاز را allow کن
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range'],
    exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Video streaming route (must be BEFORE static files to handle CORS properly)
// این route باید قبل از همه static file handlers باشد
const videoStreamRoutes = require('./modules/uploads/video-stream.routes');
app.use('/uploads/videos', (req, res, next) => {
  // Override helmet's restrictive CORS headers for video routes
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  console.log('[App] Video route matched:', req.method, req.path, req.params);
  next();
}, videoStreamRoutes);

// Static files for uploads (images, etc.) - videos are handled by video-stream route above
// این باید بعد از video route باشد تا فقط برای non-video files کار کند
app.use('/uploads/images', express.static(path.join(__dirname, '..', 'uploads', 'images')));
// General static files - اما skip می‌کنیم اگر video request باشد
app.use('/uploads', (req, res, next) => {
  // Skip if it's a video request (already handled above)
  if (req.path && req.path.startsWith('/videos/')) {
    console.log('[App] Skipping static for video:', req.path);
    return next(); // Pass to next middleware (should be 404 handler)
  }
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// Rate limiting برای تمام درخواست‌ها
// می‌توانید این را غیرفعال کنید یا تنظیمات را تغییر دهید
if (process.env.ENABLE_RATE_LIMIT !== 'false') {
  app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));
}

app.get('/', (_req, res) => {
  res.json({
    name: 'Bozorgani LMS API',
    status: 'running',
  });
});

app.use('/api', routes);

app.use((req, _res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
});

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    code: err.code,
    message: err.message || 'Something went wrong',
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

module.exports = app;

