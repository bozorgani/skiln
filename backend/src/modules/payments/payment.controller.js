const ApiError = require('../../core/ApiError');
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
    data: { payment: paymentService.formatPayment(payment) || payment },
  });
});

exports.updateStatus = catchAsync(async (req, res) => {
  const payment = await paymentService.updatePaymentStatus(
    req.params.id,
    req.body.status
  );
  sendResponse(res, {
    message: 'Payment status updated',
    data: { payment: paymentService.formatPayment(payment) },
  });
});

exports.listPayments = catchAsync(async (_req, res) => {
  const payments = await paymentService.listPayments();
  sendResponse(res, {
    data: { payments: payments.map(paymentService.formatPayment), transactions: payments.map(paymentService.formatPayment) },
    message: 'Payments retrieved',
  });
});

exports.getPaymentById = catchAsync(async (req, res) => {
  const payment = await paymentService.getPaymentDetails(req.params.id, req.user);
  sendResponse(res, { data: { payment }, message: 'Payment retrieved' });
});

exports.getMyPayments = catchAsync(async (req, res) => {
  const payments = await paymentService.getMyPayments(req.user._id);
  sendResponse(res, { data: { payments }, message: 'User payments retrieved' });
});

exports.getTransactions = catchAsync(async (req, res) => {
  const transactions = await paymentService.getTransactions(req.query);
  const formatted = transactions.map(paymentService.formatPayment);
  sendResponse(res, { data: { transactions: formatted, payments: formatted }, message: 'Transactions retrieved' });
});

exports.refundTransaction = catchAsync(async (req, res) => {
  const payment = await paymentService.refundTransaction(req.body.transactionId);
  sendResponse(res, { data: { payment }, message: 'Transaction refunded successfully' });
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

exports.completeTestPayment = catchAsync(async (req, res) => {
  const { orderId, paymentId } = req.body;
  const userId = req.user._id;

  if (!orderId && !paymentId) {
    throw new ApiError(400, 'orderId or paymentId is required');
  }

  const result = await paymentService.completeTestPayment({ orderId, paymentId }, userId);

  sendResponse(res, {
    statusCode: 200,
    message: 'Test payment completed successfully',
    data: result,
  });
});


exports.zarinpalCallback = catchAsync(async (req, res) => {
  const { paymentId, Authority, authority, Status, status } = req.query;
  const resolvedPaymentId = paymentId;
  const resolvedAuthority = Authority || authority;
  const resolvedStatus = Status || status;

  if (!resolvedPaymentId) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?reason=not_found`);
  }

  try {
    const payment = await paymentService.verifyZarinpalPayment({
      paymentId: resolvedPaymentId,
      authority: resolvedAuthority,
      status: resolvedStatus,
    });

    if (payment.status === 'succeeded') {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?paymentId=${payment.paymentId}`);
    }

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?paymentId=${resolvedPaymentId}&reason=cancelled`);
  } catch (error) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?paymentId=${resolvedPaymentId}&reason=verification_failed`);
  }
});

exports.retryPayment = catchAsync(async (req, res) => {
  const result = await paymentService.retryPayment(req.params.id, req.user);
  sendResponse(res, { data: result, message: 'Payment retry created' });
});

exports.getReceipt = catchAsync(async (req, res) => {
  const receipt = await paymentService.getReceipt(req.params.id, req.user);
  sendResponse(res, { data: { receipt }, message: 'Payment receipt retrieved' });
});

exports.adminPurchase = catchAsync(async (req, res) => {
  const { courseId, userId } = req.body;
  const adminId = req.user._id;

  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can perform admin purchases');
  }

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
