const ApiError = require('../../core/ApiError');
const Course = require('../courses/course.model');
const Payment = require('../payments/payment.model');
const Order = require('../orders/order.model');
const progressService = require('../progress/progress.service');

/**
 * Get all courses that a user is enrolled in
 */
const getMyCourses = async (userId) => {
  // Find all courses where the user is in the students array
  const courses = await Course.find({ students: userId })
    .populate('teacher', 'name email phone')
    .sort({ createdAt: -1 });

  // Get enrollment details for each course (payment status, enrollment date, etc.)
  const enrollments = await Promise.all(
    courses.map(async (course) => {
      // Find the order/payment for this enrollment
      // Check for paid orders first, then check for any order (legacy data)
      let order = await Order.findOne({
        user: userId,
        course: course._id,
        status: 'paid',
      }).sort({ createdAt: -1 });
      
      // If no paid order found, check for any order (legacy data without status field)
      if (!order) {
        const anyOrder = await Order.findOne({
          user: userId,
          course: course._id,
        }).sort({ createdAt: -1 });
        // If order exists but has no status field, consider it as paid
        if (anyOrder && (!anyOrder.status || anyOrder.status === null)) {
          order = anyOrder;
        }
      }

      const payment = order
        ? await Payment.findOne({ order: order._id }).sort({ createdAt: -1 })
        : null;

      const totalLessons = course.sections.reduce(
        (sum, section) => sum + (section.lessons?.length || 0),
        0
      );

      const progress = await progressService.getProgress(course._id, userId) || {
        totalLessons,
        completedLessons: [],
        lessonProgress: [],
        completionPercentage: 0,
        lastWatchedLesson: null,
        lastAccessed: null,
        certificateIssued: false,
      };

      return {
        _id: `${userId}-${course._id}`,
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          price: course.price,
          discountPercent: course.discountPercent || 0,
          thumbnail: course.thumbnail,
          teacher: course.teacher,
          sections: course.sections,
          status: course.status,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        },
        enrolledAt: order?.createdAt || course.createdAt,
        payment: payment
          ? {
              _id: payment._id,
              amount: payment.amount,
              status: payment.status,
              method: payment.method || payment.provider,
              createdAt: payment.createdAt,
            }
          : null,
        progress: {
          totalLessons,
          completedLessons: progress.completedLessons || [],
          lessonProgress: progress.lessonProgress || [],
          percentage: progress.completionPercentage || 0,
          completionPercentage: progress.completionPercentage || 0,
          lastWatchedLesson: progress.lastWatchedLesson,
          lastAccessed: progress.lastAccessed,
          updatedAt: progress.updatedAt,
          certificateIssued: progress.certificateIssued || false,
        },
      };
    })
  );

  return enrollments;
};

/**
 * Enroll a user in a course
 */
const enrollInCourse = async (courseId, userId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  // Check if user is already enrolled
  const alreadyEnrolled = course.students.some(
    (studentId) => studentId.toString() === userId.toString()
  );

  if (alreadyEnrolled) {
    throw new ApiError(400, 'User is already enrolled in this course');
  }

  // Add user to students array
  course.students.push(userId);
  await course.save();

  return course;
};

/**
 * Get enrollment details for a specific course
 */
const getEnrollment = async (courseId, userId) => {
  const course = await Course.findById(courseId).populate('teacher', 'name email phone');

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  // Check if user is enrolled - check both course.students and paid orders
  const isEnrolledInStudents = course.students.some(
    (studentId) => studentId.toString() === userId.toString()
  );
  
  // Also check if there's a paid order (in case enrollment wasn't synced properly)
  // Check for paid orders, or any order if status field doesn't exist (legacy data)
  let hasPaidOrder = await Order.findOne({
    user: userId,
    course: courseId,
    status: 'paid',
  });
  
  // If no paid order found, check for any order (legacy data without status field)
  if (!hasPaidOrder) {
    const anyOrder = await Order.findOne({
      user: userId,
      course: courseId,
    });
    // If order exists but has no status field, consider it as paid
    if (anyOrder && (!anyOrder.status || anyOrder.status === null)) {
      hasPaidOrder = anyOrder;
    }
  }
  
  const isEnrolled = isEnrolledInStudents || !!hasPaidOrder;

  if (!isEnrolled) {
    throw new ApiError(403, 'User is not enrolled in this course');
  }
  
  // If user has paid order but not in students array, enroll them now
  if (hasPaidOrder && !isEnrolledInStudents) {
    course.students.push(userId);
    await course.save();
  }

  // Get order and payment info
  // Check for paid orders first, then check for any order (legacy data)
  let order = await Order.findOne({
    user: userId,
    course: courseId,
    status: 'paid',
  }).sort({ createdAt: -1 });
  
  // If no paid order found, check for any order (legacy data without status field)
  if (!order) {
    const anyOrder = await Order.findOne({
      user: userId,
      course: courseId,
    }).sort({ createdAt: -1 });
    // If order exists but has no status field, consider it as paid
    if (anyOrder && (!anyOrder.status || anyOrder.status === null)) {
      order = anyOrder;
    }
  }

  const payment = order
    ? await Payment.findOne({ order: order._id }).sort({ createdAt: -1 })
    : null;

  const totalLessons = course.sections.reduce(
    (sum, section) => sum + (section.lessons?.length || 0),
    0
  );

  // Get progress
  let progressData = {
    totalLessons,
    completedLessons: [],
    completionPercentage: 0,
    lastWatchedLesson: null,
    completedAt: null,
    certificateIssued: false,
  };

  try {
    const progress = await progressService.getProgress(courseId, userId);
    if (progress) {
      progressData = {
        totalLessons: progress.totalLessons,
        completedLessons: progress.completedLessons || [],
        lessonProgress: progress.lessonProgress || [],
        completionPercentage: progress.completionPercentage || 0,
        lastWatchedLesson: progress.lastWatchedLesson,
        lastAccessed: progress.lastAccessed,
        completedAt: progress.completedAt,
        certificateIssued: progress.certificateIssued || false,
      };
    }
  } catch (error) {
    // If progress doesn't exist, use defaults
  }

  return {
    course: {
      _id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      thumbnail: course.thumbnail,
      teacher: course.teacher,
      sections: course.sections,
      status: course.status,
    },
    enrolledAt: order?.createdAt || course.createdAt,
    payment: payment
      ? {
          _id: payment._id,
          amount: payment.amount,
          status: payment.status,
          method: payment.method,
        }
      : null,
    progress: progressData,
  };
};

/**
 * Update progress for a course
 * This now uses the Progress model for proper tracking
 */
const updateProgress = async (courseId, userId, lessonId, completed, meta = {}) => {
  return progressService.updateProgress(courseId, userId, lessonId, completed, meta);
};

module.exports = {
  getMyCourses,
  enrollInCourse,
  getEnrollment,
  updateProgress,
};

