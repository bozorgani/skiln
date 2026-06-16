const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../../middlewares/auth');
const uploadController = require('./upload.controller');

const router = express.Router();

// Setup directories
const videosDir = path.join(__dirname, '../../../uploads/videos');
const imagesDir = path.join(__dirname, '../../../uploads/images');

if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Video upload configuration
const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, videosDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${baseName}-${unique}${ext}`);
  },
});

const videoFileFilter = (_req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('فقط فایل‌های ویدیویی مجاز هستند'));
  }
};

const videoUpload = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
});

// Image upload configuration
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imagesDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${baseName}-${unique}${ext}`);
  },
});

const imageFileFilter = (_req, file, cb) => {
  if (file.mimetype && (file.mimetype.startsWith('image/') || ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'].includes(file.mimetype))) {
    cb(null, true);
  } else {
    cb(new Error('فقط فایل‌های تصویری مجاز هستند (JPEG, PNG, WEBP, GIF)'));
  }
};

const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Routes
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


