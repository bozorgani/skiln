const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const couponController = require('./coupon.controller');

const router = express.Router();

// Admin CRUD
router
  .route('/')
  .get(auth('admin'), couponController.listCoupons)
  .post(
    auth('admin'),
    validate(['code', 'type', 'value'], { allowPartial: false }),
    couponController.createCoupon
  );

router
  .route('/:id')
  .get(auth('admin'), couponController.getCoupon)
  .patch(auth('admin'), couponController.updateCoupon)
  .delete(auth('admin'), couponController.deleteCoupon);

// Public validate endpoint (for logged-in users)
router.post(
  '/validate',
  auth(),
  validate(['code', 'courseId'], { allowPartial: true }),
  couponController.validateCoupon
);

module.exports = router;


