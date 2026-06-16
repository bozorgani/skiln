const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const adminService = require('./admin.service');

exports.getStats = catchAsync(async (_req, res) => {
  const stats = await adminService.getStats();
  sendResponse(res, {
    data: stats,
    message: 'Admin statistics retrieved',
  });
});

