const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const paymentService = require('./payment.service');

exports.createPayment = catchAsync(async (req, res) => {
  const payment = await paymentService.createPayment({
    ...req.body,
    user: req.user,
  });
  sendResponse(res, {
    statusCode: 201,
    message: 'Payment initiated',
    data: payment,
  });
});

exports.updateStatus = catchAsync(async (req, res) => {
  const payment = await paymentService.updatePaymentStatus(
    req.params.id,
    req.body.status
  );
  sendResponse(res, { message: 'Payment status updated', data: payment });
});

exports.listPayments = catchAsync(async (_req, res) => {
  const payments = await paymentService.listPayments();
  sendResponse(res, { data: payments, message: 'Payments retrieved' });
});

exports.getPaymentById = catchAsync(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id);
  sendResponse(res, { data: payment, message: 'Payment retrieved' });
});

exports.getTransactions = catchAsync(async (req, res) => {
  const transactions = await paymentService.getTransactions(req.query);
  sendResponse(res, { data: transactions, message: 'Transactions retrieved' });
});

exports.refundTransaction = catchAsync(async (req, res) => {
  const payment = await paymentService.refundTransaction(req.body.transactionId);
  sendResponse(res, { data: payment, message: 'Transaction refunded successfully' });
});

exports.createIntent = catchAsync(async (req, res) => {
  const { courseId, couponCode } = req.body;
  const userId = req.user._id;

  const paymentIntent = await paymentService.createPaymentIntent(
    courseId,
    userId,
    couponCode
  );

  sendResponse(res, {
    statusCode: 201,
    message: 'Payment intent created successfully',
    data: paymentIntent,
  });
});

/**
 * Complete test payment - mark order as paid and enroll user (for test/mock payments)
 */
exports.completeTestPayment = catchAsync(async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user._id;

  const result = await paymentService.completeTestPayment(orderId, userId);

  sendResponse(res, {
    statusCode: 200,
    message: 'Test payment completed successfully',
    data: result,
  });
});

/**
 * Admin purchase - enroll a user in a course for free (admin only)
 */
exports.adminPurchase = catchAsync(async (req, res) => {
  const { courseId, userId } = req.body;
  const adminId = req.user._id;

  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw new Error('Only admins can perform admin purchases');
  }

  // Use provided userId or default to admin's own id
  const targetUserId = userId || adminId;

  const result = await paymentService.adminPurchase(
    courseId,
    targetUserId,
    adminId
  );

  sendResponse(res, {
    statusCode: 201,
    message: 'Admin purchase completed successfully',
    data: result,
  });
});

