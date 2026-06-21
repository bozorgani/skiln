const mongoose = require('mongoose');
const ApiError = require('../../core/ApiError');
const Order = require('../orders/order.model');
const Payment = require('./payment.model');
const Course = require('../courses/course.model');
const couponService = require('../coupons/coupon.service');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const populatePaymentQuery = (query) =>
  query.populate({
    path: 'order',
    populate: [
      { path: 'user', select: 'name email phone role' },
      { path: 'course', select: 'title description shortDescription thumbnail price category level duration' },
    ],
  });

const formatPayment = (payment) => {
  if (!payment) return null;
  const obj = typeof payment.toObject === 'function' ? payment.toObject() : payment;
  const order = obj.order || null;
  const course = order?.course || null;
  const user = order?.user || null;

  return {
    _id: obj._id,
    paymentId: obj._id,
    orderId: order?._id || obj.order,
    order,
    course,
    user,
    amount: obj.amount,
    currency: 'IRR',
    provider: obj.provider,
    paymentMethod: obj.paymentMethod || obj.provider,
    status: obj.status,
    transactionId: obj.transactionId,
    isAdminPurchase: obj.isAdminPurchase,
    metadata: obj.metadata,
    paidAt: obj.status === 'succeeded'
      ? obj.metadata?.completedAt || obj.metadata?.purchasedAt || obj.updatedAt
      : null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const assertCanAccessPayment = (payment, user) => {
  if (!payment || !user) return;
  if (user.role === 'admin') return;
  const orderUserId = payment.order?.user?._id || payment.order?.user;
  if (!orderUserId || orderUserId.toString() !== user._id.toString()) {
    throw new ApiError(403, 'You cannot access this payment');
  }
};

const enrollUserInCourse = async (order) => {
  if (!order?.course || !order?.user) return;

  const courseId = order.course._id || order.course;
  const userId = order.user._id || order.user;
  const course = await Course.findById(courseId);
  if (!course) return;

  const userIdStr = userId.toString();
  const isAlreadyEnrolled = course.students.some(
    (studentId) => studentId.toString() === userIdStr
  );

  if (!isAlreadyEnrolled) {
    course.students.push(userId);
    await course.save();
  }
};


const getBackendPublicUrl = () =>
  (process.env.PAYMENT_CALLBACK_BASE_URL || process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000').replace(/\/$/, '');

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const getZarinpalConfig = () => {
  const sandbox = process.env.ZARINPAL_SANDBOX === 'true';
  return {
    merchantId: process.env.ZARINPAL_MERCHANT_ID,
    requestUrl: sandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
      : 'https://payment.zarinpal.com/pg/v4/payment/request.json',
    verifyUrl: sandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
      : 'https://payment.zarinpal.com/pg/v4/payment/verify.json',
    startPayUrl: sandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay',
    amountMultiplier: Number(process.env.ZARINPAL_AMOUNT_MULTIPLIER) || 10,
  };
};

const toZarinpalAmount = (amount) => Math.round(Number(amount || 0) * getZarinpalConfig().amountMultiplier);

const callZarinpal = async (url, payload) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(502, data?.errors?.message || 'خطا در ارتباط با زرین‌پال', data?.errors, 'ZARINPAL_HTTP_ERROR');
  }
  return data;
};

const markOrderStatus = async (orderId, status) => {
  if (!orderId) return null;
  const order = await Order.findById(orderId);
  if (!order) return null;
  order.status = status;
  await order.save();
  return order;
};

const requestZarinpalPayment = async (paymentId) => {
  const payment = await populatePaymentQuery(Payment.findById(paymentId));
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.provider !== 'zarinpal') throw new ApiError(400, 'Payment provider is not Zarinpal');

  const config = getZarinpalConfig();
  if (!config.merchantId) throw new ApiError(500, 'ZARINPAL_MERCHANT_ID is not configured');

  const order = payment.order;
  const course = order?.course;
  const user = order?.user;
  const callbackUrl = `${getBackendPublicUrl()}/api/payments/zarinpal/callback?paymentId=${payment._id}`;

  const payload = {
    merchant_id: config.merchantId,
    amount: toZarinpalAmount(payment.amount),
    callback_url: callbackUrl,
    description: `خرید دوره ${course?.title || ''}`.trim() || 'خرید دوره Skiln',
    metadata: {
      mobile: user?.phone || undefined,
      email: user?.email || undefined,
      order_id: String(order?._id || ''),
      payment_id: String(payment._id),
    },
  };

  const result = await callZarinpal(config.requestUrl, payload);
  const code = result?.data?.code;
  const authority = result?.data?.authority;

  if (code !== 100 || !authority) {
    payment.status = 'failed';
    payment.metadata = {
      ...(payment.metadata || {}),
      zarinpal: { ...(payment.metadata?.zarinpal || {}), requestPayload: payload, requestResult: result },
      failedAt: new Date(),
    };
    await payment.save();
    await markOrderStatus(order?._id, 'failed');
    throw new ApiError(502, result?.errors?.message || 'ایجاد درخواست پرداخت زرین‌پال ناموفق بود', result?.errors, 'ZARINPAL_REQUEST_FAILED');
  }

  payment.status = 'pending';
  payment.transactionId = `ZARINPAL-${authority}`;
  payment.metadata = {
    ...(payment.metadata || {}),
    zarinpal: {
      ...(payment.metadata?.zarinpal || {}),
      authority,
      amount: payload.amount,
      callbackUrl,
      requestedAt: new Date(),
      requestResult: result.data,
    },
  };
  await payment.save();
  await markOrderStatus(order?._id, 'pending');

  return {
    authority,
    paymentUrl: `${config.startPayUrl}/${authority}`,
  };
};

