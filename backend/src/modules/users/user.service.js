const ApiError = require('../../core/ApiError');
const { normalizePhone } = require('../../utils/phone');
const User = require('./user.model');

const normalizePayload = (payload = {}) => {
  const data = { ...payload };

  if (typeof data.phone !== 'undefined' && data.phone !== null) {
    data.phone = normalizePhone(data.phone);
  }

  if (typeof data.email !== 'undefined' && data.email !== null) {
    data.email = data.email.toLowerCase();
  }

  return data;
};

const ensureUniqueFields = async (id, { phone, email }) => {
  const conditions = [];
  if (phone) conditions.push({ phone });
  if (email) conditions.push({ email });
  if (!conditions.length) return;

  const query = { $or: conditions };
  if (id) {
    query._id = { $ne: id };
  }

  const existing = await User.findOne(query);
  if (!existing) return;

  if (phone && existing.phone === phone) {
    throw new ApiError(400, 'User with this phone already exists');
  }
  if (email && existing.email === email) {
    throw new ApiError(400, 'User with this email already exists');
  }
};

const createUser = async (payload) => {
  const data = normalizePayload(payload);
  if (!data.phone) {
    throw new ApiError(400, 'Phone number is required');
  }
  await ensureUniqueFields(null, data);
  return User.create(data);
};

const getUsers = async (filters = {}) => {
  const query = {};
  
  // فیلتر بر اساس role
  if (filters.role) {
    query.role = filters.role;
  } else {
    // به طور پیش‌فرض، مدیر سیستم (admin) را از لیست حذف کن
    // مگر اینکه explicitly درخواست شود
    query.role = { $ne: 'admin' };
  }
  
  // فیلتر بر اساس isActive
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive === 'true' || filters.isActive === true;
  }
  
  // جستجو بر اساس نام یا ایمیل
  if (filters.search) {
    // استفاده از $and برای ترکیب search با فیلتر role
    const searchConditions = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { phone: { $regex: filters.search, $options: 'i' } },
    ];
    
    // اگر role فیلتر شده باشد، $and استفاده کن
    if (query.role) {
      query.$and = [
        { role: query.role },
        { $or: searchConditions },
      ];
      // role را از query اصلی حذف کن چون در $and هست
      delete query.role;
    } else {
      query.$or = searchConditions;
    }
  }
  
  // Pagination
  const limit = filters.limit ? parseInt(filters.limit, 10) : 100;
  const skip = filters.skip ? parseInt(filters.skip, 10) : 0;
  const page = filters.page ? parseInt(filters.page, 10) : 1;
  const actualSkip = skip || (page - 1) * limit;
  
  // اجرای query با pagination
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(actualSkip),
    User.countDocuments(query),
  ]);
  
  return {
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      skip: actualSkip,
    },
  };
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

const updateUser = async (id, payload) => {
  const data = normalizePayload(payload);
  await ensureUniqueFields(id, data);
  const user = await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

const updateProfile = async (id, payload) => {
  return updateUser(id, payload);
};

const updateUserRole = async (id, role) => {
  if (!['admin', 'teacher', 'student'].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }
  return updateUser(id, { role });
};

/**
 * Get user statistics
 */
const getUserStats = async (userId) => {
  const Course = require('../courses/course.model');
  const Order = require('../orders/order.model');
  const Payment = require('../payments/payment.model');
  const Certificate = require('../certificates/certificate.model');
  const progressService = require('../progress/progress.service');

  const enrolledCoursesList = await Course.find({ students: userId }).select('_id sections');
  const totalCourses = enrolledCoursesList.length;

  const progresses = await Promise.all(
    enrolledCoursesList.map((course) => progressService.getProgress(course._id, userId).catch(() => null))
  );

  const totalLessons = progresses.reduce((sum, progress, index) => {
    if (progress?.totalLessons) return sum + progress.totalLessons;
    const course = enrolledCoursesList[index];
    return sum + (course.sections || []).reduce(
      (sectionSum, section) => sectionSum + ((section.lessons || []).length),
      0
    );
  }, 0);

  const completedLessons = progresses.reduce(
    (sum, progress) => sum + ((progress?.completedLessons || []).length),
    0
  );

  const weightedProgressSum = progresses.reduce((sum, progress) => {
    if (!progress) return sum;
    const lessonCount = progress.totalLessons || 0;
    return sum + ((progress.completionPercentage || 0) * lessonCount);
  }, 0);

  const totalProgress = totalLessons > 0 ? Math.round(weightedProgressSum / totalLessons) : 0;
  const completedCourses = progresses.filter((progress) => (progress?.completionPercentage || 0) >= 100).length;
  const inProgressCourses = progresses.filter((progress) => {
    const percent = progress?.completionPercentage || 0;
    return percent > 0 && percent < 100;
  }).length;
  const certificatesCount = await Certificate.countDocuments({ user: userId });

  const totalOrders = await Order.countDocuments({ user: userId });
  const completedOrders = await Order.countDocuments({ user: userId, status: 'paid' });

  const paidOrders = await Order.find({ user: userId, status: 'paid' });
  const orderIds = paidOrders.map((order) => order._id);
  const payments = await Payment.find({ order: { $in: orderIds }, status: 'succeeded' });
  const totalSpent = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const activeDays = new Set(
    progresses
      .map((progress) => progress?.lastAccessed)
      .filter(Boolean)
      .map((date) => new Date(date).toISOString().slice(0, 10))
  );
  const studyStreak = activeDays.size;

  return {
    enrolledCourses: totalCourses,
    totalOrders,
    completedOrders,
    pendingOrders: totalOrders - completedOrders,
    totalSpent,
    stats: {
      totalCourses,
      inProgressCourses,
      completedCourses,
      certificatesCount,
      totalLessons,
      completedLessons,
      totalProgress,
      studyStreak,
    },
  };
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
  updateUserRole,
  getUserStats,
};

