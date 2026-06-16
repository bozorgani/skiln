const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ApiError = require('../../core/ApiError');
const { normalizePhone } = require('../../utils/phone');
const logger = require('../../utils/logger');
const User = require('../users/user.model');
const RefreshToken = require('./auth.model');
const OtpCode = require('./otp.model');
const AdminPhone = require('./admin-phone.model');

// Cache برای لیست شماره‌های admin (برای بهبود عملکرد)
let adminPhonesCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 دقیقه

// خواندن لیست شماره‌های admin از دیتابیس
const getAdminPhonesFromDB = async () => {
  try {
    const now = Date.now();
    
    // اگر cache معتبر است، از cache استفاده کن
    if (adminPhonesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
      return adminPhonesCache;
    }
    
    // خواندن از دیتابیس
    const adminPhones = await AdminPhone.find({ isActive: true }).select('phone -_id');
    const phones = adminPhones.map(item => item.phone);
    
    // به‌روزرسانی cache
    adminPhonesCache = phones;
    cacheTimestamp = now;
    
    logger.debug(`Loaded ${phones.length} admin phone(s) from database`);
    return phones;
  } catch (error) {
    logger.error('Error loading admin phones from database:', error);
    // در صورت خطا، از cache قبلی استفاده کن (اگر وجود دارد)
    if (adminPhonesCache) {
      logger.warn('Using cached admin phones due to database error');
      return adminPhonesCache;
    }
    // اگر cache هم وجود ندارد، لیست خالی برگردان
    return [];
  }
};

// بررسی اینکه آیا شماره تلفن در لیست admin ها است یا نه
const isAdminPhone = async (phone) => {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  
  const adminPhones = await getAdminPhonesFromDB();
  return adminPhones.includes(normalized);
};

// پاک کردن cache (برای استفاده بعد از تغییرات)
const clearAdminPhonesCache = () => {
  adminPhonesCache = null;
  cacheTimestamp = null;
};

const durationMultipliers = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const parseDuration = (value, fallback = 24 * 60 * 60 * 1000) => {
  if (!value) return fallback;
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = match[2];
  return amount * durationMultipliers[unit];
};

/**
 * ساخت JWT token با claim های کاربر و client (admin-panel یا frontend)
 * @param {Object} user - کاربر
 * @param {String} client - منبع توکن: 'admin-panel' یا 'frontend'
 */
const signAccessToken = (user, client = 'frontend') => {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
      client: client, // تفکیک توکن‌های پنل مدیریت و فرانت‌اند
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );
};

const generateRefreshToken = async (user, client = 'frontend') => {
  const tokenId = crypto.randomUUID();
  const rawSecret = crypto.randomBytes(40).toString('hex');
  const value = `${tokenId}.${rawSecret}`;
  const hashed = await bcrypt.hash(value, 10);
  const ttl = parseDuration(process.env.REFRESH_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000);
  const expiresAt = new Date(Date.now() + ttl);

  await RefreshToken.create({
    user: user._id,
    tokenId,
    token: hashed,
    expiresAt,
    client,
  });

  return value;
};

/**
 * ساخت access token و refresh token
 * @param {Object} user - کاربر
 * @param {String} client - منبع توکن: 'admin-panel' یا 'frontend'
 */
const issueTokens = async (user, client = 'frontend') => {
  const accessToken = signAccessToken(user, client);
  const refreshToken = await generateRefreshToken(user, client);
  return { accessToken, refreshToken };
};

const OTP_LENGTH = Number(process.env.OTP_LENGTH) || 4;
const OTP_TTL_MS = Number(process.env.OTP_TTL_MS) || 2 * 60 * 1000;
const OTP_RESEND_WINDOW_MS =
  Number(process.env.OTP_RESEND_WINDOW_MS) || 30 * 1000;

