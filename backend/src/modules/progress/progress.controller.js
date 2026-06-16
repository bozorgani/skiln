const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const progressService = require('./progress.service');

exports.updateProgress = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;
  const { lessonId, completed } = req.body;

  if (!lessonId) {
    throw new Error('lessonId is required');
  }

  const progress = await progressService.updateProgress(
    courseId,
    userId,
    lessonId,
    completed !== false // default to true if not specified
  );

  sendResponse(res, {
    message: 'پیشرفت با موفقیت به‌روزرسانی شد',
    data: progress,
  });
});

exports.getProgress = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const progress = await progressService.getProgress(courseId, userId);

  sendResponse(res, {
    message: 'پیشرفت با موفقیت دریافت شد',
    data: progress,
  });
});

