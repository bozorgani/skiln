const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const userService = require('./user.service');

exports.createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  sendResponse(res, {
    statusCode: 201,
    message: 'User created successfully',
    data: user,
  });
});

exports.getUsers = catchAsync(async (req, res) => {
  const result = await userService.getUsers(req.query);
  sendResponse(res, { 
    data: { 
      users: result.users || result,
      pagination: result.pagination 
    }, 
    message: 'Users retrieved' 
  });
});

exports.getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  sendResponse(res, { data: user, message: 'User retrieved' });
});

exports.updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  sendResponse(res, { data: user, message: 'User updated' });
});

exports.deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);
  sendResponse(res, { message: 'User deleted' });
});

exports.getMe = catchAsync(async (req, res) => {
  sendResponse(res, { data: req.user, message: 'Profile retrieved' });
});

exports.updateMe = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  sendResponse(res, { data: user, message: 'Profile updated' });
});

exports.updateUserRole = catchAsync(async (req, res) => {
  const user = await userService.updateUserRole(req.params.id, req.body.role);
  sendResponse(res, { data: user, message: 'User role updated' });
});

exports.getStats = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const stats = await userService.getUserStats(userId);
  sendResponse(res, { data: stats, message: 'Stats retrieved successfully' });
});

