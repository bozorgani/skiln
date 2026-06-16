const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schemaValidate = require('../../middlewares/schemaValidate');
const { courseSchemas, reviewSchemas } = require('../../validations/schemas');
const courseController = require('./course.controller');
const reviewController = require('../reviews/review.controller');

const router = express.Router();

router
  .route('/')
  .get(auth({ required: false }), courseController.listCourses)
  .post(
    auth(['admin', 'teacher']),
    schemaValidate(courseSchemas.create),
    validate(['title', 'description', 'price']),
    courseController.createCourse
  );

router
  .route('/:courseId/reviews')
  .get(reviewController.listCourseReviews)
  .post(auth(), schemaValidate(reviewSchemas.create), reviewController.createCourseReview);

router
  .route('/:id')
  .get(auth({ required: false }), courseController.getCourse)
  .patch(
    auth(['admin', 'teacher']),
    schemaValidate(courseSchemas.update),
    validate(['title', 'description', 'price', 'sections'], {
      allowPartial: true,
    }),
    courseController.updateCourse
  )
  .put(
    auth(['admin', 'teacher']),
    schemaValidate(courseSchemas.update),
    validate(['title', 'description', 'price', 'sections'], {
      allowPartial: true,
    }),
    courseController.updateCourse
  )
  .delete(auth(['admin', 'teacher']), courseController.deleteCourse);

router.patch(
  '/:id/status',
  auth(['admin', 'teacher']),
  schemaValidate(courseSchemas.status),
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
  auth({ required: false }),
  courseController.getLessonById
);

// Get lesson by section and lesson index (legacy format)
router.get(
  '/:courseId/lessons/:sectionIndex/:lessonIndex',
  auth({ required: false }),
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

