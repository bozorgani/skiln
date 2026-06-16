const express = require('express');
const videoStreamController = require('./video-stream.controller');

const router = express.Router();

// Log all requests to video routes
router.use((req, res, next) => {
  console.log('[VideoStreamRoutes] Route matched:', req.method, req.path, req.params);
  next();
});

// Handle CORS preflight for video requests
router.options('/:filename', (req, res, next) => {
  console.log('[VideoStreamRoutes] OPTIONS request:', req.params.filename);
  videoStreamController.handleOptions(req, res, next);
});

router.head('/:filename', (req, res, next) => {
  console.log('[VideoStreamRoutes] HEAD request:', req.params.filename);
  videoStreamController.streamVideo(req, res, next);
});

// Stream video file with CORS support
// Route: /uploads/videos/:filename (when mounted on /uploads/videos)
router.get('/:filename', videoStreamController.streamVideo);

module.exports = router;

