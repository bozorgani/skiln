const ApiError = require('../../core/ApiError');
const Blog = require('./blog.model');

const createPost = async (payload) => {
  return Blog.create(payload);
};

const updatePost = async (id, payload) => {
  const post = await Blog.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!post) {
    throw new ApiError(404, 'Blog post not found');
  }
  return post;
};

const deletePost = async (id) => {
  const post = await Blog.findByIdAndDelete(id);
  if (!post) {
    throw new ApiError(404, 'Blog post not found');
  }
  return post;
};

const listPosts = async () => {
  return Blog.find()
    .populate('author', 'name role')
    .sort({ createdAt: -1 });
};

const getPostBySlug = async (slug) => {
  const post = await Blog.findOne({ slug }).populate('author', 'name role');
  if (!post) {
    throw new ApiError(404, 'Blog post not found');
  }
  return post;
};

const getPostById = async (id) => {
  const post = await Blog.findById(id).populate('author', 'name role');
  if (!post) {
    throw new ApiError(404, 'Blog post not found');
  }
  return post;
};

const publishPost = async (id, isPublished) => {
  const post = await Blog.findByIdAndUpdate(
    id,
    { isPublished: isPublished !== false },
    { new: true, runValidators: true }
  ).populate('author', 'name role');
  if (!post) {
    throw new ApiError(404, 'Blog post not found');
  }
  return post;
};

module.exports = {
  createPost,
  updatePost,
  deletePost,
  listPosts,
  getPostBySlug,
  getPostById,
  publishPost,
};

