const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const certificateService = require('./certificate.service');

exports.downloadCertificate = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const certificate = await certificateService.getCertificate(courseId, userId);
  const pdf = await certificateService.generateCertificatePdf(certificate);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', pdf.length);
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`);
  res.send(pdf);
});

exports.getCertificate = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const certificate = await certificateService.getCertificate(courseId, userId);
  sendResponse(res, {
    message: 'گواهینامه با موفقیت دریافت شد',
    data: { certificate: certificateService.formatCertificate(certificate) },
  });
});

exports.getUserCertificates = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const certificates = await certificateService.getUserCertificates(userId);

  sendResponse(res, {
    message: 'گواهینامه‌ها با موفقیت دریافت شدند',
    data: { certificates: certificates.map(certificateService.formatCertificate) },
  });
});

exports.verifyCertificate = catchAsync(async (req, res) => {
  const { certificateNumber } = req.params;
  const certificate = await certificateService.verifyCertificate(certificateNumber);

  sendResponse(res, {
    message: 'گواهینامه معتبر است',
    data: { certificate: certificateService.formatCertificate(certificate) },
  });
});
