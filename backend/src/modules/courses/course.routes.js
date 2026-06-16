const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const courseController = require('./course.controller');

const router = express.Router();

router
  .route('/')
  .get(courseController.listCourses)
  .post(
    auth(['admin', 'teacher']),
    validate(['title', 'description', 'price', 'thumbnail']),
    courseController.createCourse
  );

router
  .route('/:id')
  .get(courseController.getCourse)
  .patch(
    auth(['admin', 'teacher']),
    validate(['title', 'description', 'price', 'thumbnail', 'sections'], {
      allowPartial: true,
    }),
    courseController.updateCourse
  )
  .put(
    auth(['admin', 'teacher']),
    validate(['title', 'description', 'price', 'thumbnail', 'sections'], {
      allowPartial: true,
    }),
    courseController.updateCourse
  )
  .delete(auth(['admin', 'teacher']), courseController.deleteCourse);

router.patch(
  '/:id/status',
  auth(['admin', 'teacher']),
  validate(['status']),
  courseController.setCourseStatus
);

router.get(
  '/:id/analytics',
  auth(['admin', 'teacher']),
  courseController.getCourseAnalytics
);

router.post('/:id/enroll', auth(['admin', 'student']), courseController.enroll);

// Lessons routes - auth is optional (for free courses)
router.get(
  '/:courseId/lessons',
  auth({ required: false }), // Optional authentication - for free courses access
  courseController.getLessonsByCourse
);

// Get lesson by ID (virtual ID format: courseId-sectionIndex-lessonIndex)
router.get(
  '/lessons/:lessonId',
  courseController.getLessonById
);

// Get lesson by section and lesson index (legacy format)
router.get(
  '/:courseId/lessons/:sectionIndex/:lessonIndex',
  courseController.getLessonById
);

router.post(
  '/:courseId/lessons/:sectionIndex',
  auth(['admin', 'teacher']),
  validate(['title']),
  courseController.createLesson
);

router.put(
  '/:courseId/lessons/:sectionIndex/:lessonIndex',
  auth(['admin', 'teacher']),
  validate(['title'], { allowPartial: true }),
  courseController.updateLesson
);

router.patch(
  '/:courseId/lessons/:sectionIndex/:lessonIndex',
  auth(['admin', 'teacher']),
  validate(['title'], { allowPartial: true }),
  courseController.updateLesson
);

router.delete(
  '/:courseId/lessons/:sectionIndex/:lessonIndex',
  auth(['admin', 'teacher']),
  courseController.deleteLesson
);

module.exports = router;

