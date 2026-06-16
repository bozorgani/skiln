const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const orderService = require('./order.service');

exports.createOrder = catchAsync(async (req, res) => {
  const payload = { ...req.body, user: req.user._id };
  const order = await orderService.createOrder(payload);
  sendResponse(res, {
    statusCode: 201,
    message: 'Order created',
    data: order,
  });
});

exports.listMyOrders = catchAsync(async (req, res) => {
  const orders = await orderService.listOrders({ user: req.user._id });
  sendResponse(res, { data: orders, message: 'Orders retrieved' });
});

exports.listOrders = catchAsync(async (_req, res) => {
  const orders = await orderService.listOrders();
  sendResponse(res, { data: orders, message: 'All orders retrieved' });
});

exports.updateStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status
  );
  sendResponse(res, { data: order, message: 'Order status updated' });
});