const generateNumericCode = (length = OTP_LENGTH) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const sendLoginCode = async (phoneNumber) => {
  const phone = normalizePhone(phoneNumber);
  if (!phone) {
    throw new ApiError(400, 'Phone number is required');
  }

  // بررسی اینکه آیا شماره در لیست admin ها است یا نه (برای پنل مدیریت)
  // این بررسی در send-code انجام می‌شود تا کاربر زودتر متوجه شود
  const isAdmin = await isAdminPhone(phone);
  if (!isAdmin) {
    throw new ApiError(
      403,
      'شماره شما در لیست شماره‌های مجاز برای پنل مدیریت نیست. لطفاً با مدیر سیستم تماس بگیرید.',
      [],
      'PHONE_NOT_IN_ADMIN_LIST'
    );
  }

  const existing = await OtpCode.findOne({ phone });
  if (
    existing &&
    Date.now() - existing.updatedAt.getTime() < OTP_RESEND_WINDOW_MS
  ) {
    const waitSeconds = Math.ceil(
      (OTP_RESEND_WINDOW_MS - (Date.now() - existing.updatedAt.getTime())) / 1000
    );
    throw new ApiError(
      429,
      `Please wait ${waitSeconds}s before requesting another code`
    );
  }

  const code = generateNumericCode().toString();
  const hashed = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await OtpCode.findOneAndUpdate(
    { phone },
    { code: hashed, expiresAt, attempts: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  logger.debug(`[OTP] Code for ${phone}: ${code}`);

  const response = {
    phoneNumber: phone,
    expiresIn: Math.floor(OTP_TTL_MS / 1000),
  };

  if (process.env.NODE_ENV !== 'production') {
    response.debugCode = code;
  }

  return response;
};

const verifyLoginCode = async ({ phoneNumber, code, name }) => {
  const phone = normalizePhone(phoneNumber);
  if (!phone) {
    throw new ApiError(400, 'Phone number is required');
  }
  if (!code) {
    throw new ApiError(400, 'Verification code is required');
  }

  const record = await OtpCode.findOne({ phone });
  if (!record) {
    throw new ApiError(400, 'Verification code expired or not found');
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await record.deleteOne();
    throw new ApiError(400, 'Verification code has expired');
  }

  const isMatch = await bcrypt.compare(code, record.code);
  if (!isMatch) {
    record.attempts += 1;
    if (record.attempts >= 5) {
      await record.deleteOne();
      throw new ApiError(400, 'کد وارد شده اشتباه است. تعداد تلاش‌های مجاز به پایان رسید.');
    } else {
      await record.save();
    }
    throw new ApiError(400, 'کد وارد شده اشتباه است');
  }

  await record.deleteOne();

  // بررسی اینکه آیا شماره در لیست admin ها است یا نه (برای پنل مدیریت)
  // این بررسی باید قبل از ایجاد/به‌روزرسانی کاربر انجام شود
  const isAdmin = await isAdminPhone(phone);
  
  // اگر شماره در لیست admin ها نیست، خطا بده
  // این برای جلوگیری از ورود کاربران عادی به پنل مدیریت است
  if (!isAdmin) {
    throw new ApiError(
      403,
      'شماره شما در لیست شماره‌های مجاز برای پنل مدیریت نیست. لطفاً با مدیر سیستم تماس بگیرید.',
      [],
      'PHONE_NOT_IN_ADMIN_LIST'
    );
  }

  let user = await User.findOne({ phone });
  const trimmedName = typeof name === 'string' ? name.trim() : '';

  // تعیین نقش کاربر: اگر شماره در لیست admin ها باشد، نقش admin می‌گیرد
  const userRole = 'admin'; // چون قبلاً بررسی کردیم که isAdmin است

  if (!user) {
    // اگر name خالی بود، از یک نام پیش‌فرض استفاده کن
    const finalName = trimmedName || (userRole === 'admin' ? 'مدیر سیستم' : `کاربر ${phone.slice(-4)}`);
    
    user = await User.create({
      name: finalName,
      phone,
      role: userRole,
    });
    
    if (userRole === 'admin') {
      logger.info(`Admin user created: ${phone}`);
    }
  } else {
    // اگر کاربر وجود دارد، نقش را به‌روزرسانی کن (اگر شماره در لیست admin ها باشد)
    if (isAdmin && user.role !== 'admin') {
      user.role = 'admin';
      logger.info(`User role updated to admin: ${phone}`);
    }
    
    if (!user.name && trimmedName) {
      user.name = trimmedName;
    } else if (!user.name && !trimmedName) {
      // اگر کاربر وجود دارد اما name ندارد و name جدید هم ارسال نشده، از پیش‌فرض استفاده کن
      user.name = userRole === 'admin' ? 'مدیر سیستم' : `کاربر ${phone.slice(-4)}`;
    }
    
    await user.save();
  }

  // برای پنل مدیریت از client: 'admin-panel' استفاده می‌کنیم
  const tokens = await issueTokens(user, 'admin-panel');
  return {
    user,
    token: tokens.accessToken,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const register = async ({ name, email, password, phone }) => {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) {
    throw new ApiError(400, 'Name is required');
  }
  if (!password) {
    throw new ApiError(400, 'Password is required');
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new ApiError(400, 'Phone number is required');
  }

  const normalizedEmail = email ? email.toLowerCase() : undefined;
  const existing = await User.findOne({
    $or: [
      { phone: normalizedPhone },
      ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
    ],
  });
  if (existing) {
    throw new ApiError(400, 'User already exists with the provided information');
  }

  const user = await User.create({
    name: trimmedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    role: 'student',
  });

  // برای register، به طور پیش‌فرض frontend است (می‌توان بعداً تغییر داد)
  const tokens = await issueTokens(user, 'frontend');
  return { user, ...tokens };
};

const login = async ({ email, phone, password }) => {
  if (!password) {
    throw new ApiError(400, 'Password is required');
  }

  let query = null;
  if (phone) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new ApiError(400, 'Phone number is invalid');
    }
    query = { phone: normalizedPhone };
  } else if (email) {
    query = { email: email.toLowerCase() };
  } else {
    throw new ApiError(400, 'Email or phone is required');
  }

  const user = await User.findOne(query)
    .select('+password')
    .exec();

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const cleanUser = user.toObject();
  delete cleanUser.password;

  // برای login با email/password، به طور پیش‌فرض frontend است
  const tokens = await issueTokens(user, 'frontend');
  return { user: cleanUser, ...tokens };
};

const refreshTokens = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token is required');
  }

  const [tokenId] = refreshToken.split('.');
  if (!tokenId) {
    throw new ApiError(400, 'Malformed refresh token');
  }

  const stored = await RefreshToken.findOne({ tokenId });
  if (!stored) {
    throw new ApiError(401, 'Refresh token not found');
  }

  const isValid = await bcrypt.compare(refreshToken, stored.token);
  if (!isValid) {
    throw new ApiError(401, 'Refresh token is invalid');
  }

  if (stored.expiresAt < new Date()) {
    await stored.deleteOne();
    throw new ApiError(401, 'Refresh token expired');
  }

  const user = await User.findById(stored.user);
  if (!user) {
    await stored.deleteOne();
    throw new ApiError(401, 'User associated with token no longer exists');
  }

  await stored.deleteOne(); // rotate refresh token
  
  const client = stored.client || 'frontend';
  const tokens = await issueTokens(user, client);

  return { user, ...tokens };
};

