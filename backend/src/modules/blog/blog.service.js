const ApiError = require('../../core/ApiError');
const { richText, textOnly } = require('../../utils/sanitizeHtml');
const Blog = require('./blog.model');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toPositiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const buildSort = (sortValue, hasTextSearch = false) => {
  if (hasTextSearch && !sortValue) {
    return { score: { $meta: 'textScore' }, publishedAt: -1, createdAt: -1 };
  }

  const allowed = new Set(['createdAt', 'updatedAt', 'publishedAt', 'views', 'likes', 'readingTime', 'title']);
  const raw = typeof sortValue === 'string' && sortValue.trim() ? sortValue.trim() : '-publishedAt,-createdAt';
  const sort = {};

  raw.split(',').forEach((part) => {
    const field = part.trim();
    if (!field) return;
    const direction = field.startsWith('-') ? -1 : 1;
    const name = field.replace(/^-/, '');
    if (allowed.has(name)) sort[name] = direction;
  });

  return Object.keys(sort).length ? sort : { publishedAt: -1, createdAt: -1 };
};

const normalizePayload = (payload = {}) => {
  const normalized = { ...payload };

  ['title', 'description', 'excerpt', 'category'].forEach((field) => {
    if (typeof normalized[field] === 'string') {
      normalized[field] = textOnly(normalized[field]);
    }
  });

  if (typeof normalized.content === 'string') {
    normalized.content = richText(normalized.content);
  }

  if (Array.isArray(normalized.tags)) {
    normalized.tags = normalized.tags.map(textOnly).filter(Boolean).slice(0, 20);
  }

  if (normalized.seo) {
    normalized.seo = {
      metaTitle: normalized.seo.metaTitle ? textOnly(normalized.seo.metaTitle) : undefined,
      metaDescription: normalized.seo.metaDescription ? textOnly(normalized.seo.metaDescription) : undefined,
      keywords: Array.isArray(normalized.seo.keywords)
        ? normalized.seo.keywords.map(textOnly).filter(Boolean).slice(0, 20)
        : [],
    };
  }

  if (!normalized.description && normalized.excerpt) {
    normalized.description = normalized.excerpt;
  }
  if (!normalized.excerpt && normalized.description) {
    normalized.excerpt = normalized.description;
  }
  if (!normalized.thumbnail && normalized.featuredImage) {
    normalized.thumbnail = normalized.featuredImage;
  }
  if (!normalized.featuredImage && normalized.thumbnail) {
    normalized.featuredImage = normalized.thumbnail;
  }
  if (!normalized.category) {
    normalized.category = 'عمومی';
  }
  if (typeof normalized.tags === 'string') {
    normalized.tags = normalized.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (normalized.isPublished && !normalized.publishedAt) {
    normalized.publishedAt = new Date();
  }

  return normalized;
};

const createPost = async (payload) => {
  return Blog.create(normalizePayload(payload));
};

const updatePost = async (id, payload) => {
  const post = await Blog.findByIdAndUpdate(id, normalizePayload(payload), {
    new: true,
    runValidators: true,
  }).populate('author', 'name role avatar bio');
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

const listPosts = async (filters = {}) => {
  const query = {};
  const includeUnpublished =
    filters.canViewUnpublished === true ||
    ((filters.includeUnpublished === 'true' || filters.includeUnpublished === true) && filters.canViewUnpublished === true);
  if (!includeUnpublished) {
    query.isPublished = true;
  }

  if (filters.category) query.category = new RegExp(`^${escapeRegex(String(filters.category).trim())}$`, 'i');
  if (filters.tag) query.tags = new RegExp(`^${escapeRegex(String(filters.tag).trim())}$`, 'i');
  if (filters.author) query.author = filters.author;

  const hasTextSearch = typeof filters.search === 'string' && filters.search.trim().length > 0;
  if (hasTextSearch) {
    query.$text = { $search: filters.search.trim() };
  }

  const page = toPositiveInt(filters.page, 1, 100000);
  const limit = toPositiveInt(filters.limit, 12, 100);
  const skip = (page - 1) * limit;
  const sort = buildSort(filters.sort, hasTextSearch);

  const [blogs, total] = await Promise.all([
    Blog.find(query, hasTextSearch ? { score: { $meta: 'textScore' } } : undefined)
      .populate('author', 'name role avatar bio')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Blog.countDocuments(query),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    blogs,
    posts: blogs,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
};

const getPostBySlug = async (slug) => {
  const post = await Blog.findOne({ slug }).populate('author', 'name role avatar bio');
  if (!post) {
    throw new ApiError(404, 'Blog post not found');
  }
  return post;
};

const getPostById = async (id) => {
  const post = await Blog.findById(id).populate('author', 'name role avatar bio');
  if (!post) {
    throw new ApiError(404, 'Blog post not found');
  }
  return post;
};

const getCategories = async () => {
  const categories = await Blog.distinct('category', { category: { $exists: true, $ne: '' } });
  return categories.map((category, index) => ({
    _id: category,
    id: category,
    name: category,
    title: category,
    value: category,
    order: index,
  }));
};

const getTags = async () => {
  return Blog.distinct('tags', { tags: { $exists: true, $ne: [] } });
};

const publishPost = async (id, isPublished) => {
  const publish = isPublished !== false;
  const post = await Blog.findByIdAndUpdate(
    id,
    { isPublished: publish, publishedAt: publish ? new Date() : undefined },
    { new: true, runValidators: true }
  ).populate('author', 'name role avatar bio');
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
  getCategories,
  getTags,
  publishPost,
};
