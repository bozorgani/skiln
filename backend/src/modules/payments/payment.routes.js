const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schemaValidate = require('../../middlewares/schemaValidate');
const { paymentSchemas } = require('../../validations/schemas');
const paymentController = require('./payment.controller');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    validate(['order', 'amount', 'provider']),
    paymentController.createPayment
  )
  .get(auth('admin'), paymentController.listPayments);

router.get('/my-payments', auth(), paymentController.getMyPayments);

router.get('/transactions', auth('admin'), paymentController.getTransactions);

router.post(
  '/transactions/refund',
  auth('admin'),
  validate(['transactionId']),
  paymentController.refundTransaction
);

router.post(
  '/create-intent',
  auth(),
  schemaValidate(paymentSchemas.createIntent),
  validate(['courseId']),
  paymentController.createIntent
);

router.post(
  '/test-payment',
  auth(),
  schemaValidate(paymentSchemas.testPayment),
  paymentController.completeTestPayment
);

router.post(
  '/admin-purchase',
  auth('admin'),
  schemaValidate(paymentSchemas.adminPurchase),
  validate(['courseId']),
  paymentController.adminPurchase
);

router.get('/zarinpal/callback', paymentController.zarinpalCallback);

router.post(
  '/:id/retry',
  auth(),
  paymentController.retryPayment
);

router.get(
  '/:id/receipt',
  auth(),
  paymentController.getReceipt
);

router.get('/:id', auth(), paymentController.getPaymentById);

router.patch(
  '/:id/status',
  auth('admin'),
  validate(['status']),
  paymentController.updateStatus
);

module.exports = router;
