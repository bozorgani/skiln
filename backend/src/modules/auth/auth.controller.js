const catchAsync = require('../../core/catchAsync');
const sendResponse = require('../../core/sendResponse');
const authService = require('./auth.service');

const COOKIE_MAX_AGE =
  Number(process.env.JWT_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000;

const setAccessTokenCookie = (res, token) => {
  if (!token) return;
  res.cookie('token', token, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true, // امنیت بیشتر - جلوگیری از دسترسی JavaScript
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
};

exports.register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  setAccessTokenCookie(res, result.accessToken);
  sendResponse(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: result,
  });
});

exports.login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  setAccessTokenCookie(res, result.accessToken);
  sendResponse(res, {
    message: 'Login successful',
    data: result,
  });
});

exports.refresh = catchAsync(async (req, res) => {
  const result = await authService.refreshTokens(req.body.refreshToken);
  sendResponse(res, {
    message: 'Tokens refreshed',
    data: result,
  });
});

exports.logout = catchAsync(async (req, res) => {
  const refreshToken = req.body ? req.body.refreshToken : undefined;
  await authService.logout(refreshToken);
  res.clearCookie('token', { path: '/' });
  sendResponse(res, {
    message: 'Logged out successfully',
  });
});

exports.sendCode = catchAsync(async (req, res) => {
  const result = await authService.sendLoginCode(req.body.phoneNumber);
  sendResponse(res, {
    message: 'Verification code sent',
    data: result,
  });
});

exports.verifyCode = catchAsync(async (req, res) => {
  const result = await authService.verifyLoginCode(req.body);
  setAccessTokenCookie(res, result.accessToken || result.token);
  sendResponse(res, {
    message: 'Verification successful',
    data: {
      user: result.user,
      token: result.token,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

exports.getProfile = catchAsync(async (req, res) => {
  sendResponse(res, {
    message: 'Profile retrieved',
    data: { user: req.user },
  });
});

// Controller برای لاگین عمومی (فرانت‌اند)
exports.sendPublicCode = catchAsync(async (req, res) => {
  const result = await authService.sendPublicLoginCode(req.body.phoneNumber);
  sendResponse(res, {
    message: 'کد تایید ارسال شد',
    data: result,
  });
});

exports.verifyPublicCode = catchAsync(async (req, res) => {
  const result = await authService.verifyPublicLoginCode(req.body);
  setAccessTokenCookie(res, result.accessToken || result.token);
  sendResponse(res, {
    message: 'ورود موفقیت‌آمیز بود',
    data: {
      user: result.user,
      token: result.token,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

