const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const courseService = require('./course.service');

exports.createCourse = catchAsync(async (req, res) => {
  const payload = { ...req.body, teacher: req.body.teacher || req.user._id };
  const course = await courseService.createCourse(payload);
  sendResponse(res, {
    statusCode: 201,
    message: 'Course created successfully',
    data: course,
  });
});

exports.updateCourse = catchAsync(async (req, res) => {
  const course = await courseService.updateCourse(req.params.id, req.body);
  sendResponse(res, { message: 'Course updated', data: course });
});

exports.setCourseStatus = catchAsync(async (req, res) => {
  const course = await courseService.setCourseStatus(
    req.params.id,
    req.body.status
  );
  sendResponse(res, { message: 'Course status updated', data: course });
});

exports.listCourses = catchAsync(async (req, res) => {
  const courses = await courseService.listCourses(req.query);
  // اگر courses یک array است، آن را به صورت { courses: [...] } برگردان
  // اگر courses یک object است (با pagination)، آن را همانطور برگردان
  const responseData = Array.isArray(courses) 
    ? { courses } 
    : courses;
  sendResponse(res, { data: responseData, message: 'Courses retrieved' });
});

exports.getCourse = catchAsync(async (req, res) => {
  const course = await courseService.getCourseById(req.params.id, req.query);
  // Response format را مطابق با frontend تنظیم کن
  sendResponse(res, { data: { course }, message: 'Course retrieved' });
});

exports.enroll = catchAsync(async (req, res) => {
  const userId =
    req.user.role === 'admin' && req.body.userId ? req.body.userId : req.user._id;
  const course = await courseService.enrollUser(req.params.id, userId);
  sendResponse(res, { message: 'Enrollment successful', data: course });
});

exports.deleteCourse = catchAsync(async (req, res) => {
  await courseService.deleteCourse(req.params.id);
  sendResponse(res, { message: 'Course deleted successfully' });
});

exports.getCourseAnalytics = catchAsync(async (req, res) => {
  const analytics = await courseService.getCourseAnalytics(req.params.id);
  sendResponse(res, { data: analytics, message: 'Course analytics retrieved' });
});

// Lessons controllers
exports.getLessonsByCourse = catchAsync(async (req, res) => {
  const userId = req.user?._id || null; // Get user ID if authenticated
  const result = await courseService.getLessonsByCourse(req.params.courseId, userId);
  sendResponse(res, { data: result, message: 'Lessons retrieved' });
});

exports.getLessonById = catchAsync(async (req, res) => {
  const { courseId, lessonId, sectionIndex, lessonIndex } = req.params;
  
  let result;
  
  // اگر lessonId وجود دارد (فرمت: /courses/lessons/:lessonId)
  if (lessonId && !sectionIndex && !lessonIndex) {
    // lessonId باید به صورت "courseId-sectionIndex-lessonIndex" باشد
    const parts = lessonId.split('-');
    if (parts.length >= 3) {
      const extractedCourseId = parts[0];
      const extractedSectionIndex = parseInt(parts[1]);
      const extractedLessonIndex = parseInt(parts[2]);
      result = await courseService.getLessonById(extractedCourseId, `${extractedCourseId}-${extractedSectionIndex}-${extractedLessonIndex}`, null);
    } else {
      // اگر فرمت درست نیست، سعی کن از courseId استفاده کن
      if (courseId) {
        result = await courseService.getLessonById(courseId, lessonId, null);
      } else {
        throw new Error('Invalid lesson ID format. Expected format: courseId-sectionIndex-lessonIndex');
      }
    }
  } 
  // اگر sectionIndex و lessonIndex وجود دارند (فرمت قدیمی)
  else if (sectionIndex !== undefined && lessonIndex !== undefined && courseId) {
    result = await courseService.getLessonById(courseId, parseInt(lessonIndex), parseInt(sectionIndex));
  } 
  else {
    throw new Error('Invalid lesson ID format');
  }
  
  sendResponse(res, { data: { lesson: result }, message: 'Lesson retrieved' });
});

exports.createLesson = catchAsync(async (req, res) => {
  const { courseId, sectionIndex } = req.params;
  const lesson = await courseService.createLesson(
    courseId,
    parseInt(sectionIndex),
    req.body
  );
  sendResponse(res, {
    statusCode: 201,
    message: 'Lesson created successfully',
    data: lesson,
  });
});

exports.updateLesson = catchAsync(async (req, res) => {
  const { courseId, sectionIndex, lessonIndex } = req.params;
  const lesson = await courseService.updateLesson(
    courseId,
    parseInt(sectionIndex),
    parseInt(lessonIndex),
    req.body
  );
  sendResponse(res, { data: lesson, message: 'Lesson updated' });
});

exports.deleteLesson = catchAsync(async (req, res) => {
  const { courseId, sectionIndex, lessonIndex } = req.params;
  await courseService.deleteLesson(
    courseId,
    parseInt(sectionIndex),
    parseInt(lessonIndex)
  );
  sendResponse(res, { message: 'Lesson deleted successfully' });
});

