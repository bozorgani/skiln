const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const orderController = require('./order.controller');

const router = express.Router();

router.get('/me', auth(), orderController.listMyOrders);

router
  .route('/')
  .post(
    auth(),
    validate(['course', 'amount']),
    orderController.createOrder
  )
  .get(auth('admin'), orderController.listOrders);

router.patch(
  '/:id/status',
  auth('admin'),
  validate(['status']),
  orderController.updateStatus
);

module.exports = router;

