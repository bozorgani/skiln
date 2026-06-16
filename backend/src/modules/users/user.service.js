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

  // Get enrolled courses
  const enrolledCoursesList = await Course.find({ students: userId }).select('_id sections');

  // Get enrolled courses count (total)
  const totalCourses = enrolledCoursesList.length;

  // Calculate in-progress courses (courses with progress > 0% and < 100%)
  // For now, we'll consider all enrolled courses as in-progress if they have sections
  // You can enhance this by tracking actual progress per course
  const inProgressCourses = enrolledCoursesList.filter(
    (course) => course.sections && course.sections.length > 0
  ).length;

  // Calculate completed courses (courses with 100% progress)
  // For now, we'll set it to 0 - you can enhance this by tracking actual completion
  const completedCourses = 0;

  // Calculate certificates count (same as completed courses for now)
  const certificatesCount = completedCourses;

  // Get total lessons count across all enrolled courses
  const totalLessons = enrolledCoursesList.reduce((sum, course) => {
    if (course.sections && Array.isArray(course.sections)) {
      return (
        sum +
        course.sections.reduce(
          (sectionSum, section) =>
            sectionSum + (section.lessons && Array.isArray(section.lessons) ? section.lessons.length : 0),
          0
        )
      );
    }
    return sum;
  }, 0);

  // Get completed lessons count (for now, set to 0 - you can track this separately)
  const completedLessons = 0;

  // Calculate total progress percentage
  const totalProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Get orders count
  const totalOrders = await Order.countDocuments({ user: userId });
  const completedOrders = await Order.countDocuments({ user: userId, status: 'paid' });

  // Get total spent
  const paidOrders = await Order.find({ user: userId, status: 'paid' });
  const orderIds = paidOrders.map((order) => order._id);
  const payments = await Payment.find({ order: { $in: orderIds } });
  const totalSpent = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  // Study streak (for now, set to 0 - you can track this separately)
  const studyStreak = 0;

  return {
    enrolledCourses: totalCourses, // Backward compatibility
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

