const User = require('../users/user.model');
const Course = require('../courses/course.model');
const Order = require('../orders/order.model');
const Payment = require('../payments/payment.model');
const Ticket = require('../tickets/ticket.model');
const Blog = require('../blog/blog.model');

const getStats = async () => {
  try {
    // آمار کاربران (بدون admin - چون در لیست کاربران نشان داده نمی‌شوند)
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const teacherUsers = await User.countDocuments({ role: 'teacher' });
    const studentUsers = await User.countDocuments({ role: 'student' });

    // آمار دوره‌ها
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ status: 'published' });
    const draftCourses = await Course.countDocuments({ status: 'draft' });

    // آمار سفارشات
    const totalOrders = await Order.countDocuments();
    const paidOrders = await Order.countDocuments({ status: 'paid' });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // آمار پرداخت‌ها
    const totalPayments = await Payment.countDocuments();
    const succeededPayments = await Payment.countDocuments({ status: 'succeeded' });
    const failedPayments = await Payment.countDocuments({ status: 'failed' });
    
    // مجموع درآمد
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // آمار تیکت‌ها
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: 'open' });
    const closedTickets = await Ticket.countDocuments({ status: 'closed' });

    // آمار وبلاگ
    const totalPosts = await Blog.countDocuments();

    // آمار کاربران جدید (آخرین 30 روز)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // آمار دوره‌های جدید (آخرین 30 روز)
    const newCoursesLast30Days = await Course.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Format برای سازگاری با frontend admin-panel
    return {
      // Format اصلی (برای استفاده داخلی)
      users: {
        total: totalUsers,
        admin: adminUsers,
        teacher: teacherUsers,
        student: studentUsers,
        newLast30Days: newUsersLast30Days,
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: draftCourses,
        newLast30Days: newCoursesLast30Days,
      },
      orders: {
        total: totalOrders,
        paid: paidOrders,
        pending: pendingOrders,
      },
      payments: {
        total: totalPayments,
        succeeded: succeededPayments,
        failed: failedPayments,
        totalRevenue,
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        closed: closedTickets,
      },
      blog: {
        total: totalPosts,
      },
      // Format برای frontend admin-panel (برای سازگاری)
      totalUsers,
      totalCourses,
      publishedCourses,
      totalRevenue,
      openTickets,
      activeUsers: studentUsers, // کاربران فعال = دانشجویان
      todayPayments: 0, // می‌توانید محاسبه کنید
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getStats,
};