const verifyZarinpalPayment = async ({ paymentId, authority, status }) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.provider !== 'zarinpal') throw new ApiError(400, 'Payment provider is not Zarinpal');

  const order = await Order.findById(payment.order);
  if (!order) throw new ApiError(404, 'Order not found');

  const expectedAuthority = payment.metadata?.zarinpal?.authority;
  if (expectedAuthority && authority && expectedAuthority !== authority) {
    throw new ApiError(400, 'Authority mismatch', [], 'ZARINPAL_AUTHORITY_MISMATCH');
  }

  if (payment.status === 'succeeded') {
    return formatPayment(await getPaymentById(payment._id));
  }

  if (status !== 'OK') {
    payment.status = status === 'NOK' ? 'cancelled' : 'failed';
    payment.metadata = {
      ...(payment.metadata || {}),
      zarinpal: { ...(payment.metadata?.zarinpal || {}), callbackStatus: status, callbackAt: new Date() },
    };
    await payment.save();
    order.status = payment.status === 'cancelled' ? 'cancelled' : 'failed';
    await order.save();
    return formatPayment(await getPaymentById(payment._id));
  }

  const config = getZarinpalConfig();
  const payload = {
    merchant_id: config.merchantId,
    amount: toZarinpalAmount(payment.amount),
    authority: authority || expectedAuthority,
  };
  const result = await callZarinpal(config.verifyUrl, payload);
  const code = result?.data?.code;

  if (code === 100 || code === 101) {
    order.status = 'paid';
    await order.save();
    await enrollUserInCourse(order);

    payment.status = 'succeeded';
    payment.transactionId = result?.data?.ref_id ? `ZARINPAL-${result.data.ref_id}` : payment.transactionId;
    payment.metadata = {
      ...(payment.metadata || {}),
      zarinpal: {
        ...(payment.metadata?.zarinpal || {}),
        verifiedAt: new Date(),
        verifyResult: result.data,
        refId: result?.data?.ref_id,
        cardPan: result?.data?.card_pan,
        fee: result?.data?.fee,
      },
      completedAt: new Date(),
    };
    await payment.save();
    return formatPayment(await getPaymentById(payment._id));
  }

  payment.status = 'failed';
  payment.metadata = {
    ...(payment.metadata || {}),
    zarinpal: { ...(payment.metadata?.zarinpal || {}), verifyPayload: payload, verifyResult: result },
    failedAt: new Date(),
  };
  await payment.save();
  order.status = 'failed';
  await order.save();
  throw new ApiError(400, result?.errors?.message || 'تایید پرداخت زرین‌پال ناموفق بود', result?.errors, 'ZARINPAL_VERIFY_FAILED');
};

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
  if (!['initiated', 'pending', 'succeeded', 'failed', 'cancelled'].includes(status)) {
    throw new ApiError(400, 'Invalid payment status');
  }

  const payment = await populatePaymentQuery(
    Payment.findByIdAndUpdate(id, { status }, { new: true })
  );

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  const order = await Order.findById(payment.order._id);
  if (order) {
    if (status === 'succeeded') {
      order.status = 'paid';
      await order.save();
      await enrollUserInCourse(order);
    } else if (status === 'failed' || status === 'cancelled') {
      order.status = status === 'cancelled' ? 'cancelled' : 'failed';
      await order.save();
    }
  }

  return payment;
};

const listPayments = async () => {
  return populatePaymentQuery(Payment.find()).sort({ createdAt: -1 });
};

