const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const reviewService = require('./review.service');

exports.createCourseReview = catchAsync(async (req, res) => {
  const review = await reviewService.createReview(req.params.courseId, req.user, req.body);
  sendResponse(res, { statusCode: 201, data: { review }, message: 'Review created and waiting for moderation' });
});

exports.listCourseReviews = catchAsync(async (req, res) => {
  const result = await reviewService.listReviews({ ...req.query, courseId: req.params.courseId }, false);
  sendResponse(res, { data: result, message: 'Course reviews retrieved' });
});

exports.listReviews = catchAsync(async (req, res) => {
  const result = await reviewService.listReviews(req.query, true);
  sendResponse(res, { data: result, message: 'Reviews retrieved' });
});

exports.moderateReview = catchAsync(async (req, res) => {
  const review = await reviewService.moderateReview(req.params.id, req.body.isApproved, req.user._id);
  sendResponse(res, { data: { review }, message: 'Review moderated' });
});

exports.deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReview(req.params.id);
  sendResponse(res, { message: 'Review deleted' });
});
