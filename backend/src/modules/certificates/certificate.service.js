const ApiError = require('../../core/ApiError');
const Certificate = require('./certificate.model');
const Progress = require('../progress/progress.model');

/**
 * Get certificate for a user and course
 */
const getCertificate = async (courseId, userId) => {
  const certificate = await Certificate.findOne({ user: userId, course: courseId })
    .populate('course', 'title description thumbnail')
    .populate('user', 'name email');

  if (!certificate) {
    throw new ApiError(404, 'گواهینامه یافت نشد');
  }

  return certificate;
};

/**
 * Get all certificates for a user
 */
const getUserCertificates = async (userId) => {
  const certificates = await Certificate.find({ user: userId })
    .populate('course', 'title description thumbnail')
    .sort({ issuedAt: -1 });

  return certificates;
};

/**
 * Verify certificate by certificate number
 */
const verifyCertificate = async (certificateNumber) => {
  const certificate = await Certificate.findOne({ certificateNumber })
    .populate('course', 'title description thumbnail')
    .populate('user', 'name email');

  if (!certificate) {
    throw new ApiError(404, 'گواهینامه نامعتبر است');
  }

  return certificate;
};

module.exports = {
  getCertificate,
  getUserCertificates,
  verifyCertificate,
};

