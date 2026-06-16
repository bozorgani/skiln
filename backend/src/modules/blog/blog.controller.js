const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const blogService = require('./blog.service');

exports.createPost = catchAsync(async (req, res) => {
  const post = await blogService.createPost({ ...req.body, author: req.user._id });
  sendResponse(res, {
    statusCode: 201,
    message: 'Blog post created',
    data: { blog: post, post },
  });
});

exports.updatePost = catchAsync(async (req, res) => {
  const post = await blogService.updatePost(req.params.id, req.body);
  sendResponse(res, { message: 'Blog post updated', data: { blog: post, post } });
});

exports.deletePost = catchAsync(async (req, res) => {
  await blogService.deletePost(req.params.id);
  sendResponse(res, { message: 'Blog post deleted' });
});

exports.listPosts = catchAsync(async (req, res) => {
  const canViewUnpublished = ['admin', 'teacher'].includes(req.user?.role);
  const result = await blogService.listPosts({ ...req.query, canViewUnpublished });
  sendResponse(res, { data: result, message: 'Blog posts retrieved' });
});

exports.getPost = catchAsync(async (req, res) => {
  const { id } = req.params;
  let post;
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    post = await blogService.getPostById(id);
  } else {
    post = await blogService.getPostBySlug(id);
  }
  sendResponse(res, { data: { blog: post, post }, message: 'Blog post retrieved' });
});

exports.getPostBySlug = catchAsync(async (req, res) => {
  const post = await blogService.getPostBySlug(req.params.slug);
  sendResponse(res, { data: { blog: post, post }, message: 'Blog post retrieved' });
});

exports.getCategories = catchAsync(async (_req, res) => {
  const categories = await blogService.getCategories();
  sendResponse(res, { data: { categories }, message: 'Blog categories retrieved' });
});

exports.getTags = catchAsync(async (_req, res) => {
  const tags = await blogService.getTags();
  sendResponse(res, { data: { tags }, message: 'Blog tags retrieved' });
});

exports.publishPost = catchAsync(async (req, res) => {
  const post = await blogService.publishPost(req.params.id, req.body.isPublished);
  sendResponse(res, { message: 'Blog post publish status updated', data: { blog: post, post } });
});
