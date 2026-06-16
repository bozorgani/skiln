const express = require('express');
const auth = require('../../middlewares/auth');
const certificateController = require('./certificate.controller');

const router = express.Router();

// Get certificate for a course
router.get('/:courseId', auth(), certificateController.getCertificate);

// Get all certificates for current user
router.get('/user/my-certificates', auth(), certificateController.getUserCertificates);

// Verify certificate by certificate number (public endpoint)
router.get('/verify/:certificateNumber', certificateController.verifyCertificate);

module.exports = router;

