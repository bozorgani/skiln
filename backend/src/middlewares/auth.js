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
    return fallbackHeader;
  }

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const tokenCookie = cookieHeader
      .split(';')
      .map((item) => item.trim())
      .find((cookie) => cookie.startsWith('token='));

    if (tokenCookie) {
      return decodeURIComponent(tokenCookie.split('=')[1]);
    }
  }

  return null;
};

const auth =
  (roles = []) =>
  async (req, _res, next) => {
    try {
      // Check if auth is optional
      const isOptional = roles && typeof roles === 'object' && roles.required === false;
      const roleList = isOptional ? [] : (Array.isArray(roles) ? roles : [roles]);
      
      const token = extractToken(req);
      if (!token) {
        if (isOptional) {
          // If auth is optional and no token, set user to null and continue
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

      // بررسی client claim برای تفکیک توکن‌های admin-panel و frontend
      const client = decoded.client || 'frontend'; // پیش‌فرض frontend برای backward compatibility
      
      // اگر route نیاز به admin دارد، بررسی کن که token از admin-panel آمده باشد
      const requiresAdmin = roleList.includes('admin');
      
      if (requiresAdmin) {
        // اگر می‌خواهد به admin route دسترسی داشته باشد، باید client: 'admin-panel' باشد
        if (client !== 'admin-panel') {
          throw new ApiError(
            403,
            'شما دسترسی به پنل مدیریت ندارید. لطفاً از پنل مدیریت استفاده کنید.',
            [],
            'INVALID_CLIENT_FOR_ADMIN'
          );
        }
        
        // همچنین بررسی کن که کاربر واقعاً admin است
        if (user.role !== 'admin') {
          throw new ApiError(403, 'You do not have permission to perform this action');
        }
      } else {
        // برای route های عادی، بررسی کن که اگر client: 'admin-panel' است، خطا نده
        // (admin-panel می‌تواند به route های عادی دسترسی داشته باشد)
        // اما اگر route خاص frontend است، می‌توانیم محدودیت بگذاریم
      }

      // بررسی role
      if (roleList.length && !roleList.includes(user.role)) {
        throw new ApiError(403, 'You do not have permission to perform this action');
      }

      req.user = user;
      req.client = client; // اضافه کردن client به request object برای استفاده در controllers
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

