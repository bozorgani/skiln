const express = require('express');
const auth = require('../../middlewares/auth');
const schemaValidate = require('../../middlewares/schemaValidate');
const { reviewSchemas } = require('../../validations/schemas');
const reviewController = require('./review.controller');

const router = express.Router();

router.get('/', auth('admin'), reviewController.listReviews);
router.get('/course/:courseId', reviewController.listCourseReviews);
router.post('/course/:courseId', auth(), schemaValidate(reviewSchemas.create), reviewController.createCourseReview);
router.put('/:id/moderate', auth('admin'), schemaValidate(reviewSchemas.moderate), reviewController.moderateReview);
router.patch('/:id/moderate', auth('admin'), schemaValidate(reviewSchemas.moderate), reviewController.moderateReview);
router.delete('/:id', auth('admin'), reviewController.deleteReview);

module.exports = router;
