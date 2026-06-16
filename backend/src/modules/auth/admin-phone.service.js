const ApiError = require('../../core/ApiError');
const { normalizePhone } = require('../../utils/phone');
const AdminPhone = require('./admin-phone.model');
const authService = require('./auth.service');

const getAllAdminPhones = async () => {
  return AdminPhone.find().sort({ createdAt: -1 });
};

const getAdminPhoneById = async (id) => {
  const adminPhone = await AdminPhone.findById(id);
  if (!adminPhone) {
    throw new ApiError(404, 'Admin phone not found');
  }
  return adminPhone;
};

const createAdminPhone = async ({ phone, name, addedBy }) => {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new ApiError(400, 'Invalid phone number');
  }

  // بررسی تکراری نبودن
  const existing = await AdminPhone.findOne({ phone: normalized });
  if (existing) {
    throw new ApiError(400, 'This phone number is already in the admin list');
  }

  const adminPhone = await AdminPhone.create({
    phone: normalized,
    name: name || 'مدیر سیستم',
    addedBy,
    isActive: true,
  });

  // پاک کردن cache
  authService.clearAdminPhonesCache();

  return adminPhone;
};

const updateAdminPhone = async (id, { name, isActive }) => {
  const adminPhone = await AdminPhone.findByIdAndUpdate(
    id,
    { name, isActive },
    { new: true, runValidators: true }
  );

  if (!adminPhone) {
    throw new ApiError(404, 'Admin phone not found');
  }

  // پاک کردن cache
  authService.clearAdminPhonesCache();

  return adminPhone;
};

const deleteAdminPhone = async (id) => {
  const adminPhone = await AdminPhone.findByIdAndDelete(id);
  if (!adminPhone) {
    throw new ApiError(404, 'Admin phone not found');
  }

  // پاک کردن cache
  authService.clearAdminPhonesCache();

  return adminPhone;
};

module.exports = {
  getAllAdminPhones,
  getAdminPhoneById,
  createAdminPhone,
  updateAdminPhone,
  deleteAdminPhone,
};

