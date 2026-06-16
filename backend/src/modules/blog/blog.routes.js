const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schemaValidate = require('../../middlewares/schemaValidate');
const { blogSchemas } = require('../../validations/schemas');
const blogController = require('./blog.controller');

const router = express.Router();

router.get('/', auth({ required: false }), blogController.listPosts);

router.post(
  '/',
  auth('admin'),
  schemaValidate(blogSchemas.create),
  validate(['title', 'content']),
  blogController.createPost
);

// Specific routes before dynamic routes
router.get('/categories/list', blogController.getCategories);
router.get('/tags/list', blogController.getTags);
router.get('/slug/:slug', blogController.getPostBySlug);

// PUT/PATCH/DELETE routes (expecting ObjectId)
router
  .route('/:id')
  .get(blogController.getPost) // Can be either id or slug
  .patch(
    auth('admin'),
    schemaValidate(blogSchemas.update),
    validate(['title', 'content'], { allowPartial: true }),
    blogController.updatePost
  )
  .put(
    auth('admin'),
    schemaValidate(blogSchemas.update),
    validate(['title', 'content'], { allowPartial: true }),
    blogController.updatePost
  )
  .delete(auth('admin'), blogController.deletePost);

router.patch(
  '/:id/publish',
  auth('admin'),
  blogController.publishPost
);

router.put(
  '/:id/publish',
  auth('admin'),
  blogController.publishPost
);

module.exports = router;

