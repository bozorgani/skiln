const ApiError = require('../../core/ApiError');
const Progress = require('./progress.model');
const Course = require('../courses/course.model');
const Certificate = require('../certificates/certificate.model');

/**
 * Get or create progress for a user in a course
 */
const getOrCreateProgress = async (courseId, userId) => {
  let progress = await Progress.findOne({ user: userId, course: courseId });
  
  if (!progress) {
    // Create new progress
    progress = await Progress.create({
      user: userId,
      course: courseId,
      completedLessons: [],
      completionPercentage: 0,
    });
  }
  
  return progress;
};

/**
 * Update progress for a course
 */
const updateProgress = async (courseId, userId, lessonId, completed) => {
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw new ApiError(404, 'دوره یافت نشد');
  }

  // Check if user is enrolled
  const isEnrolled = course.students.some(
    (studentId) => studentId.toString() === userId.toString()
  );

  if (!isEnrolled) {
    throw new ApiError(403, 'شما در این دوره ثبت‌نام نکرده‌اید');
  }

  // Get or create progress
  const progress = await getOrCreateProgress(courseId, userId);

  if (completed) {
    // Add lesson to completed lessons if not already there
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      progress.lastWatchedLesson = lessonId;
    }
  } else {
    // Remove lesson from completed lessons
    progress.completedLessons = progress.completedLessons.filter(
      (id) => id.toString() !== lessonId.toString()
    );
  }

  // Calculate total lessons
  const totalLessons = course.sections.reduce(
    (sum, section) => sum + (section.lessons?.length || 0),
    0
  );

  // Calculate completion percentage
  const completedCount = progress.completedLessons.length;
  progress.completionPercentage = totalLessons > 0 
    ? Math.round((completedCount / totalLessons) * 100) 
    : 0;

  // If 100% completed, set completedAt
  if (progress.completionPercentage === 100 && !progress.completedAt) {
    progress.completedAt = new Date();
    
    // Issue certificate if not already issued
    if (!progress.certificateIssued) {
      await issueCertificate(courseId, userId, progress);
      progress.certificateIssued = true;
    }
  } else if (progress.completionPercentage < 100) {
    progress.completedAt = null;
    progress.certificateIssued = false;
  }

  await progress.save();

  return {
    courseId,
    lessonId,
    completed,
    progress: {
      completedLessons: progress.completedLessons,
      completionPercentage: progress.completionPercentage,
      totalLessons,
      certificateIssued: progress.certificateIssued,
    },
  };
};

/**
 * Get progress for a course
 */
const getProgress = async (courseId, userId) => {
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw new ApiError(404, 'دوره یافت نشد');
  }

  // Check if user is enrolled
  const isEnrolled = course.students.some(
    (studentId) => studentId.toString() === userId.toString()
  );

  if (!isEnrolled) {
    return null; // Return null if not enrolled (not an error)
  }

  const progress = await getOrCreateProgress(courseId, userId);
  
  // Calculate total lessons
  const totalLessons = course.sections.reduce(
    (sum, section) => sum + (section.lessons?.length || 0),
    0
  );

  // Get certificate if exists
  const certificate = await Certificate.findOne({ user: userId, course: courseId });

  return {
    completedLessons: progress.completedLessons || [],
    totalLessons,
    completionPercentage: progress.completionPercentage || 0,
    lastWatchedLesson: progress.lastWatchedLesson,
    completedAt: progress.completedAt,
    certificateIssued: progress.certificateIssued || false,
    certificate: certificate ? {
      certificateNumber: certificate.certificateNumber,
      issuedAt: certificate.issuedAt,
    } : null,
  };
};

/**
 * Issue certificate for completed course
 */
const issueCertificate = async (courseId, userId, progress) => {
  // Check if certificate already exists
  const existingCertificate = await Certificate.findOne({ user: userId, course: courseId });
  if (existingCertificate) {
    return existingCertificate;
  }

  // Generate certificate number
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const certificateNumber = `CERT-${timestamp}-${random}`;

  // Create certificate
  const certificate = await Certificate.create({
    user: userId,
    course: courseId,
    progress: progress._id,
    certificateNumber,
    completedAt: progress.completedAt || new Date(),
  });

  return certificate;
};

module.exports = {
  getOrCreateProgress,
  updateProgress,
  getProgress,
  issueCertificate,
};







