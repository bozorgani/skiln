const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../../middlewares/auth');
const ApiError = require('../../core/ApiError');
const uploadController = require('./upload.controller');

const router = express.Router();

const sanitizeBaseName = (name) =>
  path.basename(name || 'upload', path.extname(name || ''))
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9-_\u0600-\u06FF]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'upload';

const normalizeExtension = (file) => path.extname(file.originalname || '').toLowerCase();

const buildSafeFilename = (file) => {
  const ext = normalizeExtension(file);
  const baseName = sanitizeBaseName(file.originalname);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${baseName}-${unique}${ext}`;
};

const allowedVideoTypes = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);
const allowedVideoExts = new Set(['.mp4', '.webm', '.ogg', '.mov']);

const videoFileFilter = (_req, file, cb) => {
  const ext = normalizeExtension(file);
  if (allowedVideoTypes.has(file.mimetype) && allowedVideoExts.has(ext)) {
    file.safeFilename = buildSafeFilename(file);
    cb(null, true);
  } else {
    cb(new ApiError(400, 'فقط فایل‌های ویدیویی معتبر مجاز هستند (MP4, WEBM, OGG, MOV)'));
  }
};

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const allowedImageExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const imageFileFilter = (_req, file, cb) => {
  const ext = normalizeExtension(file);
  if (allowedImageTypes.has(file.mimetype) && allowedImageExts.has(ext)) {
    file.safeFilename = buildSafeFilename(file);
    cb(null, true);
  } else {
    cb(new ApiError(400, 'فقط فایل‌های تصویری معتبر مجاز هستند (JPEG, PNG, WEBP, GIF)'));
  }
};

const memoryStorage = multer.memoryStorage();

const videoUpload = multer({
  storage: memoryStorage,
  fileFilter: videoFileFilter,
  limits: {
    files: 1,
    fileSize: Number(process.env.MAX_VIDEO_UPLOAD_BYTES) || 500 * 1024 * 1024,
  },
});

const imageUpload = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    files: 1,
    fileSize: Number(process.env.MAX_IMAGE_UPLOAD_BYTES) || 10 * 1024 * 1024,
  },
});

router.post(
  '/videos',
  auth(['admin', 'teacher']),
  videoUpload.single('video'),
  uploadController.uploadVideo
);

router.post(
  '/images',
  auth(['admin', 'teacher']),
  imageUpload.single('image'),
  uploadController.uploadImage
);

module.exports = router;
