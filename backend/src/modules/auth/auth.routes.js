const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const schemaValidate = require('../../middlewares/schemaValidate');
const { authSchemas } = require('../../validations/schemas');
const rateLimiter = require('../../middlewares/rateLimiter');
const authController = require('./auth.controller');

const router = express.Router();

const otpRateLimiter = rateLimiter({
  windowMs: Number(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.OTP_RATE_LIMIT_MAX) || 5,
  message: 'درخواست‌های ارسال کد بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
  namespace: 'otp-send',
  keyGenerator: (req) => `${req.ip}:${req.body?.phoneNumber || 'unknown'}`,
});

const verifyRateLimiter = rateLimiter({
  windowMs: Number(process.env.OTP_VERIFY_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.OTP_VERIFY_RATE_LIMIT_MAX) || 10,
  message: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
  namespace: 'otp-verify',
  keyGenerator: (req) => `${req.ip}:${req.body?.phoneNumber || 'unknown'}`,
});

router.post(
  '/send-code',
  otpRateLimiter,
  schemaValidate(authSchemas.sendCode),
  validate(['phoneNumber']),
  authController.sendCode
);

router.post(
  '/verify-code',
  verifyRateLimiter,
  schemaValidate(authSchemas.verifyCode),
  validate(['phoneNumber', 'code']),
  authController.verifyCode
);

router.get('/me', auth(), authController.getProfile);

router.post(
  '/register',
  validate(['name', 'phone', 'password']),
  authController.register
);

router.post('/login', validate(['password']), authController.login);

router.post('/refresh', validate(['refreshToken']), authController.refresh);

router.post('/logout', authController.logout);

router.post(
  '/public/send-code',
  otpRateLimiter,
  schemaValidate(authSchemas.sendCode),
  validate(['phoneNumber']),
  authController.sendPublicCode
);

router.post(
  '/public/verify-code',
  verifyRateLimiter,
  schemaValidate(authSchemas.verifyCode),
  validate(['phoneNumber', 'code']),
  authController.verifyPublicCode
);

const adminPhoneController = require('./admin-phone.controller');

router
  .route('/admin-phones')
  .get(auth('admin'), adminPhoneController.getAllAdminPhones)
  .post(
    auth('admin'),
    validate(['phone']),
    adminPhoneController.createAdminPhone
  );

router
  .route('/admin-phones/:id')
  .get(auth('admin'), adminPhoneController.getAdminPhoneById)
  .patch(
    auth('admin'),
    validate(['name', 'isActive'], { allowPartial: true }),
    adminPhoneController.updateAdminPhone
  )
  .delete(auth('admin'), adminPhoneController.deleteAdminPhone);

module.exports = router;
