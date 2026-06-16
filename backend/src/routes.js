const express = require('express');
const fs = require('fs');
const path = require('path');
const auth = require('./middlewares/auth');
const validate = require('./middlewares/validate');
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const courseRoutes = require('./modules/courses/course.routes');
const blogRoutes = require('./modules/blog/blog.routes');
const orderRoutes = require('./modules/orders/order.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const paymentController = require('./modules/payments/payment.controller');
const ticketRoutes = require('./modules/tickets/ticket.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const enrollmentRoutes = require('./modules/enrollments/enrollment.routes');
const uploadRoutes = require('./modules/uploads/upload.routes');
const couponRoutes = require('./modules/coupons/coupon.routes');
const progressRoutes = require('./modules/progress/progress.routes');
const certificateRoutes = require('./modules/certificates/certificate.routes');
const categoryRoutes = require('./modules/categories/category.routes');
const contactRoutes = require('./modules/contact/contact.routes');
const reviewRoutes = require('./modules/reviews/review.routes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/docs/openapi.yaml', (_req, res, next) => {
  const openApiPath = path.join(__dirname, '..', 'openapi.yaml');
  fs.readFile(openApiPath, 'utf8', (error, content) => {
    if (error) return next(error);
    res.type('text/yaml').send(content);
  });
});

router.get('/docs', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Skiln API Docs</title>
  <style>body{margin:0;font-family:system-ui,Tahoma,sans-serif}.top{padding:12px 20px;background:#0f172a;color:#fff}.top a{color:#93c5fd}</style>
</head>
<body>
  <div class="top">Skiln API Docs — <a href="/api/docs/openapi.yaml">OpenAPI YAML</a></div>
  <redoc spec-url="/api/docs/openapi.yaml"></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
</body>
</html>`);
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/blogs', blogRoutes);
router.use('/blog', blogRoutes); // Alias for backward compatibility
router.use('/posts', blogRoutes); // Alias for admin-panel
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/tickets', ticketRoutes);
router.use('/contact', contactRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/uploads', uploadRoutes);
// Note: Video streaming is handled in app.js before static files
router.use('/coupons', couponRoutes);
router.use('/progress', progressRoutes);
router.use('/certificates', certificateRoutes);
// Alias for transactions (admin-panel uses /transactions)
router.get('/transactions', auth('admin'), paymentController.getTransactions);
router.post('/transactions/refund', auth('admin'), validate(['transactionId']), paymentController.refundTransaction);

module.exports = router;

