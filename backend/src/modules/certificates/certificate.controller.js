const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const certificateService = require('./certificate.service');

exports.getCertificate = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const certificate = await certificateService.getCertificate(courseId, userId);

  sendResponse(res, {
    message: 'گواهینامه با موفقیت دریافت شد',
    data: certificate,
  });
});

exports.getUserCertificates = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const certificates = await certificateService.getUserCertificates(userId);

  sendResponse(res, {
    message: 'گواهینامه‌ها با موفقیت دریافت شدند',
    data: certificates,
  });
});

exports.verifyCertificate = catchAsync(async (req, res) => {
  const { certificateNumber } = req.params;

  const certificate = await certificateService.verifyCertificate(certificateNumber);

  sendResponse(res, {
    message: 'گواهینامه معتبر است',
    data: certificate,
  });
});

