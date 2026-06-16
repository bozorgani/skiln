const path = require('path');
const ApiError = require('../../core/ApiError');
const courseService = require('../courses/course.service');
const { getObjectHead, getObjectStream } = require('../../services/storage.service');

const getAllowedOrigins = () => [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.ADMIN_PANEL_URL,
].filter(Boolean);

const setVideoCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (!origin || process.env.NODE_ENV === 'development' || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || process.env.FRONTEND_URL || 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
};

const getContentType = (filename, fallback) => {
  if (fallback) return fallback;
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.webm') return 'video/webm';
  if (ext === '.ogg') return 'video/ogg';
  if (ext === '.mov') return 'video/quicktime';
  return 'video/mp4';
};

exports.handleOptions = (req, res) => {
  setVideoCorsHeaders(req, res);
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(200).end();
};

exports.streamVideo = async (req, res, next) => {
  try {
    setVideoCorsHeaders(req, res);

    const filename = path.basename(req.params.filename || '');
    if (!filename) throw new ApiError(400, 'نام فایل ویدیو نامعتبر است');

    const access = await courseService.findVideoLessonAccess(filename, req.user || null);
    if (!access.found && !['admin', 'teacher'].includes(req.user?.role)) {
      throw new ApiError(404, 'ویدیو یافت نشد');
    }
    if (access.found && !access.canAccess) {
      throw new ApiError(403, 'برای مشاهده این ویدیو باید در دوره ثبت‌نام کنید');
    }

    const key = `videos/${filename}`;
    let head;
    try {
      head = await getObjectHead(key);
    } catch (error) {
      throw new ApiError(404, 'ویدیو یافت نشد');
    }

    const fileSize = head.contentLength;
    const range = req.headers.range;
    const contentType = getContentType(filename, head.contentType);

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', contentType);

    if (req.method === 'HEAD') {
      res.setHeader('Content-Length', fileSize);
      return res.status(200).end();
    }

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = Number.parseInt(parts[0], 10);
      const end = parts[1] ? Number.parseInt(parts[1], 10) : fileSize - 1;

      if (!Number.isFinite(start) || start >= fileSize || end >= fileSize || start > end) {
        return res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
      }

      const chunkSize = (end - start) + 1;
      const stream = await getObjectStream(key, `bytes=${start}-${end}`);
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize);
      stream.pipe(res);
      stream.on('error', next);
      return;
    }

    const stream = await getObjectStream(key);
    res.status(200);
    res.setHeader('Content-Length', fileSize);
    stream.pipe(res);
    stream.on('error', next);
  } catch (error) {
    next(error);
  }
};
