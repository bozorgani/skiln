const ApiError = require('../../core/ApiError');
const Order = require('../orders/order.model');
const Payment = require('./payment.model');
const Course = require('../courses/course.model');
const couponService = require('../coupons/coupon.service');

const createPayment = async ({
  order,
  amount,
  provider,
  transactionId,
  metadata,
  user,
}) => {
  const linkedOrder = await Order.findById(order);
  if (!linkedOrder) {
    throw new ApiError(404, 'Order not found for payment');
  }

  const isOwner = linkedOrder.user.toString() === user._id.toString();
  if (!isOwner && user.role !== 'admin') {
    throw new ApiError(403, 'You cannot pay for this order');
  }

  linkedOrder.status = 'pending';
  await linkedOrder.save();

  return Payment.create({
    order,
    amount,
    provider,
    transactionId,
    metadata,
  });
};

const updatePaymentStatus = async (id, status) => {
  if (!['initiated', 'succeeded', 'failed'].includes(status)) {
    throw new ApiError(400, 'Invalid payment status');
  }

  const payment = await Payment.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).populate('order');

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  const order = await Order.findById(payment.order._id);
  if (status === 'succeeded') {
    // Update order status if status field exists
    if (order.schema.paths.status) {
      order.status = 'paid';
    }
    await order.save();
    
    // Enroll user in course - ensure user is added to students array
    const course = await Course.findById(order.course);
    if (course) {
      const userId = order.user.toString();
      const isAlreadyEnrolled = course.students.some(
        (studentId) => studentId.toString() === userId
      );
      
      if (!isAlreadyEnrolled) {
        course.students.push(order.user);
        await course.save();
        console.log(`[Payment] User ${userId} enrolled in course ${course._id} after successful payment`);
      }
    }
  } else if (status === 'failed') {
    // Update order status if status field exists
    if (order.schema.paths.status) {
      order.status = 'failed';
    }
    await order.save();
  }

  return payment;
};

const listPayments = async () => {
  return Payment.find()
    .populate({
      path: 'order',
      populate: { path: 'user course', select: 'name email title price' },
    })
    .sort({ createdAt: -1 });
};

const getPaymentById = async (id) => {
  const payment = await Payment.findById(id)
    .populate({
      path: 'order',
      populate: { path: 'user course', select: 'name email title price' },
    });
  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }
  return payment;
};

const getTransactions = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.provider) query.provider = filters.provider;
  
  return Payment.find(query)
    .populate({
      path: 'order',
      populate: { path: 'user course', select: 'name email title price' },
    })
    .sort({ createdAt: -1 });
};

const refundTransaction = async (transactionId) => {
  const payment = await Payment.findOne({ transactionId });
  if (!payment) {
    throw new ApiError(404, 'Transaction not found');
  }
  
  if (payment.status !== 'succeeded') {
    throw new ApiError(400, 'Only succeeded transactions can be refunded');
  }
  
  // Update payment status to failed (refunded)
  payment.status = 'failed';
  await payment.save();
  
  // Update order status
  const order = await Order.findById(payment.order);
  if (order) {
    order.status = 'refunded';
    await order.save();
    
    // Remove user from course
    await Course.findByIdAndUpdate(order.course, {
      $pull: { students: order.user },
    });
  }
  
  return payment;
};

/**
 * Create payment intent for a course purchase
 * @param {string} courseId - Course ID
 * @param {string} userId - User ID
 * @param {string} couponCode - Optional coupon code
 * @returns {Object} Payment intent data
 */
