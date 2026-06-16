const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const couponService = require('./coupon.service');

exports.createCoupon = catchAsync(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
  sendResponse(res, {
    statusCode: 201,
    message: 'Coupon created successfully',
    data: coupon,
  });
});

exports.listCoupons = catchAsync(async (req, res) => {
  const coupons = await couponService.listCoupons(req.query);
  sendResponse(res, {
    message: 'Coupons retrieved successfully',
    data: coupons,
  });
});

exports.getCoupon = catchAsync(async (req, res) => {
  const coupon = await couponService.getCouponById(req.params.id);
  sendResponse(res, {
    message: 'Coupon retrieved successfully',
    data: coupon,
  });
});

exports.updateCoupon = catchAsync(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  sendResponse(res, {
    message: 'Coupon updated successfully',
    data: coupon,
  });
});

exports.deleteCoupon = catchAsync(async (req, res) => {
  await couponService.deleteCoupon(req.params.id);
  sendResponse(res, {
    message: 'Coupon deleted successfully',
  });
});

exports.validateCoupon = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { code, courseId, amount } = req.body;
  const result = await couponService.validateCoupon({
    code,
    courseId,
    amount,
    userId,
  });

  sendResponse(res, {
    message: 'Coupon validated successfully',
    data: {
      code: result.coupon.code,
      type: result.coupon.type,
      value: result.coupon.value,
      originalAmount: result.originalAmount,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
    },
  });
});


