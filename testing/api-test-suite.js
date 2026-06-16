/**
 * جامع‌ترین تست‌های API برای پروژه LMS Bozorgani
 * این فایل تمام endpoint های API را تست می‌کند
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

// ایجاد axios instance با پشتیبانی از Cookie
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // برای Cookie
  headers: {
    'Content-Type': 'application/json'
  }
});

// کلاس تست
class APITestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: []
    };
    this.authToken = null;
    this.testUser = null;
    this.testCourse = null;
    this.testOrder = null;
    this.testTicket = null;
    this.testBlog = null;
    this.axios = axiosInstance; // استفاده از instance با Cookie
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

  // تست سلامت API
  async testHealthCheck() {
    const response = await this.axios.get(`/health`);
    if (response.status !== 200) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    if (response.data.status !== 'ok') {
      throw new Error(`Health status not ok: ${response.data.status}`);
    }
  }

  // تست ثبت‌نام کاربر
  async testUserRegistration() {
    const userData = {
      name: 'Test User',
      phone: '09123456789',
      email: 'test@example.com',
      password: 'Test123456'
    };

    const response = await this.axios.post(`/auth/register`, userData);
    
    if (response.status !== 201) {
      throw new Error(`Registration failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Registration not successful: ${response.data.message}`);
    }

    this.testUser = response.data.data.user;
  }

  // تست ورود کاربر
  async testUserLogin() {
    const loginData = {
      phone: '09123456789',
      password: 'Test123456'
    };

    const response = await this.axios.post(`/auth/login`, loginData);
    
    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Login not successful: ${response.data.message}`);
    }

    this.authToken = response.data.data.token || response.data.data.accessToken;
    
    // Cookie به صورت خودکار توسط axios با withCredentials حفظ می‌شود
  }

  // تست دریافت اطلاعات کاربر جاری
  async testGetCurrentUser() {
    const response = await this.axios.get(`/auth/me`);
    
    if (response.status !== 200) {
      throw new Error(`Get current user failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Get current user not successful: ${response.data.message}`);
    }

    if (!response.data.data.user) {
      throw new Error('User data not returned');
    }
  }

  // تست ایجاد دوره
  async testCreateCourse() {
    const courseData = {
      title: 'دوره تست',
      description: 'این یک دوره تست است',
      price: 100000,
      thumbnail: 'test-thumbnail.jpg',
      sections: [
        {
          title: 'بخش اول',
          lessons: [
            {
              title: 'درس اول',
              content: 'محتوای درس اول',
              duration: 300
            }
          ]
        }
      ]
    };

    const response = await this.axios.post(`/courses`, courseData);
    
    if (response.status !== 201) {
      throw new Error(`Create course failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Create course not successful: ${response.data.message}`);
    }

    this.testCourse = response.data.data;
  }

  // تست دریافت لیست دوره‌ها
  async testGetCourses() {
    const response = await this.axios.get(`/courses`);
    
    if (response.status !== 200) {
      throw new Error(`Get courses failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Get courses not successful: ${response.data.message}`);
    }

    if (!Array.isArray(response.data.data.courses)) {
      throw new Error('Courses data is not an array');
    }
  }

  // تست دریافت جزئیات دوره
  async testGetCourseDetails() {
    if (!this.testCourse) {
      throw new Error('No test course available');
    }

    const response = await this.axios.get(`/courses/${this.testCourse._id}`);
    
    if (response.status !== 200) {
      throw new Error(`Get course details failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Get course details not successful: ${response.data.message}`);
    }

    if (!response.data.data.course) {
      throw new Error('Course data not returned');
    }
  }

  // تست آمار دوره
  async testGetCourseAnalytics() {
    if (!this.testCourse) {
      throw new Error('No test course available');
    }

    const response = await this.axios.get(`/courses/${this.testCourse._id}/analytics`);
    
    if (response.status !== 200) {
      throw new Error(`Get course analytics failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Get course analytics not successful: ${response.data.message}`);
    }
  }

  // تست ایجاد سفارش
  async testCreateOrder() {
    if (!this.testCourse) {
      throw new Error('No test course available');
    }

    const orderData = {
      courseId: this.testCourse._id,
      amount: this.testCourse.price
    };

    const response = await this.axios.post(`/orders`, orderData);
    
    if (response.status !== 201) {
      throw new Error(`Create order failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Create order not successful: ${response.data.message}`);
    }

    this.testOrder = response.data.data;
  }

  // تست ایجاد پرداخت
  async testCreatePayment() {
    if (!this.testOrder) {
      throw new Error('No test order available');
    }

    const paymentData = {
      orderId: this.testOrder._id,
      gateway: 'test',
      amount: this.testOrder.amount
    };

    const response = await this.axios.post(`/payments/create`, paymentData);
    
    if (response.status !== 201) {
      throw new Error(`Create payment failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Create payment not successful: ${response.data.message}`);
    }
  }

  // تست ایجاد تیکت
  async testCreateTicket() {
    const ticketData = {
      title: 'تیکت تست',
      message: 'این یک تیکت تست است',
      priority: 'medium',
      category: 'technical'
    };

    const response = await this.axios.post(`/tickets`, ticketData);
    
    if (response.status !== 201) {
      throw new Error(`Create ticket failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Create ticket not successful: ${response.data.message}`);
    }

    this.testTicket = response.data.data;
  }

  // تست دریافت لیست تیکت‌ها
  async testGetTickets() {
    const response = await this.axios.get(`/tickets`);
    
    if (response.status !== 200) {
      throw new Error(`Get tickets failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Get tickets not successful: ${response.data.message}`);
    }
  }

  // تست ایجاد پست وبلاگ
  async testCreateBlogPost() {
    const blogData = {
      title: 'پست تست',
      content: 'این یک پست تست است',
      excerpt: 'خلاصه پست تست',
      tags: ['تست', 'وبلاگ'],
      status: 'draft'
    };

    const response = await this.axios.post(`/posts`, blogData);
    
    if (response.status !== 201) {
      throw new Error(`Create blog post failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Create blog post not successful: ${response.data.message}`);
    }

    this.testBlog = response.data.data;
  }

  // تست دریافت آمار ادمین
  async testGetAdminStats() {
    const response = await this.axios.get(`/admin/stats`);
    
    if (response.status !== 200) {
      throw new Error(`Get admin stats failed: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(`Get admin stats not successful: ${response.data.message}`);
    }

    if (!response.data.data) {
      throw new Error('Stats data not returned');
    }
  }

  // تست سناریوهای خطا
  async testErrorScenarios() {
    // تست 404 - endpoint غیرموجود
    try {
      await this.axios.get(`/nonexistent`);
      throw new Error('404 test failed - should have thrown error');
    } catch (error) {
      if (error.response?.status !== 404) {
        throw new Error(`Expected 404, got ${error.response?.status}`);
      }
    }

    // تست 401 - بدون احراز هویت
    const originalAuth = axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['Authorization'];
    
    try {
      await this.axios.get(`/admin/stats`);
      throw new Error('401 test failed - should have thrown error');
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error(`Expected 401, got ${error.response?.status}`);
      }
    }
    
    // بازگردانی احراز هویت
    axios.defaults.headers.common['Authorization'] = originalAuth;

    // تست 400 - داده‌های نامعتبر
    try {
      await this.axios.post(`/courses`, {});
      throw new Error('400 test failed - should have thrown error');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Expected 400, got ${error.response?.status}`);
      }
    }
  }

  // تست امنیت - SQL Injection
  async testSQLInjection() {
    const maliciousData = {
      phone: "'; DROP TABLE users; --",
      password: 'test'
    };

    try {
      await this.axios.post(`/auth/login`, maliciousData);
    } catch (error) {
      // انتظار می‌رود که خطا بدهد، اما نباید باعث crash شود
      if (error.response?.status === 500) {
        throw new Error('SQL Injection vulnerability detected');
      }
    }
  }

  // تست امنیت - XSS
  async testXSSProtection() {
    const xssData = {
      title: '<script>alert("XSS")</script>',
      description: 'Test course',
      price: 100000,
      thumbnail: 'test.jpg'
    };

    const response = await this.axios.post(`/courses`, xssData);
    
    if (response.data.data.title.includes('<script>')) {
      throw new Error('XSS vulnerability detected - script tags not sanitized');
    }
  }

  // پاک کردن داده‌های تست
  async cleanup() {
    this.log('🧹 شروع پاک‌سازی داده‌های تست...', 'info');

    try {
      // حذف دوره تست
      if (this.testCourse) {
        await this.axios.delete(`/courses/${this.testCourse._id}`);
      }

      // حذف پست وبلاگ تست
      if (this.testBlog) {
        await this.axios.delete(`/posts/${this.testBlog._id}`);
      }

      // حذف کاربر تست
      if (this.testUser) {
        await this.axios.delete(`/users/${this.testUser._id}`);
      }

      this.log('✅ پاک‌سازی با موفقیت انجام شد', 'success');
    } catch (error) {
      this.log(`⚠️ خطا در پاک‌سازی: ${error.message}`, 'warning');
    }
  }

  // اجرای تمام تست‌ها
  async runAllTests() {
    this.log('🚀 شروع تست‌های جامع API...', 'info');
    
    const startTime = Date.now();

    // تست‌های پایه
    await this.runTest('Health Check', () => this.testHealthCheck());
    
    // تست‌های احراز هویت
    await this.runTest('User Registration', () => this.testUserRegistration());
    await this.runTest('User Login', () => this.testUserLogin());
    await this.runTest('Get Current User', () => this.testGetCurrentUser());
    
    // تست‌های دوره
    await this.runTest('Create Course', () => this.testCreateCourse());
    await this.runTest('Get Courses', () => this.testGetCourses());
    await this.runTest('Get Course Details', () => this.testGetCourseDetails());
    await this.runTest('Get Course Analytics', () => this.testGetCourseAnalytics());
    
    // تست‌های سفارش و پرداخت
    await this.runTest('Create Order', () => this.testCreateOrder());
    await this.runTest('Create Payment', () => this.testCreatePayment());
    
    // تست‌های تیکت
    await this.runTest('Create Ticket', () => this.testCreateTicket());
    await this.runTest('Get Tickets', () => this.testGetTickets());
    
    // تست‌های وبلاگ
    await this.runTest('Create Blog Post', () => this.testCreateBlogPost());
    
    // تست‌های ادمین
    await this.runTest('Get Admin Stats', () => this.testGetAdminStats());
    
    // تست‌های خطا
    await this.runTest('Error Scenarios', () => this.testErrorScenarios());
    
    // تست‌های امنیت
    await this.runTest('SQL Injection Protection', () => this.testSQLInjection());
    await this.runTest('XSS Protection', () => this.testXSSProtection());

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
    this.log('📊 نتایج تست‌های API', 'info');
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
      tests: this.results.tests
    };

    const reportPath = path.join(TEST_RESULTS_DIR, `api-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    this.log(`📄 گزارش ذخیره شد: ${reportPath}`, 'info');
  }
}

// اجرای تست‌ها
async function main() {
  const testSuite = new APITestSuite();
  
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

module.exports = APITestSuite;
