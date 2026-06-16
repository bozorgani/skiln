const ApiError = require('../../core/ApiError');
const { textOnly } = require('../../utils/sanitizeHtml');
const ContactMessage = require('./contact.model');

const toPositiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const createMessage = async (payload, meta = {}) => {
  return ContactMessage.create({
    name: textOnly(payload.name),
    email: textOnly(payload.email).toLowerCase(),
    phone: payload.phone ? textOnly(payload.phone) : undefined,
    subject: textOnly(payload.subject),
    message: textOnly(payload.message),
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
};

const listMessages = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.search) query.$text = { $search: String(filters.search).trim() };
  const page = toPositiveInt(filters.page, 1, 100000);
  const limit = toPositiveInt(filters.limit, 20, 100);
  const [messages, total] = await Promise.all([
    ContactMessage.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('repliedBy', 'name role'),
    ContactMessage.countDocuments(query),
  ]);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return { messages, pagination: { total, totalPages, currentPage: page, limit, hasPrevPage: page > 1, hasNextPage: page < totalPages } };
};

const getMessage = async (id) => {
  const message = await ContactMessage.findById(id).populate('repliedBy', 'name role');
  if (!message) throw new ApiError(404, 'پیام یافت نشد');
  if (message.status === 'new') {
    message.status = 'read';
    await message.save();
  }
  return message;
};

const updateStatus = async (id, payload, adminId) => {
  const update = { status: payload.status };
  if (payload.reply) {
    update.reply = textOnly(payload.reply);
    update.repliedBy = adminId;
    update.repliedAt = new Date();
    update.status = payload.status || 'replied';
  }
  const message = await ContactMessage.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!message) throw new ApiError(404, 'پیام یافت نشد');
  return message;
};

const deleteMessage = async (id) => {
  const message = await ContactMessage.findByIdAndDelete(id);
  if (!message) throw new ApiError(404, 'پیام یافت نشد');
  return message;
};

module.exports = { createMessage, listMessages, getMessage, updateStatus, deleteMessage };
