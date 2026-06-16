const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const authController = require('./auth.controller');

const router = express.Router();

router.post(
  '/send-code',
  validate(['phoneNumber']),
  authController.sendCode
);

router.post(
  '/verify-code',
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

// Public authentication routes (for frontend - بدون چک admin)
router.post(
  '/public/send-code',
  validate(['phoneNumber']),
  authController.sendPublicCode
);

router.post(
  '/public/verify-code',
  validate(['phoneNumber', 'code']),
  authController.verifyPublicCode
);

// Admin phones management routes
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

