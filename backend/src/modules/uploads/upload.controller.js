const ApiError = require('../../core/ApiError');
const sendResponse = require('../../core/sendResponse');
const path = require('path');
const { uploadObject, getObjectHead, getObjectStream } = require('../../services/storage.service');

const assertUploadedFile = (file) => {
  if (!file) throw new ApiError(400, 'هیچ فایلی ارسال نشده است');
  if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new ApiError(500, 'فایل به درستی پردازش نشد');
  }
};

const uploadAndRespond = async ({ req, res, folder, message }) => {
  assertUploadedFile(req.file);

  const filename = req.file.safeFilename || req.file.originalname;
  const result = await uploadObject({
    folder,
    filename,
    buffer: req.file.buffer,
    contentType: req.file.mimetype,
  });

  sendResponse(res, {
    statusCode: 201,
    message,
    data: {
      url: result.url,
      key: result.key,
      filename,
      storage: result.driver,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  });
};

exports.uploadVideo = async (req, res, next) => {
  try {
    await uploadAndRespond({
      req,
      res,
      folder: 'videos',
      message: 'ویدیو با موفقیت آپلود شد',
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadImage = async (req, res, next) => {
  try {
    await uploadAndRespond({
      req,
      res,
      folder: 'images',
      message: 'تصویر با موفقیت آپلود شد',
    });
  } catch (error) {
    next(error);
  }
};

exports.streamImage = async (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename || '');
    if (!filename) throw new ApiError(400, 'نام فایل تصویر نامعتبر است');

    const key = `images/${filename}`;
    let head;
    try {
      head = await getObjectHead(key);
    } catch (error) {
      throw new ApiError(404, 'تصویر یافت نشد');
    }

    res.setHeader('Content-Type', head.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', head.contentLength);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (req.method === 'HEAD') return res.status(200).end();

    const stream = await getObjectStream(key);
    stream.pipe(res);
    stream.on('error', next);
  } catch (error) {
    next(error);
  }
};
