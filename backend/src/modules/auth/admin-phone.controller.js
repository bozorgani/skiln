const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const adminPhoneService = require('./admin-phone.service');

exports.getAllAdminPhones = catchAsync(async (_req, res) => {
  const adminPhones = await adminPhoneService.getAllAdminPhones();
  sendResponse(res, {
    data: adminPhones,
    message: 'Admin phones retrieved',
  });
});

exports.getAdminPhoneById = catchAsync(async (req, res) => {
  const adminPhone = await adminPhoneService.getAdminPhoneById(req.params.id);
  sendResponse(res, {
    data: adminPhone,
    message: 'Admin phone retrieved',
  });
});

exports.createAdminPhone = catchAsync(async (req, res) => {
  const adminPhone = await adminPhoneService.createAdminPhone({
    phone: req.body.phone,
    name: req.body.name,
    addedBy: req.user._id,
  });
  sendResponse(res, {
    statusCode: 201,
    message: 'Admin phone added successfully',
    data: adminPhone,
  });
});

exports.updateAdminPhone = catchAsync(async (req, res) => {
  const adminPhone = await adminPhoneService.updateAdminPhone(req.params.id, {
    name: req.body.name,
    isActive: req.body.isActive,
  });
  sendResponse(res, {
    message: 'Admin phone updated',
    data: adminPhone,
  });
});

exports.deleteAdminPhone = catchAsync(async (req, res) => {
  await adminPhoneService.deleteAdminPhone(req.params.id);
  sendResponse(res, {
    message: 'Admin phone deleted successfully',
  });
});

