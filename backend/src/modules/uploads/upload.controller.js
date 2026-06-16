const path = require('path');
const fs = require('fs');
const ApiError = require('../../core/ApiError');
const sendResponse = require('../../core/sendResponse');

exports.uploadVideo = (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'هیچ فایلی ارسال نشده است');
  }

  // مسیر نسبی برای دسترسی از طریق HTTP
  const relativePath = path.posix.join('/uploads/videos', req.file.filename);

  // اطمینان از وجود فایل روی دیسک
  if (!fs.existsSync(req.file.path)) {
    throw new ApiError(500, 'فایل ویدیو ذخیره نشد');
  }

  sendResponse(res, {
    statusCode: 201,
    message: 'ویدیو با موفقیت آپلود شد',
    data: {
      url: relativePath,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  });
};

exports.uploadImage = (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'هیچ فایلی ارسال نشده است');
  }

  // مسیر نسبی برای دسترسی از طریق HTTP
  const relativePath = path.posix.join('/uploads/images', req.file.filename);

  // اطمینان از وجود فایل روی دیسک
  if (!fs.existsSync(req.file.path)) {
    throw new ApiError(500, 'فایل تصویر ذخیره نشد');
  }

  sendResponse(res, {
    statusCode: 201,
    message: 'تصویر با موفقیت آپلود شد',
    data: {
      url: relativePath,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  });
};


