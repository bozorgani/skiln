const ApiError = require('../../core/ApiError');
const sendResponse = require('../../core/sendResponse');
const { uploadObject } = require('../../services/storage.service');

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