const createPaymentIntent = async (courseId, userId, couponCode = null) => {
  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'دوره یافت نشد');
  }

  // Check if user is already enrolled
  const alreadyEnrolled = course.students.some(
    (studentId) => studentId.toString() === userId.toString()
  );

  if (alreadyEnrolled) {
    throw new ApiError(400, 'شما قبلاً در این دوره ثبت‌نام کرده‌اید');
  }

  // Calculate final price (apply coupon if provided)
  let finalPrice = course.price || 0;
  let couponApplied = null;

  if (couponCode) {
    try {
      // Validate and apply coupon
      const couponResult = await couponService.validateCoupon({
        code: couponCode,
        userId: userId,
        courseId: courseId,
        amount: course.price || 0,
      });

      finalPrice = couponResult.finalAmount;
      couponApplied = {
        code: couponResult.coupon.code,
        discountAmount: couponResult.discountAmount,
        finalAmount: couponResult.finalAmount,
      };
    } catch (error) {
      // If coupon validation fails, throw error (don't proceed with invalid coupon)
      throw new ApiError(error.statusCode || 400, error.message || 'کد تخفیف نامعتبر است');
    }
  }

  // If course is free, enroll user directly
  if (finalPrice === 0) {
    // Enroll user in course - check if already enrolled
    const userIdStr = userId.toString();
    const isAlreadyEnrolled = course.students.some(
      (studentId) => studentId.toString() === userIdStr
    );
    
    if (!isAlreadyEnrolled) {
      course.students.push(userId);
      await course.save();
      console.log(`[Free Course] User ${userIdStr} enrolled in course ${course._id}`);
    }

    // Create order with status 'paid' for free courses
    const order = await Order.create({
      user: userId,
      course: courseId,
      amount: 0,
      status: 'paid',
    });

    return {
      paymentRequired: false,
      paymentId: null,
      orderId: order._id,
      amount: 0,
      message: 'ثبت‌نام با موفقیت انجام شد',
    };
  }

  // For paid courses, create an order and return payment intent data
  const order = await Order.create({
    user: userId,
    course: courseId,
    amount: finalPrice,
    status: 'pending',
  });

  // Check if payment providers are configured
  const hasStripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY;
  const hasZarinpal = process.env.ZARINPAL_MERCHANT_ID;
  const hasPayir = process.env.PAYIR_API_KEY;
  const hasIdpay = process.env.IDPAY_API_KEY;

  // Generate payment URLs or client secrets if providers are configured
  let clientSecret = null;
  let zarinpalUrl = null;
  let payirUrl = null;
  let idpayUrl = null;

  // TODO: Integrate with payment providers (Stripe, Zarinpal, etc.)
  // For now, if no providers are configured, enable mock/test payment mode
  // In production, you would:
  // 1. Create a Stripe PaymentIntent and get clientSecret
  // 2. Or create a Zarinpal payment request and get payment URL
  // 3. Store the provider and transaction ID

  // If no real payment providers are configured, enable test/mock payment
  const enableTestPayment = !hasStripe && !hasZarinpal && !hasPayir && !hasIdpay;

  return {
    paymentRequired: true,
    paymentId: order._id.toString(), // Use order ID as payment ID for mock/test payments
    orderId: order._id,
    amount: finalPrice,
    clientSecret: hasStripe ? clientSecret : null, // For Stripe - set when Stripe is integrated
    zarinpalUrl: hasZarinpal ? zarinpalUrl : null, // For Zarinpal - set when Zarinpal is integrated
    payirUrl: hasPayir ? payirUrl : null, // For Pay.ir - set when Pay.ir is integrated
    idpayUrl: hasIdpay ? idpayUrl : null, // For IDPay - set when IDPay is integrated
    testPaymentUrl: enableTestPayment ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/test?orderId=${order._id}&amount=${finalPrice}` : null, // Test payment URL
    mockMode: enableTestPayment, // Indicates this is a mock/test implementation
    couponApplied,
  };
};

/**
 * Complete test payment - mark order as paid and enroll user (for test/mock payments)
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Object} Payment result
 */
const completeTestPayment = async (orderId, userId) => {
  const order = await Order.findById(orderId).populate('course');
  if (!order) {
    throw new ApiError(404, 'سفارش یافت نشد');
  }

  if (order.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'شما مجاز به پرداخت این سفارش نیستید');
  }

  if (order.status === 'paid') {
    return {
      success: true,
      message: 'این سفارش قبلاً پرداخت شده است',
      order,
    };
  }

  // Update order status
  order.status = 'paid';
  await order.save();

  // Enroll user in course - ensure user is added to students array
  const course = await Course.findById(order.course);
  if (course) {
    const userIdStr = userId.toString();
    const isAlreadyEnrolled = course.students.some(
      (studentId) => studentId.toString() === userIdStr
    );
    
    if (!isAlreadyEnrolled) {
      course.students.push(userId);
      await course.save();
      console.log(`[Test Payment] User ${userIdStr} enrolled in course ${course._id}`);
    } else {
      console.log(`[Test Payment] User ${userIdStr} already enrolled in course ${course._id}`);
    }
  }

  // Create payment record
  const payment = await Payment.create({
    order: order._id,
    amount: order.amount,
    provider: 'free',
    status: 'succeeded',
    transactionId: `TEST-${orderId}-${Date.now()}`,
    metadata: {
      testPayment: true,
      completedAt: new Date(),
    },
  });

  return {
    success: true,
    message: 'پرداخت تست با موفقیت تکمیل شد',
    payment,
    order,
  };
};

/**
 * Admin purchase - enroll user in course for free (admin only)
 * @param {string} courseId - Course ID
 * @param {string} userId - User ID (the user to enroll)
 * @param {string} adminId - Admin ID (the admin making the purchase)
 * @returns {Object} Purchase result
 */
const adminPurchase = async (courseId, userId, adminId) => {
  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'دوره یافت نشد');
  }

  // Check if user is already enrolled
  const alreadyEnrolled = course.students.some(
    (studentId) => studentId.toString() === userId.toString()
  );

  if (alreadyEnrolled) {
    throw new ApiError(400, 'کاربر قبلاً در این دوره ثبت‌نام کرده‌است');
  }

  // Enroll user in course
  course.students.push(userId);
  await course.save();

  // Create order with status 'paid' and amount 0
  const order = await Order.create({
    user: userId,
    course: courseId,
    amount: 0,
    status: 'paid',
  });

  // Create payment record for admin purchase
  const payment = await Payment.create({
    order: order._id,
    amount: 0,
    provider: 'admin',
    status: 'succeeded',
    transactionId: `ADMIN-${adminId}-${Date.now()}`,
    isAdminPurchase: true,
    metadata: {
      adminId: adminId.toString(),
      purchasedAt: new Date(),
      coursePrice: course.price,
      reason: 'Admin purchase - free enrollment',
    },
  });

  return {
    success: true,
    orderId: order._id,
    paymentId: payment._id,
    message: 'کاربر با موفقیت در دوره ثبت‌نام شد (پرداخت مدیر)',
  };
};

module.exports = {
  createPayment,
  updatePaymentStatus,
  listPayments,
  getPaymentById,
  getTransactions,
  refundTransaction,
  createPaymentIntent,
  completeTestPayment,
  adminPurchase,
};

