const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const contactService = require('./contact.service');

exports.createMessage = catchAsync(async (req, res) => {
  const message = await contactService.createMessage(req.body, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  sendResponse(res, { statusCode: 201, data: { message }, message: 'Contact message created' });
});

exports.listMessages = catchAsync(async (req, res) => {
  const result = await contactService.listMessages(req.query);
  sendResponse(res, { data: result, message: 'Contact messages retrieved' });
});

exports.getMessage = catchAsync(async (req, res) => {
  const message = await contactService.getMessage(req.params.id);
  sendResponse(res, { data: { message }, message: 'Contact message retrieved' });
});

exports.updateStatus = catchAsync(async (req, res) => {
  const message = await contactService.updateStatus(req.params.id, req.body, req.user._id);
  sendResponse(res, { data: { message }, message: 'Contact message updated' });
});

exports.deleteMessage = catchAsync(async (req, res) => {
  await contactService.deleteMessage(req.params.id);
  sendResponse(res, { message: 'Contact message deleted' });
});
