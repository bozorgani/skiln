const express = require('express');
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

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/blogs', blogRoutes);
router.use('/blog', blogRoutes); // Alias for backward compatibility
router.use('/posts', blogRoutes); // Alias for admin-panel
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/tickets', ticketRoutes);
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

