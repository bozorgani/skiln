const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const enrollmentService = require('./enrollment.service');

exports.getMyCourses = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const enrollments = await enrollmentService.getMyCourses(userId);
  sendResponse(res, {
    message: 'Enrollments retrieved successfully',
    data: { enrollments },
  });
});

exports.enroll = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const courseId = req.params.courseId;
  const course = await enrollmentService.enrollInCourse(courseId, userId);
  sendResponse(res, {
    message: 'Enrollment successful',
    data: course,
  });
});

exports.getEnrollment = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const courseId = req.params.courseId;
  const enrollment = await enrollmentService.getEnrollment(courseId, userId);
  sendResponse(res, {
    message: 'Enrollment retrieved successfully',
    data: enrollment,
  });
});

exports.updateProgress = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const courseId = req.params.courseId;
  const { lessonId, completed } = req.body;
  
  if (!lessonId) {
    throw new Error('lessonId is required');
  }
  
  const progress = await enrollmentService.updateProgress(courseId, userId, lessonId, completed !== false);
  sendResponse(res, {
    message: 'پیشرفت با موفقیت به‌روزرسانی شد',
    data: progress,
  });
});

