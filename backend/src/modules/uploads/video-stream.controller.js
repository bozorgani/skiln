const fs = require('fs');
const path = require('path');
const ApiError = require('../../core/ApiError');

/**
 * Handle CORS preflight (OPTIONS) requests
 */
exports.handleOptions = (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    process.env.ADMIN_PANEL_URL,
  ].filter(Boolean);

  if (!origin || process.env.NODE_ENV === 'development' || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  res.status(200).end();
};

/**
 * Stream video file with proper CORS headers
 */
exports.streamVideo = (req, res, next) => {
  console.log('[VideoStream] Request received:', req.method, req.path, req.params);
  const filename = req.params.filename;
  const videoPath = path.join(__dirname, '../../../uploads/videos', filename);
  console.log('[VideoStream] Video path:', videoPath);

  // Set CORS headers FIRST (before any other operations)
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    process.env.ADMIN_PANEL_URL,
  ].filter(Boolean);

  if (!origin || process.env.NODE_ENV === 'development' || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  
  // Override helmet's restrictive CORS headers for video streaming
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');

  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    res.status(404).json({ error: 'ویدیو یافت نشد' });
    return;
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader('Accept-Ranges', 'bytes');

  // Handle Range requests for video streaming
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    
    // Validate range
    if (start >= fileSize || end >= fileSize || start > end) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
      return;
    }
    
    const file = fs.createReadStream(videoPath, { start, end });
    
    // Set headers for 206 Partial Content
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunksize);
    res.setHeader('Content-Type', 'video/mp4');
    
    file.pipe(res);
    file.on('error', (err) => {
      console.error('Error streaming video:', err);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });
  } else {
    // Full file request
    res.status(200);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', 'video/mp4');
    
    const file = fs.createReadStream(videoPath);
    file.pipe(res);
    file.on('error', (err) => {
      console.error('Error streaming video:', err);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });
  }
};

