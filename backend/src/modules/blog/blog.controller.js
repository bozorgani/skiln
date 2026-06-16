const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const blogService = require('./blog.service');

exports.createPost = catchAsync(async (req, res) => {
  const post = await blogService.createPost({ ...req.body, author: req.user._id });
  sendResponse(res, {
    statusCode: 201,
    message: 'Blog post created',
    data: post,
  });
});

exports.updatePost = catchAsync(async (req, res) => {
  const post = await blogService.updatePost(req.params.id, req.body);
  sendResponse(res, { message: 'Blog post updated', data: post });
});

exports.deletePost = catchAsync(async (req, res) => {
  await blogService.deletePost(req.params.id);
  sendResponse(res, { message: 'Blog post deleted' });
});

exports.listPosts = catchAsync(async (_req, res) => {
  const posts = await blogService.listPosts();
  sendResponse(res, { data: posts, message: 'Blog posts retrieved' });
});

exports.getPost = catchAsync(async (req, res) => {
  const { id } = req.params;
  let post;
  // Check if it's a MongoDB ObjectId (24 hex characters)
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    post = await blogService.getPostById(id);
  } else {
    // Otherwise, treat it as a slug
    post = await blogService.getPostBySlug(id);
  }
  sendResponse(res, { data: { blog: post }, message: 'Blog post retrieved' });
});

exports.getPostBySlug = catchAsync(async (req, res) => {
  const post = await blogService.getPostBySlug(req.params.slug);
  sendResponse(res, { data: post, message: 'Blog post retrieved' });
});

exports.publishPost = catchAsync(async (req, res) => {
  const post = await blogService.publishPost(req.params.id, req.body.isPublished);
  sendResponse(res, { message: 'Blog post publish status updated', data: post });
});

