const express = require('express');
const auth = require('../../middlewares/auth');
const rateLimiter = require('../../middlewares/rateLimiter');
const schemaValidate = require('../../middlewares/schemaValidate');
const { contactSchemas } = require('../../validations/schemas');
const contactController = require('./contact.controller');

const router = express.Router();

const contactRateLimiter = rateLimiter({
  windowMs: Number(process.env.CONTACT_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.CONTACT_RATE_LIMIT_MAX) || 5,
  namespace: 'contact',
  message: 'تعداد پیام‌های ارسالی بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
  keyGenerator: (req) => `${req.ip}:${req.body?.email || 'unknown'}`,
});

router
  .route('/messages')
  .post(contactRateLimiter, schemaValidate(contactSchemas.create), contactController.createMessage)
  .get(auth('admin'), contactController.listMessages);

router
  .route('/messages/:id')
  .get(auth('admin'), contactController.getMessage)
  .patch(auth('admin'), schemaValidate(contactSchemas.update), contactController.updateStatus)
  .put(auth('admin'), schemaValidate(contactSchemas.update), contactController.updateStatus)
  .delete(auth('admin'), contactController.deleteMessage);

module.exports = router;
