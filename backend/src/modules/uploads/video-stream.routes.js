const express = require('express');
const auth = require('../../middlewares/auth');
const videoStreamController = require('./video-stream.controller');

const router = express.Router();

router.options('/:filename', videoStreamController.handleOptions);
router.head('/:filename', auth({ required: false }), videoStreamController.streamVideo);
router.get('/:filename', auth({ required: false }), videoStreamController.streamVideo);

module.exports = router;
