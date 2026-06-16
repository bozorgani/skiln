const ApiError = require('../../core/ApiError');
const Coupon = require('./coupon.model');
const Course = require('../courses/course.model');

const normalizeCode = (code = '') =>
  typeof code === 'string' ? code.trim().toUpperCase() : '';

const createCoupon = async (payload) => {
  const data = { ...payload };
  data.code = normalizeCode(data.code);

  if (!data.code) {
    throw new ApiError(400, 'Coupon code is required');
  }

  if (data.startsAt && data.expiresAt && data.startsAt >= data.expiresAt) {
    throw new ApiError(400, 'Coupon start date must be before expiry date');
  }

  return Coupon.create(data);
};

const listCoupons = async (filters = {}) => {
  const query = {};

  if (typeof filters.isActive !== 'undefined') {
    query.isActive = filters.isActive === 'true' || filters.isActive === true;
  }

  if (filters.search) {
    query.code = { $regex: filters.search, $options: 'i' };
  }

  return Coupon.find(query).sort({ createdAt: -1 });
};

const getCouponById = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }
  return coupon;
};

const updateCoupon = async (id, payload) => {
  const data = { ...payload };
  if (data.code) {
    data.code = normalizeCode(data.code);
  }

  if (data.startsAt && data.expiresAt && data.startsAt >= data.expiresAt) {
    throw new ApiError(400, 'Coupon start date must be before expiry date');
  }

  const coupon = await Coupon.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }
  return coupon;
};

const deleteCoupon = async (id) => {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }
  return coupon;
};

/**
 * Validate coupon and calculate discount
 * This does NOT increase usage counters – that should happen after successful payment.
 */
const validateCoupon = async ({ code, userId, courseId, amount }) => {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    throw new ApiError(400, 'کد تخفیف را وارد کنید');
  }

  if (!courseId) {
    throw new ApiError(400, 'شناسه دوره برای کوپن الزامی است');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'دوره مورد نظر یافت نشد');
  }

  const coupon = await Coupon.findOne({ code: normalizedCode });
  if (!coupon) {
    throw new ApiError(404, 'کد تخفیف نامعتبر است');
  }

  if (!coupon.isActive) {
    throw new ApiError(400, 'این کد تخفیف غیرفعال است');
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new ApiError(400, 'این کد تخفیف هنوز فعال نشده است');
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw new ApiError(400, 'مدت اعتبار این کد تخفیف به پایان رسیده است');
  }

  if (coupon.maxUses && coupon.totalUses >= coupon.maxUses) {
    throw new ApiError(400, 'سقف استفاده از این کد تخفیف به پایان رسیده است');
  }

  const orderAmount = typeof amount === 'number' ? amount : course.price;
  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
    throw new ApiError(
      400,
      `حداقل مبلغ برای استفاده از این کد تخفیف ${coupon.minOrderAmount.toLocaleString(
        'fa-IR'
      )} تومان است`
    );
  }

  if (
    coupon.applicableCourses &&
    coupon.applicableCourses.length > 0 &&
    !coupon.applicableCourses.some(
      (cId) => cId.toString() === courseId.toString()
    )
  ) {
    throw new ApiError(
      400,
      'این کد تخفیف برای این دوره قابل استفاده نیست'
    );
  }

  let discountAmount = 0;
  if (coupon.type === 'percent') {
    discountAmount = Math.floor((orderAmount * coupon.value) / 100);
  } else {
    discountAmount = coupon.value;
  }

  if (coupon.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
  }

  discountAmount = Math.min(discountAmount, orderAmount);

  const finalAmount = orderAmount - discountAmount;

  return {
    coupon,
    originalAmount: orderAmount,
    discountAmount,
    finalAmount,
  };
};

module.exports = {
  createCoupon,
  listCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};


