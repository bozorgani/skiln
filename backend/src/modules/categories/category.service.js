const slugify = require('slugify');
const ApiError = require('../../core/ApiError');
const { textOnly } = require('../../utils/sanitizeHtml');
const Category = require('./category.model');

const normalizePayload = (payload = {}, { partial = false } = {}) => {
  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
    normalized.name = textOnly(payload.name || '');
  } else if (!partial) {
    normalized.name = '';
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'slug')) {
    normalized.slug = payload.slug
      ? slugify(textOnly(payload.slug), { lower: true, strict: true })
      : undefined;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'type')) normalized.type = payload.type;
  if (Object.prototype.hasOwnProperty.call(payload, 'description')) normalized.description = payload.description ? textOnly(payload.description) : '';
  if (Object.prototype.hasOwnProperty.call(payload, 'icon')) normalized.icon = payload.icon ? textOnly(payload.icon) : '';
  if (Object.prototype.hasOwnProperty.call(payload, 'color')) normalized.color = payload.color ? textOnly(payload.color) : '';
  if (Object.prototype.hasOwnProperty.call(payload, 'order')) normalized.order = Number(payload.order) || 0;
  if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) normalized.isActive = payload.isActive !== false;

  if (!partial && !Object.prototype.hasOwnProperty.call(normalized, 'isActive')) normalized.isActive = true;
  if (!partial && !normalized.color) normalized.color = 'from-primary to-indigo-600';

  return normalized;
};

const listCategories = async (filters = {}, user = null) => {
  const query = {};
  if (filters.type) query.type = filters.type;
  const canSeeInactive = user?.role === 'admin' && (filters.includeInactive === 'true' || filters.includeInactive === true);
  if (!canSeeInactive) query.isActive = true;
  return Category.find(query).sort({ type: 1, order: 1, name: 1 });
};

const createCategory = async (payload) => {
  try {
    return await Category.create(normalizePayload(payload));
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, 'دسته‌بندی با این slug و type قبلاً وجود دارد');
    throw error;
  }
};

const getCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, 'دسته‌بندی یافت نشد');
  return category;
};

const updateCategory = async (id, payload) => {
  try {
    const category = await Category.findByIdAndUpdate(id, normalizePayload(payload, { partial: true }), { new: true, runValidators: true });
    if (!category) throw new ApiError(404, 'دسته‌بندی یافت نشد');
    return category;
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, 'دسته‌بندی با این slug و type قبلاً وجود دارد');
    throw error;
  }
};

const deleteCategory = async (id) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new ApiError(404, 'دسته‌بندی یافت نشد');
  return category;
};

module.exports = { listCategories, createCategory, getCategory, updateCategory, deleteCategory };
