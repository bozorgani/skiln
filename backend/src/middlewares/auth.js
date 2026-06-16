const jwt = require('jsonwebtoken');
const ApiError = require('../core/ApiError');
const User = require('../modules/users/user.model');

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.split(' ')[1];
  }

  const fallbackHeader = req.headers['x-access-token'] || req.headers['x-token'];
  if (fallbackHeader) {
    return Array.isArray(fallbackHeader) ? fallbackHeader[0] : fallbackHeader;
  }

  const tokenFromCookieParser = req.cookies?.token;
  if (tokenFromCookieParser) {
    return tokenFromCookieParser;
  }

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const tokenCookie = cookieHeader
      .split(';')
      .map((item) => item.trim())
      .find((cookie) => cookie.startsWith('token='));

    if (tokenCookie) {
      return decodeURIComponent(tokenCookie.split('=').slice(1).join('='));
    }
  }

  return null;
};

const normalizeRoles = (roles) => {
  if (!roles) return [];
  if (Array.isArray(roles)) return roles.filter(Boolean);
  if (typeof roles === 'string') return [roles];
  return [];
};

const auth =
  (roles = []) =>
  async (req, _res, next) => {
    try {
      const isOptional = roles && typeof roles === 'object' && !Array.isArray(roles) && roles.required === false;
      const roleList = isOptional ? [] : normalizeRoles(roles);

      const token = extractToken(req);
      if (!token) {
        if (isOptional) {
          req.user = null;
          req.client = null;
          return next();
        }
        throw new ApiError(401, 'Authorization token missing');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.sub).select('-password');

      if (!user) {
        throw new ApiError(401, 'User not found for provided token');
      }

      if (user.isActive === false) {
        throw new ApiError(403, 'User account is inactive');
      }

      const client = decoded.client || 'frontend';

      if (roleList.length && !roleList.includes(user.role)) {
        throw new ApiError(403, 'You do not have permission to perform this action');
      }

      // Admin-only operations must be performed with an admin-panel token.
      // Mixed routes such as ['admin', 'teacher'] remain usable by teachers while
      // preventing admin frontend tokens from mutating privileged resources.
      const isAdminOnlyRoute = roleList.length === 1 && roleList[0] === 'admin';
      const userIsActingAsAdmin = user.role === 'admin' && roleList.includes('admin');
      if ((isAdminOnlyRoute || userIsActingAsAdmin) && client !== 'admin-panel') {
        throw new ApiError(
          403,
          'شما دسترسی به پنل مدیریت ندارید. لطفاً از پنل مدیریت استفاده کنید.',
          [],
          'INVALID_CLIENT_FOR_ADMIN'
        );
      }

      req.user = user;
      req.client = client;
      req.tokenPayload = decoded;
      next();
    } catch (error) {
      next(
        error instanceof ApiError
          ? error
          : new ApiError(401, 'Invalid or expired token')
      );
    }
  };

module.exports = auth;
