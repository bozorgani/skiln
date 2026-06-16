const ApiError = require('../../core/ApiError');
const Order = require('./order.model');
const Course = require('../courses/course.model');

const createOrder = async ({ user, course, amount }) => {
  const courseDoc = await Course.findById(course);
  if (!courseDoc) {
    throw new ApiError(404, 'Course not found');
  }
  const payableAmount = typeof amount === 'number' ? amount : courseDoc.price;
  return Order.create({ user, course, amount: payableAmount });
};

const listOrders = async (filter = {}) => {
  return Order.find(filter)
    .populate('user', 'name email')
    .populate('course', 'title price')
    .sort({ createdAt: -1 });
};

const getOrderById = async (id) => {
  const order = await Order.findById(id)
    .populate('user', 'name email')
    .populate('course', 'title price');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return order;
};

const updateOrderStatus = async (id, status) => {
  if (!['pending', 'paid', 'failed'].includes(status)) {
    throw new ApiError(400, 'Invalid order status');
  }
  const order = await Order.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return order;
};

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
};

