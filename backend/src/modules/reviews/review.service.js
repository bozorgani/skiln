const mongoose = require('mongoose');
const ApiError = require('../../core/ApiError');
const { textOnly } = require('../../utils/sanitizeHtml');
const Course = require('../courses/course.model');
const Review = require('./review.model');

const toPositiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const recalculateCourseRating = async (courseId) => {
  const result = await Review.aggregate([
    { $match: { course: typeof courseId === 'string' ? mongoose.Types.ObjectId.createFromHexString(courseId) : courseId, isApproved: true } },
    { $group: { _id: '$course', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const stats = result[0] || { average: 0, count: 0 };
  await Course.findByIdAndUpdate(courseId, { ratings: { average: stats.average || 0, count: stats.count || 0 } });
};

const assertCanReview = async (courseId, user) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, 'دوره یافت نشد');
  if (['admin', 'teacher'].includes(user.role)) return course;
  const enrolled = course.students.some((student) => student.toString() === user._id.toString());
  if (!enrolled) throw new ApiError(403, 'برای ثبت نظر باید در دوره ثبت‌نام کرده باشید');
  return course;
};

const createReview = async (courseId, user, payload) => {
  await assertCanReview(courseId, user);
  const userId = user._id;
  try {
    const review = await Review.create({
      course: courseId,
      user: userId,
      title: payload.title ? textOnly(payload.title) : undefined,
      content: textOnly(payload.content),
      rating: Number(payload.rating),
      status: 'pending',
      isApproved: false,
    });
    return review.populate([{ path: 'user', select: 'name avatar' }, { path: 'course', select: 'title thumbnail' }]);
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, 'شما قبلاً برای این دوره نظر ثبت کرده‌اید');
    throw error;
  }
};

const listReviews = async (filters = {}, admin = false) => {
  const query = {};
  if (filters.courseId) query.course = filters.courseId;
  if (filters.status) query.status = filters.status;
  if (!admin) query.isApproved = true;
  const page = toPositiveInt(filters.page, 1, 100000);
  const limit = toPositiveInt(filters.limit, 20, 100);
  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('user', 'name avatar role')
      .populate('course', 'title thumbnail')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(query),
  ]);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return { reviews, pagination: { total, totalPages, currentPage: page, limit, hasPrevPage: page > 1, hasNextPage: page < totalPages } };
};

const moderateReview = async (id, isApproved, adminId) => {
  const review = await Review.findByIdAndUpdate(
    id,
    { isApproved, status: isApproved ? 'approved' : 'rejected', moderatedBy: adminId, moderatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('user', 'name avatar role').populate('course', 'title thumbnail');
  if (!review) throw new ApiError(404, 'نظر یافت نشد');
  await recalculateCourseRating(review.course._id || review.course);
  return review;
};

const deleteReview = async (id) => {
  const review = await Review.findByIdAndDelete(id);
  if (!review) throw new ApiError(404, 'نظر یافت نشد');
  await recalculateCourseRating(review.course);
  return review;
};

module.exports = { createReview, listReviews, moderateReview, deleteReview, recalculateCourseRating };
