const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const bidiFactory = require('bidi-js');
const { PersianShaper } = require('arabic-persian-reshaper');
const ApiError = require('../../core/ApiError');
const Certificate = require('./certificate.model');
const Progress = require('../progress/progress.model');
const Course = require('../courses/course.model');

const bidi = bidiFactory();
const FONT_PATH = path.join(__dirname, '../../../assets/fonts/DejaVuSans.ttf');

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const shapeFa = (value = '') => {
  const shaped = PersianShaper.convertArabic(String(value));
  const levels = bidi.getEmbeddingLevels(shaped, 'rtl');
  return bidi.getReorderedString(shaped, levels);
};

const generateCertificateNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SKILN-${date}-${random}`;
};

const ensureCertificate = async (courseId, userId) => {
  let certificate = await Certificate.findOne({ user: userId, course: courseId })
    .populate('course', 'title description thumbnail')
    .populate('user', 'name email phone');

  if (certificate) return certificate;

  const progress = await Progress.findOne({ user: userId, course: courseId });
  if (!progress || progress.completionPercentage < 100) {
    throw new ApiError(403, 'برای دریافت گواهینامه باید دوره را کامل کنید');
  }

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, 'دوره یافت نشد');

  certificate = await Certificate.create({
    user: userId,
    course: courseId,
    progress: progress._id,
    certificateNumber: generateCertificateNumber(),
    completedAt: progress.completedAt || new Date(),
  });

  progress.certificateIssued = true;
  if (!progress.completedAt) progress.completedAt = certificate.completedAt;
  await progress.save();

  return Certificate.findById(certificate._id)
    .populate('course', 'title description thumbnail')
    .populate('user', 'name email phone');
};

const getCertificate = async (courseId, userId) => {
  return ensureCertificate(courseId, userId);
};

const getUserCertificates = async (userId) => {
  return Certificate.find({ user: userId })
    .populate('course', 'title description thumbnail')
    .populate('user', 'name email phone')
    .sort({ issuedAt: -1 });
};

const verifyCertificate = async (certificateNumber) => {
  const certificate = await Certificate.findOne({ certificateNumber })
    .populate('course', 'title description thumbnail')
    .populate('user', 'name email phone');

  if (!certificate) {
    throw new ApiError(404, 'گواهینامه نامعتبر است');
  }

  return certificate;
};

const formatCertificate = (certificate) => ({
  _id: certificate._id,
  certificateNumber: certificate.certificateNumber,
  issuedAt: certificate.issuedAt,
  completedAt: certificate.completedAt,
  verificationUrl: `${getFrontendUrl()}/certificates/verify/${certificate.certificateNumber}`,
  user: certificate.user,
  course: certificate.course,
});

const drawCenteredFa = (doc, text, y, options = {}) => {
  doc.font(options.font || 'Vazir').fontSize(options.size || 24).fillColor(options.color || '#0f172a');
  doc.text(shapeFa(text), 0, y, {
    width: doc.page.width,
    align: 'center',
    lineGap: options.lineGap || 4,
  });
};

const generateCertificatePdf = async (certificate) => {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 42, info: {
    Title: `Skiln Certificate ${certificate.certificateNumber}`,
    Author: 'Skiln',
    Subject: 'Course Completion Certificate',
  }});

  doc.registerFont('Vazir', FONT_PATH);
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const width = doc.page.width;
  const height = doc.page.height;
  const verificationUrl = `${getFrontendUrl()}/certificates/verify/${certificate.certificateNumber}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 180 });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  doc.rect(0, 0, width, height).fill('#f8fafc');
  doc.lineWidth(4).strokeColor('#2563eb').roundedRect(28, 28, width - 56, height - 56, 18).stroke();
  doc.lineWidth(1).strokeColor('#93c5fd').roundedRect(42, 42, width - 84, height - 84, 14).stroke();

  doc.fillColor('#1d4ed8').font('Vazir').fontSize(26).text('SKILN', 60, 58, { align: 'left' });
  drawCenteredFa(doc, 'گواهینامه پایان دوره', 80, { size: 34, color: '#1e3a8a' });
  drawCenteredFa(doc, 'بدین وسیله گواهی می‌شود که', 145, { size: 18, color: '#475569' });
  drawCenteredFa(doc, certificate.user?.name || 'دانشجوی Skiln', 185, { size: 32, color: '#0f172a' });
  drawCenteredFa(doc, 'دوره زیر را با موفقیت به پایان رسانده است', 240, { size: 18, color: '#475569' });
  drawCenteredFa(doc, certificate.course?.title || 'دوره آموزشی', 282, { size: 30, color: '#1d4ed8' });

  const issued = new Date(certificate.issuedAt).toLocaleDateString('fa-IR');
  const completed = new Date(certificate.completedAt).toLocaleDateString('fa-IR');
  drawCenteredFa(doc, `تاریخ تکمیل: ${completed}     تاریخ صدور: ${issued}`, 345, { size: 15, color: '#334155' });

  doc.font('Vazir').fontSize(11).fillColor('#475569');
  doc.text(`Certificate No: ${certificate.certificateNumber}`, 70, height - 106, { align: 'left' });
  doc.text(`Verify: ${verificationUrl}`, 70, height - 82, { align: 'left' });

  doc.image(qrBuffer, width - 168, height - 168, { width: 108, height: 108 });
  doc.font('Vazir').fontSize(10).fillColor('#64748b').text('Scan to verify', width - 178, height - 54, { width: 128, align: 'center' });

  doc.end();
  return done;
};

module.exports = {
  getCertificate,
  getUserCertificates,
  verifyCertificate,
  generateCertificatePdf,
  formatCertificate,
};
