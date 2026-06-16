/**
 * تست کامل فرآیند احراز هویت
 * این فایل تمام مراحل احراز هویت را از ابتدا تا انتها تست می‌کند
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// تنظیمات پایه
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_RESULTS_DIR = './test-results';

// ایجاد پوشه نتایج تست
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

class AuthFlowTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: []
    };
    this.testUser = {
      name: 'کاربر تست احراز هویت',
      phone: '09987654321',
      email: 'auth-test@example.com',
      password: 'AuthTest123456'
    };
    this.authToken = null;
    this.refreshToken = null;
  }

  // لاگ کردن نتایج
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  // اجرای یک تست
  async runTest(testName, testFunction) {
    this.results.total++;
    this.log(`🧪 شروع تست: ${testName}`, 'info');
    
    try {
      await testFunction();
      this.results.passed++;
      this.results.tests.push({
        name: testName,
        status: 'PASSED',
        timestamp: new Date().toISOString()
      });
      this.log(`✅ تست موفق: ${testName}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      this.log(`❌ تست ناموفق: ${testName} - ${error.message}`, 'error');
    }
  }

  // تست ثبت‌نام کاربر جدید
  async testUserRegistration() {
    // ابتدا مطمئن شویم که کاربر وجود ندارد
    try {
      await axios.delete(`${BASE_URL}/users/by-phone/${this.testUser.phone}`);
    } catch (error) {
      // اگر کاربر وجود نداشت، مشکلی نیست
    }

    const response = await axios.post(`${BASE_URL}/auth/register`, this.testUser);
    
    if (response.status !== 201) {
      throw new Error(`Registration failed with status: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Registration not successful: ${response.data.message}`);
    }

    if (!response.data.data.user) {
      throw new Error('User data not returned in registration response');
    }

    // بررسی فیلدهای اساسی کاربر
    const user = response.data.data.user;
    if (user.name !== this.testUser.name) {
      throw new Error('User name mismatch in registration');
    }
    
    if (user.phone !== this.testUser.phone) {
      throw new Error('User phone mismatch in registration');
    }

    if (user.email !== this.testUser.email) {
      throw new Error('User email mismatch in registration');
    }

    // بررسی که رمز عبور برگردانده نشده باشد
    if (user.password) {
      throw new Error('Password should not be returned in registration response');
    }

    this.log(`👤 کاربر با موفقیت ثبت‌نام شد: ${user.name}`, 'success');
  }

  // تست ثبت‌نام مجدد (باید خطا دهد)
  async testDuplicateRegistration() {
    try {
      await axios.post(`${BASE_URL}/auth/register`, this.testUser);
      throw new Error('Duplicate registration should have failed');
    } catch (error) {
      if (error.response?.status !== 400 && error.response?.status !== 409) {
        throw new Error(`Expected 400 or 409 for duplicate registration, got ${error.response?.status}`);
      }
      
      if (!error.response.data.message.includes('موجود') && !error.response.data.message.includes('exists')) {
        throw new Error('Error message should indicate user already exists');
      }
    }
  }

  // تست ورود با اطلاعات صحیح
  async testValidLogin() {
    const loginData = {
      phone: this.testUser.phone,
      password: this.testUser.password
    };

    const response = await axios.post(`${BASE_URL}/auth/login`, loginData);
    
    if (response.status !== 200) {
      throw new Error(`Login failed with status: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Login not successful: ${response.data.message}`);
    }

    if (!response.data.data.token) {
      throw new Error('Token not returned in login response');
    }

    if (!response.data.data.user) {
      throw new Error('User data not returned in login response');
    }

    this.authToken = response.data.data.token;
    
    // بررسی فرمت JWT Token
    const tokenParts = this.authToken.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    // تنظیم header برای درخواست‌های بعدی
    axios.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;

    this.log(`🔑 ورود موفق، Token دریافت شد`, 'success');
  }

  // تست ورود با رمز عبور اشتباه
  async testInvalidPasswordLogin() {
    const loginData = {
      phone: this.testUser.phone,
      password: 'WrongPassword123'
    };

    try {
      await axios.post(`${BASE_URL}/auth/login`, loginData);
      throw new Error('Login with wrong password should have failed');
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error(`Expected 401 for wrong password, got ${error.response?.status}`);
      }
      
      if (!error.response.data.message.includes('نامعتبر') && !error.response.data.message.includes('invalid')) {
        throw new Error('Error message should indicate invalid credentials');
      }
    }
  }

  // تست ورود با شماره تلفن غیرموجود
  async testNonExistentUserLogin() {
    const loginData = {
      phone: '09000000000',
      password: 'SomePassword123'
    };

    try {
      await axios.post(`${BASE_URL}/auth/login`, loginData);
      throw new Error('Login with non-existent user should have failed');
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 404) {
        throw new Error(`Expected 401 or 404 for non-existent user, got ${error.response?.status}`);
      }
    }
  }

  // تست دریافت اطلاعات کاربر جاری
  async testGetCurrentUser() {
    const response = await axios.get(`${BASE_URL}/auth/me`);
    
    if (response.status !== 200) {
      throw new Error(`Get current user failed with status: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Get current user not successful: ${response.data.message}`);
    }

    if (!response.data.data.user) {
      throw new Error('User data not returned');
    }

    const user = response.data.data.user;
    
    // بررسی اطلاعات کاربر
    if (user.phone !== this.testUser.phone) {
      throw new Error('Current user phone mismatch');
    }

    if (user.email !== this.testUser.email) {
      throw new Error('Current user email mismatch');
    }

    // بررسی که رمز عبور برگردانده نشده باشد
    if (user.password) {
      throw new Error('Password should not be returned in user data');
    }

    this.log(`👤 اطلاعات کاربر جاری دریافت شد: ${user.name}`, 'success');
  }

  // تست دسترسی بدون احراز هویت
  async testUnauthorizedAccess() {
    // حذف موقت header احراز هویت
    const originalAuth = axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['Authorization'];

    try {
      await axios.get(`${BASE_URL}/auth/me`);
      throw new Error('Unauthorized access should have failed');
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error(`Expected 401 for unauthorized access, got ${error.response?.status}`);
      }
    } finally {
      // بازگردانی header احراز هویت
      axios.defaults.headers.common['Authorization'] = originalAuth;
    }
  }

  // تست به‌روزرسانی پروفایل
  async testUpdateProfile() {
    const updateData = {
      name: 'کاربر تست به‌روزرسانی شده',
      bio: 'این یک بیوگرافی تست است'
    };

    const response = await axios.patch(`${BASE_URL}/users/me`, updateData);
    
    if (response.status !== 200) {
      throw new Error(`Profile update failed with status: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Profile update not successful: ${response.data.message}`);
    }

    // بررسی که تغییرات اعمال شده باشد
    const userResponse = await axios.get(`${BASE_URL}/auth/me`);
    const updatedUser = userResponse.data.data.user;

    if (updatedUser.name !== updateData.name) {
      throw new Error('Profile name was not updated');
    }

    if (updatedUser.bio !== updateData.bio) {
      throw new Error('Profile bio was not updated');
    }

    this.log(`👤 پروفایل با موفقیت به‌روزرسانی شد`, 'success');
  }

  // تست تغییر رمز عبور
  async testChangePassword() {
    const newPassword = 'NewAuthTest123456';
    const changePasswordData = {
      currentPassword: this.testUser.password,
      newPassword: newPassword,
      confirmPassword: newPassword
    };

    const response = await axios.patch(`${BASE_URL}/auth/change-password`, changePasswordData);
    
    if (response.status !== 200) {
      throw new Error(`Password change failed with status: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Password change not successful: ${response.data.message}`);
    }

    // تست ورود با رمز عبور جدید
    delete axios.defaults.headers.common['Authorization'];
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      phone: this.testUser.phone,
      password: newPassword
    });

    if (!loginResponse.data.success) {
      throw new Error('Login with new password failed');
    }

    // بازگردانی token
    this.authToken = loginResponse.data.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
    
    // به‌روزرسانی رمز عبور در testUser
    this.testUser.password = newPassword;

    this.log(`🔒 رمز عبور با موفقیت تغییر کرد`, 'success');
  }

  // تست خروج از سیستم
  async testLogout() {
    const response = await axios.post(`${BASE_URL}/auth/logout`);
    
    if (response.status !== 200) {
      throw new Error(`Logout failed with status: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Logout not successful: ${response.data.message}`);
    }

    // تست که token دیگر معتبر نیست
    try {
      await axios.get(`${BASE_URL}/auth/me`);
      throw new Error('Token should be invalid after logout');
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error(`Expected 401 after logout, got ${error.response?.status}`);
      }
    }

    this.log(`🚪 خروج از سیستم موفق بود`, 'success');
  }

  // تست Token منقضی شده
  async testExpiredToken() {
    // Token فرضی منقضی شده
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${expiredToken}`;

    try {
      await axios.get(`${BASE_URL}/auth/me`);
      throw new Error('Expired token should have been rejected');
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error(`Expected 401 for expired token, got ${error.response?.status}`);
      }
    }
  }

  // تست Token نامعتبر
  async testInvalidToken() {
    const invalidTokens = [
      'invalid-token',
      'Bearer invalid',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      ''
    ];

    for (const token of invalidTokens) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      try {
        await axios.get(`${BASE_URL}/auth/me`);
        throw new Error(`Invalid token should have been rejected: ${token}`);
      } catch (error) {
        if (error.response?.status !== 401) {
          throw new Error(`Expected 401 for invalid token, got ${error.response?.status}`);
        }
      }
    }
  }

  // تست محدودیت نقش‌ها
  async testRoleBasedAccess() {
    // ورود مجدد برای دریافت token معتبر
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      phone: this.testUser.phone,
      password: this.testUser.password
    });
    
    this.authToken = loginResponse.data.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;

    // تست دسترسی به endpoint ادمین (باید 403 دهد)
    try {
      await axios.get(`${BASE_URL}/admin/stats`);
      throw new Error('Non-admin user should not access admin endpoints');
    } catch (error) {
      if (error.response?.status !== 403) {
        throw new Error(`Expected 403 for non-admin access, got ${error.response?.status}`);
      }
    }
  }

  // پاک‌سازی داده‌های تست
  async cleanup() {
    this.log('🧹 شروع پاک‌سازی داده‌های تست...', 'info');

    try {
      // ورود برای دریافت token معتبر
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        phone: this.testUser.phone,
        password: this.testUser.password
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.token;
        const userId = loginResponse.data.data.user._id;
        
        // حذف کاربر تست
        await axios.delete(`${BASE_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      this.log('✅ پاک‌سازی با موفقیت انجام شد', 'success');
    } catch (error) {
      this.log(`⚠️ خطا در پاک‌سازی: ${error.message}`, 'warning');
    }
  }

  // اجرای تمام تست‌ها
  async runAllTests() {
    this.log('🚀 شروع تست‌های فرآیند احراز هویت...', 'info');
    
    const startTime = Date.now();

    // تست‌های ثبت‌نام
    await this.runTest('User Registration', () => this.testUserRegistration());
    await this.runTest('Duplicate Registration Prevention', () => this.testDuplicateRegistration());

    // تست‌های ورود
    await this.runTest('Valid Login', () => this.testValidLogin());
    await this.runTest('Invalid Password Login', () => this.testInvalidPasswordLogin());
    await this.runTest('Non-existent User Login', () => this.testNonExistentUserLogin());

    // تست‌های احراز هویت
    await this.runTest('Get Current User', () => this.testGetCurrentUser());
    await this.runTest('Unauthorized Access', () => this.testUnauthorizedAccess());

    // تست‌های مدیریت پروفایل
    await this.runTest('Update Profile', () => this.testUpdateProfile());
    await this.runTest('Change Password', () => this.testChangePassword());

    // تست‌های خروج
    await this.runTest('Logout', () => this.testLogout());

    // تست‌های امنیت Token
    await this.runTest('Expired Token Handling', () => this.testExpiredToken());
    await this.runTest('Invalid Token Handling', () => this.testInvalidToken());

    // تست‌های نقش‌ها
    await this.runTest('Role-based Access Control', () => this.testRoleBasedAccess());

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // پاک‌سازی
    await this.cleanup();

    // نمایش نتایج
    this.displayResults(duration);
    
    // ذخیره نتایج
    this.saveResults();
  }

  // نمایش نتایج
  displayResults(duration) {
    console.log('\n' + '='.repeat(60));
    this.log('📊 نتایج تست‌های فرآیند احراز هویت', 'info');
    console.log('='.repeat(60));
    
    this.log(`✅ تست‌های موفق: ${this.results.passed}`, 'success');
    this.log(`❌ تست‌های ناموفق: ${this.results.failed}`, 'error');
    this.log(`📊 کل تست‌ها: ${this.results.total}`, 'info');
    this.log(`⏱️ زمان اجرا: ${duration.toFixed(2)} ثانیه`, 'info');
    
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    this.log(`📈 درصد موفقیت: ${successRate}%`, successRate > 90 ? 'success' : 'warning');
    
    console.log('='.repeat(60));
  }

  // ذخیره نتایج
  saveResults() {
    const reportData = {
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        total: this.results.total,
        successRate: ((this.results.passed / this.results.total) * 100).toFixed(1),
        timestamp: new Date().toISOString()
      },
      tests: this.results.tests,
      testUser: {
        phone: this.testUser.phone,
        email: this.testUser.email
      }
    };

    const reportPath = path.join(TEST_RESULTS_DIR, `auth-flow-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    this.log(`📄 گزارش ذخیره شد: ${reportPath}`, 'info');
  }
}

// اجرای تست‌ها
async function main() {
  const testSuite = new AuthFlowTestSuite();
  
  try {
    await testSuite.runAllTests();
    process.exit(testSuite.results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ خطای کلی در اجرای تست‌ها:', error.message);
    process.exit(1);
  }
}

// اجرا فقط اگر به صورت مستقیم فراخوانی شود
if (require.main === module) {
  main();
}

module.exports = AuthFlowTestSuite;