const logout = async (refreshToken) => {
  if (!refreshToken) return;
  const [tokenId] = refreshToken.split('.');
  if (!tokenId) return;
  await RefreshToken.findOneAndDelete({ tokenId });
};

// توابع لاگین عمومی برای فرانت‌اند (بدون چک admin)
// این توابع برای کاربران عادی سایت استفاده می‌شود

/**
 * ارسال کد تایید برای لاگین عمومی (فرانت‌اند)
 * این تابع هیچ چک admin انجام نمی‌دهد و برای همه شماره‌ها کار می‌کند
 * - اگر کاربر وجود نداشت: کد را ارسال می‌کند (برای ثبت‌نام جدید)
 * - اگر کاربر وجود داشت اما اطلاعات ناقص است: کد را ارسال می‌کند (برای تکمیل ثبت‌نام)
 * - اگر کاربر وجود داشت و اطلاعات کامل است: کد را ارسال می‌کند (برای لاگین)
 */
const sendPublicLoginCode = async (phoneNumber) => {
  const phone = normalizePhone(phoneNumber);
  if (!phone) {
    throw new ApiError(400, 'شماره موبایل الزامی است');
  }

  // بررسی اینکه آیا کاربر در دیتابیس وجود دارد یا نه
  // اگر کاربر وجود نداشت یا اطلاعات ناقص دارد، باز هم کد را ارسال می‌کنیم
  // در مرحله verify مشخص می‌شود که کاربر باید به ثبت‌نام برود یا لاگین کند
  const user = await User.findOne({ phone });
  
  // اگر کاربر وجود دارد اما اطلاعات ناقص است، باز هم کد را ارسال می‌کنیم
  // در مرحله verify، اگر name ارسال نشد، خطا می‌دهیم که باید به ثبت‌نام برود
  
  // بررسی اینکه آیا کد قبلاً ارسال شده و باید صبر کند
  const existing = await OtpCode.findOne({ phone });
  if (
    existing &&
    Date.now() - existing.updatedAt.getTime() < OTP_RESEND_WINDOW_MS
  ) {
    const waitSeconds = Math.ceil(
      (OTP_RESEND_WINDOW_MS - (Date.now() - existing.updatedAt.getTime())) / 1000
    );
    throw new ApiError(
      429,
      `لطفاً ${waitSeconds} ثانیه صبر کنید قبل از درخواست کد جدید`
    );
  }

  // همه چیز درست است، کد را ارسال کن
  const code = generateNumericCode().toString();
  const hashed = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await OtpCode.findOneAndUpdate(
    { phone },
    { code: hashed, expiresAt, attempts: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  logger.debug(`[OTP] Public code for ${phone}: ${code}`);

  // بررسی وضعیت کاربر برای frontend
  let userExists = false;
  let hasIncompleteInfo = false;
  
  if (user) {
    userExists = true;
    hasIncompleteInfo = !user.name || (typeof user.name === 'string' && user.name.trim().length === 0);
  }

  const response = {
    phoneNumber: phone,
    expiresIn: Math.floor(OTP_TTL_MS / 1000),
    userExists: userExists, // آیا کاربر وجود دارد یا نه
    requiresRegistration: !userExists || hasIncompleteInfo, // آیا نیاز به ثبت‌نام دارد یا نه
  };

  if (process.env.NODE_ENV !== 'production') {
    response.debugCode = code;
  }

  return response;
};

/**
 * تایید کد برای لاگین عمومی (فرانت‌اند)
 * این تابع چک می‌کند که آیا کاربر در دیتابیس وجود دارد یا نه
 * - اگر name ارسال نشد و کاربر وجود نداشت: خطای USER_NOT_FOUND می‌دهد
 * - اگر name ارسال شد و کاربر وجود نداشت: کاربر جدید ایجاد می‌کند (ثبت‌نام)
 * - اگر کاربر وجود داشت: لاگین می‌کند
 */
const verifyPublicLoginCode = async ({ phoneNumber, code, name }) => {
  const phone = normalizePhone(phoneNumber);
  if (!phone) {
    throw new ApiError(400, 'شماره موبایل الزامی است');
  }
  if (!code) {
    throw new ApiError(400, 'کد تایید الزامی است');
  }

  // بررسی OTP
  const record = await OtpCode.findOne({ phone });
  if (!record) {
    throw new ApiError(400, 'کد تایید یافت نشد یا منقضی شده است');
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await record.deleteOne();
    throw new ApiError(400, 'کد تایید منقضی شده است');
  }

  const isMatch = await bcrypt.compare(code, record.code);
  if (!isMatch) {
    record.attempts += 1;
    if (record.attempts >= 5) {
      await record.deleteOne();
      throw new ApiError(400, 'کد وارد شده اشتباه است. تعداد تلاش‌های مجاز به پایان رسید.');
    } else {
      await record.save();
    }
    throw new ApiError(400, 'کد وارد شده اشتباه است');
  }

  // حذف OTP بعد از تایید موفق
  await record.deleteOne();

  // بررسی اینکه آیا کاربر در دیتابیس وجود دارد یا نه
  let user = await User.findOne({ phone });
  const trimmedName = typeof name === 'string' ? name.trim() : '';

  // اگر کاربر وجود نداشت
  if (!user) {
    // اگر name ارسال شده باشد، کاربر جدید ایجاد کن (ثبت‌نام)
    if (trimmedName) {
      // بررسی اینکه آیا این شماره admin است یا نه (برای جلوگیری از ایجاد admin جدید از طریق فرانت‌اند)
      const isAdmin = await isAdminPhone(phone);
      if (isAdmin) {
        throw new ApiError(
          403,
          'این شماره برای پنل مدیریت است. لطفاً از پنل مدیریت استفاده کنید.',
          [],
          'ADMIN_PHONE_REGISTRATION_NOT_ALLOWED'
        );
      }

      user = await User.create({
        name: trimmedName,
        phone,
        role: 'student', // همه کاربران جدید از طریق فرانت‌اند student هستند
      });

      logger.info(`New user registered via public endpoint: ${phone}`);
    } else {
      // اگر name ارسال نشده و کاربر وجود ندارد، خطا بده
      throw new ApiError(
        404,
        'این شماره موبایل در سیستم ثبت نشده است. لطفاً ابتدا ثبت نام کنید.',
        [],
        'USER_NOT_FOUND'
      );
    }
  } else {
    // اگر کاربر وجود داشت
    // بررسی اینکه آیا اطلاعات کاربر کامل است یا نه
    const hasIncompleteInfo = !user.name || (typeof user.name === 'string' && user.name.trim().length === 0);
    
    if (hasIncompleteInfo) {
      // اگر اطلاعات ناقص است و name ارسال شده، اطلاعات را تکمیل کن
      if (trimmedName) {
        // بررسی اینکه آیا این شماره admin است یا نه (برای جلوگیری از ایجاد admin جدید از طریق فرانت‌اند)
        const isAdmin = await isAdminPhone(phone);
        if (isAdmin) {
          throw new ApiError(
            403,
            'این شماره برای پنل مدیریت است. لطفاً از پنل مدیریت استفاده کنید.',
            [],
            'ADMIN_PHONE_REGISTRATION_NOT_ALLOWED'
          );
        }
        
        // تکمیل اطلاعات کاربر
        user.name = trimmedName;
        await user.save();
        
        logger.info(`User info completed via public endpoint: ${phone}`);
      } else {
        // اگر اطلاعات ناقص است اما name ارسال نشده، خطا بده که باید به ثبت‌نام برود
        throw new ApiError(
          400,
          'اطلاعات حساب کاربری شما ناقص است. لطفاً نام خود را وارد کنید.',
          [],
          'INCOMPLETE_USER_INFO'
        );
      }
    } else {
      // اگر اطلاعات کامل است و name هم ارسال شده، یعنی می‌خواهد ثبت‌نام مجدد کند
      if (trimmedName) {
        throw new ApiError(
          400,
          'این شماره موبایل قبلاً ثبت شده است. لطفاً از صفحه ورود استفاده کنید.',
          [],
          'USER_ALREADY_EXISTS'
        );
      }
    }
  }

  // برای فرانت‌اند از client: 'frontend' استفاده می‌کنیم
  const tokens = await issueTokens(user, 'frontend');
  return {
    user,
    token: tokens.accessToken,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  sendLoginCode,
  verifyLoginCode,
  sendPublicLoginCode,
  verifyPublicLoginCode,
  clearAdminPhonesCache,
};

