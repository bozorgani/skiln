const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const blogController = require('./blog.controller');

const router = express.Router();

router.get('/', blogController.listPosts);

router.post(
  '/',
  auth('admin'),
  validate(['title', 'description', 'thumbnail', 'content']),
  blogController.createPost
);

// Specific routes before dynamic routes
router.get('/slug/:slug', blogController.getPostBySlug);

// PUT/PATCH/DELETE routes (expecting ObjectId)
router
  .route('/:id')
  .get(blogController.getPost) // Can be either id or slug
  .patch(
    auth('admin'),
    validate(['title', 'description', 'thumbnail', 'content'], { allowPartial: true }),
    blogController.updatePost
  )
  .put(
    auth('admin'),
    validate(['title', 'description', 'thumbnail', 'content'], { allowPartial: true }),
    blogController.updatePost
  )
  .delete(auth('admin'), blogController.deletePost);

router.patch(
  '/:id/publish',
  auth('admin'),
  blogController.publishPost
);

module.exports = router;

