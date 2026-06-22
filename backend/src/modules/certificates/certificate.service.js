const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const sharp = require('sharp');
const ApiError = require('../../core/ApiError');
const Certificate = require('./certificate.model');
const Progress = require('../progress/progress.model');
const Course = require('../courses/course.model');

const FONT_REGULAR_PATH = require.resolve('vazirmatn/fonts/ttf/Vazirmatn-Regular.ttf');
const FONT_BOLD_PATH = require.resolve('vazirmatn/fonts/ttf/Vazirmatn-Bold.ttf');
const FONT_REGULAR_BASE64 = fs.readFileSync(FONT_REGULAR_PATH).toString('base64');
const FONT_BOLD_BASE64 = fs.readFileSync(FONT_BOLD_PATH).toString('base64');

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const escapeXml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const faDate = (value) => new Date(value).toLocaleDateString('fa-IR-u-nu-latn', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

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

const buildCertificateSvg = async (certificate) => {
  const width = 1600;
  const height = 1131;
  const verificationUrl = `${getFrontendUrl()}/certificates/verify/${certificate.certificateNumber}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 220 });
  const issued = faDate(certificate.issuedAt);
  const completed = faDate(certificate.completedAt);
  const studentName = escapeXml(certificate.user?.name || 'دانشجوی Skiln');
  const courseTitle = escapeXml(certificate.course?.title || 'دوره آموزشی');
  const certificateNumber = escapeXml(certificate.certificateNumber);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style><![CDATA[
      @font-face { font-family: 'Vazirmatn'; src: url(data:font/truetype;charset=utf-8;base64,${FONT_REGULAR_BASE64}) format('truetype'); font-weight: 400; }
      @font-face { font-family: 'Vazirmatn'; src: url(data:font/truetype;charset=utf-8;base64,${FONT_BOLD_BASE64}) format('truetype'); font-weight: 700; }
      .fa { font-family: 'Vazirmatn', sans-serif; direction: rtl; unicode-bidi: bidi-override; text-anchor: middle; }
      .latin { font-family: 'Vazirmatn', sans-serif; }
    ]]></style>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eff6ff"/>
      <stop offset="0.5" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#eef2ff"/>
    </linearGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="48" y="48" width="1504" height="1035" rx="30" fill="none" stroke="#2563eb" stroke-width="8"/>
  <rect x="76" y="76" width="1448" height="979" rx="24" fill="none" stroke="#93c5fd" stroke-width="2"/>

  <circle cx="210" cy="185" r="92" fill="#dbeafe" opacity="0.8"/>
  <circle cx="1390" cy="925" r="120" fill="#ede9fe" opacity="0.8"/>
  <path d="M108 280 C 360 160, 470 260, 720 120" fill="none" stroke="#bfdbfe" stroke-width="4" opacity="0.7"/>
  <path d="M910 1010 C 1120 890, 1230 1010, 1490 800" fill="none" stroke="#ddd6fe" stroke-width="4" opacity="0.9"/>

  <text x="120" y="132" class="latin" font-size="48" font-weight="700" fill="#1d4ed8">SKILN</text>
  <text x="800" y="210" class="fa" font-size="68" font-weight="700" fill="#1e3a8a">گواهینامه پایان دوره</text>
  <text x="800" y="310" class="fa" font-size="34" fill="#475569">بدین وسیله گواهی می‌شود که</text>
  <text x="800" y="420" class="fa" font-size="64" font-weight="700" fill="#0f172a">${studentName}</text>
  <text x="800" y="515" class="fa" font-size="34" fill="#475569">دوره زیر را با موفقیت به پایان رسانده است</text>
  <text x="800" y="625" class="fa" font-size="58" font-weight="700" fill="#1d4ed8">${courseTitle}</text>

  <rect x="420" y="695" width="760" height="78" rx="22" fill="#eff6ff" stroke="#bfdbfe"/>
  <text x="800" y="745" class="fa" font-size="28" fill="#334155">تاریخ تکمیل: ${escapeXml(completed)}    تاریخ صدور: ${escapeXml(issued)}</text>

  <line x1="165" y1="885" x2="555" y2="885" stroke="#94a3b8" stroke-width="2"/>
  <text x="360" y="930" class="fa" font-size="24" fill="#475569">مدیریت آموزش Skiln</text>

  <image href="${qrDataUrl}" x="1305" y="780" width="170" height="170"/>
  <text x="1390" y="988" class="latin" font-size="18" text-anchor="middle" fill="#64748b">Scan to verify</text>

  <text x="115" y="1005" class="latin" font-size="20" fill="#475569">Certificate No: ${certificateNumber}</text>
  <text x="115" y="1042" class="latin" font-size="18" fill="#64748b">Verify: ${escapeXml(verificationUrl)}</text>
</svg>`;
};

const generateCertificatePdf = async (certificate) => {
  const svg = await buildCertificateSvg(certificate);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 0,
    info: {
      Title: `Skiln Certificate ${certificate.certificateNumber}`,
      Author: 'Skiln',
      Subject: 'Course Completion Certificate',
    },
  });

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.image(pngBuffer, 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });
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
