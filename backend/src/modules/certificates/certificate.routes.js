const express = require('express');
const auth = require('../../middlewares/auth');
const certificateController = require('./certificate.controller');

const router = express.Router();

router.get('/user/my-certificates', auth(), certificateController.getUserCertificates);
router.get('/verify/:certificateNumber', certificateController.verifyCertificate);
router.get('/:courseId/meta', auth(), certificateController.getCertificate);
router.get('/:courseId', auth(), certificateController.downloadCertificate);

module.exports = router;