const getPaymentById = async (id, user = null) => {
  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid payment ID');
  }

  let payment = await populatePaymentQuery(Payment.findById(id));

  // Backward compatibility: some older frontend code used orderId as paymentId.
  if (!payment) {
    payment = await populatePaymentQuery(Payment.findOne({ order: id }).sort({ createdAt: -1 }));
  }

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  assertCanAccessPayment(payment, user);
  return payment;
};

const getPaymentDetails = async (id, user = null) => {
  const payment = await getPaymentById(id, user);
  return formatPayment(payment);
};

const getMyPayments = async (userId) => {
  const payments = await populatePaymentQuery(
    Payment.find().sort({ createdAt: -1 })
  );

  return payments
    .filter((payment) => {
      const orderUserId = payment.order?.user?._id || payment.order?.user;
      return orderUserId?.toString() === userId.toString();
    })
    .map(formatPayment);
};

const getTransactions = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.provider) query.provider = filters.provider;

  return populatePaymentQuery(Payment.find(query)).sort({ createdAt: -1 });
};

const refundTransaction = async (transactionId) => {
  const payment = await Payment.findOne({ transactionId });
  if (!payment) {
    throw new ApiError(404, 'Transaction not found');
  }

  if (payment.status !== 'succeeded') {
    throw new ApiError(400, 'Only succeeded transactions can be refunded');
  }

  payment.status = 'failed';
  payment.metadata = {
    ...(payment.metadata || {}),
    refundedAt: new Date(),
  };
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order) {
    order.status = 'refunded';
    await order.save();

    await Course.findByIdAndUpdate(order.course, {
      $pull: { students: order.user },
    });
  }

  return payment;
};

