const express = require('express');
const auth = require('../../middlewares/auth');
const progressController = require('./progress.controller');

const router = express.Router();

// Update progress for a course
router.put('/:courseId', auth(), progressController.updateProgress);

// Get progress for a course
router.get('/:courseId', auth(), progressController.getProgress);

module.exports = router;

