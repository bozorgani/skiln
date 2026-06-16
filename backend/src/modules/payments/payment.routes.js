const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const paymentController = require('./payment.controller');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    validate(['order', 'amount', 'provider', 'transactionId']),
    paymentController.createPayment
  )
  .get(auth('admin'), paymentController.listPayments);

router.get('/:id', auth('admin'), paymentController.getPaymentById);

router.patch(
  '/:id/status',
  auth('admin'),
  validate(['status']),
  paymentController.updateStatus
);

router.get('/transactions', auth('admin'), paymentController.getTransactions);

router.post(
  '/transactions/refund',
  auth('admin'),
  validate(['transactionId']),
  paymentController.refundTransaction
);

// Create payment intent for course purchase
router.post(
  '/create-intent',
  auth(),
  validate(['courseId']),
  paymentController.createIntent
);

// Complete test payment - mark order as paid and enroll user (for test/mock payments)
router.post(
  '/test-payment',
  auth(),
  validate(['orderId']),
  paymentController.completeTestPayment
);

// Admin purchase - enroll user in course for free (admin only)
router.post(
  '/admin-purchase',
  auth('admin'),
  validate(['courseId']),
  paymentController.adminPurchase
);

module.exports = router;