const createPaymentIntent = async (courseId, userId, couponCode = null) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'دوره یافت نشد');
  }

  const alreadyEnrolled = course.students.some(
    (studentId) => studentId.toString() === userId.toString()
  );

  if (alreadyEnrolled) {
    throw new ApiError(400, 'شما قبلاً در این دوره ثبت‌نام کرده‌اید');
  }

  let finalPrice = Math.max(0, Math.round((course.price || 0) * (1 - ((course.discountPercent || 0) / 100))));
  let couponApplied = null;

  if (couponCode) {
    try {
      const couponResult = await couponService.validateCoupon({
        code: couponCode,
        userId,
        courseId,
        amount: finalPrice || 0,
      });

      finalPrice = couponResult.finalAmount;
      couponApplied = {
        code: couponResult.coupon.code,
        discountAmount: couponResult.discountAmount,
        finalAmount: couponResult.finalAmount,
      };
    } catch (error) {
      throw new ApiError(error.statusCode || 400, error.message || 'کد تخفیف نامعتبر است');
    }
  }

  const order = await Order.create({
    user: userId,
    course: courseId,
    amount: finalPrice,
    status: finalPrice === 0 ? 'paid' : 'pending',
  });

  if (finalPrice === 0) {
    await enrollUserInCourse(order);

    const payment = await Payment.create({
      order: order._id,
      amount: 0,
      provider: 'free',
      status: 'succeeded',
      transactionId: `FREE-${order._id}-${Date.now()}`,
      metadata: {
        completedAt: new Date(),
        couponApplied,
      },
    });

    return {
      paymentRequired: false,
      paymentId: payment._id,
      orderId: order._id,
      amount: 0,
      payment: formatPayment(await getPaymentById(payment._id)),
      message: 'ثبت‌نام با موفقیت انجام شد',
    };
  }

  const hasZarinpal = process.env.ZARINPAL_MERCHANT_ID;
  const hasPayir = process.env.PAYIR_API_KEY;
  const hasIdpay = process.env.IDPAY_API_KEY;
  const enableTestPayment = !hasZarinpal && !hasPayir && !hasIdpay;

  const provider = enableTestPayment
    ? 'test'
    : hasZarinpal
      ? 'zarinpal'
      : hasPayir
        ? 'payir'
        : 'idpay';

  const payment = await Payment.create({
    order: order._id,
    amount: finalPrice,
    provider,
    status: 'pending',
    transactionId: `${provider.toUpperCase()}-PENDING-${order._id}-${Date.now()}`,
    metadata: {
      couponApplied,
      createdFrom: 'createPaymentIntent',
    },
  });

  let zarinpalUrl = null;
  const payirUrl = null;
  const idpayUrl = null;

  if (provider === 'zarinpal') {
    const zarinpalRequest = await requestZarinpalPayment(payment._id);
    zarinpalUrl = zarinpalRequest.paymentUrl;
  }

  return {
    paymentRequired: true,
    paymentId: payment._id,
    orderId: order._id,
    amount: finalPrice,
    zarinpalUrl: hasZarinpal ? zarinpalUrl : null,
    payirUrl: hasPayir ? payirUrl : null,
    idpayUrl: hasIdpay ? idpayUrl : null,
    testPaymentUrl: enableTestPayment
      ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/test?paymentId=${payment._id}&orderId=${order._id}&amount=${finalPrice}`
      : null,
    mockMode: enableTestPayment,
    couponApplied,
  };
};

const completeTestPayment = async ({ orderId, paymentId }, userId) => {
  let payment = null;

  if (paymentId && isValidObjectId(paymentId)) {
    payment = await Payment.findById(paymentId);
  }

  if (!payment && orderId && isValidObjectId(orderId)) {
    payment = await Payment.findOne({ order: orderId }).sort({ createdAt: -1 });
  }

  if (!payment) {
    throw new ApiError(404, 'پرداخت تست یافت نشد');
  }

  const order = await Order.findById(payment.order);
  if (!order) {
    throw new ApiError(404, 'سفارش یافت نشد');
  }

  if (order.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'شما مجاز به پرداخت این سفارش نیستید');
  }

  if (!['test', 'free'].includes(payment.provider)) {
    throw new ApiError(400, 'این پرداخت از نوع تست نیست');
  }

  order.status = 'paid';
  await order.save();
  await enrollUserInCourse(order);

  payment.status = 'succeeded';
  payment.transactionId = payment.transactionId && !payment.transactionId.includes('PENDING')
    ? payment.transactionId
    : `TEST-${order._id}-${Date.now()}`;
  payment.metadata = {
    ...(payment.metadata || {}),
    testPayment: true,
    completedAt: new Date(),
  };
  await payment.save();

  const populatedPayment = await getPaymentById(payment._id);

  return {
    success: true,
    message: 'پرداخت تست با موفقیت تکمیل شد',
    payment: formatPayment(populatedPayment),
    order,
  };
};


const retryPayment = async (paymentId, user) => {
  const payment = await getPaymentById(paymentId, user);
  if (payment.status === 'succeeded') {
    throw new ApiError(400, 'این پرداخت قبلاً با موفقیت انجام شده است');
  }

  const order = await Order.findById(payment.order._id || payment.order);
  if (!order) throw new ApiError(404, 'Order not found');

  if (payment.provider === 'zarinpal') {
    const retry = await requestZarinpalPayment(payment._id);
    return {
      payment: formatPayment(await getPaymentById(payment._id, user)),
      paymentUrl: retry.paymentUrl,
      zarinpalUrl: retry.paymentUrl,
    };
  }

  if (payment.provider === 'test') {
    order.status = 'pending';
    await order.save();
    const testPaymentUrl = `${getFrontendUrl()}/payment/test?paymentId=${payment._id}&orderId=${order._id}&amount=${payment.amount}`;
    return {
      payment: formatPayment(payment),
      testPaymentUrl,
    };
  }

  throw new ApiError(400, 'امکان تلاش مجدد برای این روش پرداخت فعال نیست');
};

const getReceipt = async (paymentId, user) => {
  const payment = await getPaymentDetails(paymentId, user);
  if (payment.status !== 'succeeded') {
    throw new ApiError(400, 'رسید فقط برای پرداخت موفق قابل دریافت است');
  }
  return {
    ...payment,
    receiptNumber: payment.metadata?.zarinpal?.refId || payment.transactionId || payment.paymentId,
    issuedAt: payment.paidAt || payment.updatedAt,
  };
};

const adminPurchase = async (courseId, userId, adminId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'دوره یافت نشد');
  }

  const alreadyEnrolled = course.students.some(
    (studentId) => studentId.toString() === userId.toString()
  );

  if (alreadyEnrolled) {
    throw new ApiError(400, 'کاربر قبلاً در این دوره ثبت‌نام کرده‌است');
  }

  course.students.push(userId);
  await course.save();

  const order = await Order.create({
    user: userId,
    course: courseId,
    amount: 0,
    status: 'paid',
  });

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
    payment: formatPayment(await getPaymentById(payment._id)),
    message: 'کاربر با موفقیت در دوره ثبت‌نام شد (پرداخت مدیر)',
  };
};

module.exports = {
  createPayment,
  updatePaymentStatus,
  listPayments,
  getPaymentById,
  getPaymentDetails,
  getMyPayments,
  getTransactions,
  refundTransaction,
  createPaymentIntent,
  completeTestPayment,
  verifyZarinpalPayment,
  retryPayment,
  getReceipt,
  adminPurchase,
  formatPayment,
};
