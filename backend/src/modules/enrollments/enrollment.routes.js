const express = require('express');
const auth = require('../../middlewares/auth');
const enrollmentController = require('./enrollment.controller');

const router = express.Router();

// Get all courses that the current user is enrolled in
router.get('/my-courses', auth(), enrollmentController.getMyCourses);

// Enroll in a course
router.post('/:courseId', auth(), enrollmentController.enroll);

// Get enrollment details for a specific course
router.get('/:courseId', auth(), enrollmentController.getEnrollment);

// Update progress for a course
router.put('/:courseId/progress', auth(), enrollmentController.updateProgress);

module.exports = router;

