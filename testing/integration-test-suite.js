/**
 * تست‌های یکپارچگی Frontend و Backend
 * این فایل تست می‌کند که Frontend و Backend به درستی با هم کار می‌کنند
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// تنظیمات پایه
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_RESULTS_DIR = './test-results';

// ایجاد پوشه نتایج تست
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

class IntegrationTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: []
    };
    this.browser = null;
    this.frontendPage = null;
    this.adminPage = null;
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

  // راه‌اندازی مرورگر
  async setupBrowser() {
    this.log('🌐 راه‌اندازی مرورگر...', 'info');
    
    this.browser = await puppeteer.launch({
      headless: false, // برای دیدن تست‌ها
      slowMo: 100, // کند کردن برای مشاهده بهتر
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // ایجاد صفحات
    this.frontendPage = await this.browser.newPage();
    this.adminPage = await this.browser.newPage();

    // تنظیم viewport
    await this.frontendPage.setViewport({ width: 1920, height: 1080 });
    await this.adminPage.setViewport({ width: 1920, height: 1080 });

    // فعال کردن console logs
    this.frontendPage.on('console', msg => {
      if (msg.type() === 'error') {
        this.log(`Frontend Console Error: ${msg.text()}`, 'error');
      }
    });

    this.adminPage.on('console', msg => {
      if (msg.type() === 'error') {
        this.log(`Admin Console Error: ${msg.text()}`, 'error');
      }
    });
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
      
      // گرفتن اسکرین‌شات در صورت خطا
      await this.takeScreenshot(testName);
    }
  }

  // گرفتن اسکرین‌شات
  async takeScreenshot(testName) {
    try {
      const screenshotPath = path.join(TEST_RESULTS_DIR, `error-${testName.replace(/\s+/g, '-')}-${Date.now()}.png`);
      await this.frontendPage.screenshot({ path: screenshotPath, fullPage: true });
      this.log(`📸 اسکرین‌شات ذخیره شد: ${screenshotPath}`, 'info');
    } catch (error) {
      this.log(`خطا در گرفتن اسکرین‌شات: ${error.message}`, 'warning');
    }
  }

  // تست بارگذاری صفحه اصلی Frontend
  async testFrontendHomePage() {
    await this.frontendPage.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    
    // بررسی عنوان صفحه
    const title = await this.frontendPage.title();
    if (!title || title.includes('Error')) {
      throw new Error(`صفحه اصلی به درستی بارگذاری نشد. عنوان: ${title}`);
    }

    // بررسی وجود المان‌های اصلی
    const mainContent = await this.frontendPage.$('main');
    if (!mainContent) {
      throw new Error('محتوای اصلی صفحه یافت نشد');
    }

    // بررسی بارگذاری دوره‌ها
    await this.frontendPage.waitForSelector('[data-testid="course-card"], .course-card', { timeout: 10000 });
  }

  // تست فرآیند ثبت‌نام در Frontend
  async testFrontendRegistration() {
    await this.frontendPage.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle2' });

    // پر کردن فرم ثبت‌نام
    await this.frontendPage.waitForSelector('input[name="name"], input[placeholder*="نام"]');
    await this.frontendPage.type('input[name="name"], input[placeholder*="نام"]', 'کاربر تست');
    
    await this.frontendPage.type('input[name="phone"], input[placeholder*="تلفن"]', '09123456789');
    await this.frontendPage.type('input[name="email"], input[placeholder*="ایمیل"]', 'test@example.com');
    await this.frontendPage.type('input[name="password"], input[placeholder*="رمز"]', 'Test123456');

    // کلیک روی دکمه ثبت‌نام
    await this.frontendPage.click('button[type="submit"], button:contains("ثبت‌نام")');

    // انتظار برای پاسخ
    await this.frontendPage.waitForTimeout(3000);

    // بررسی موفقیت یا خطا
    const currentUrl = this.frontendPage.url();
    const errorMessage = await this.frontendPage.$('.error, .alert-error, [role="alert"]');
    
    if (errorMessage) {
      const errorText = await errorMessage.textContent();
      if (!errorText.includes('قبلاً ثبت‌نام')) { // اگر خطا به دلیل وجود کاربر نباشد
        throw new Error(`خطا در ثبت‌نام: ${errorText}`);
      }
    }
  }

  // تست فرآیند ورود در Frontend
  async testFrontendLogin() {
    await this.frontendPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });

    // پر کردن فرم ورود
    await this.frontendPage.waitForSelector('input[name="phone"], input[placeholder*="تلفن"]');
    await this.frontendPage.type('input[name="phone"], input[placeholder*="تلفن"]', '09123456789');
    await this.frontendPage.type('input[name="password"], input[placeholder*="رمز"]', 'Test123456');

    // کلیک روی دکمه ورود
    await this.frontendPage.click('button[type="submit"], button:contains("ورود")');

    // انتظار برای redirect یا پاسخ
    await this.frontendPage.waitForTimeout(3000);

    // بررسی موفقیت ورود
    const currentUrl = this.frontendPage.url();
    if (currentUrl.includes('/login')) {
      const errorMessage = await this.frontendPage.$('.error, .alert-error, [role="alert"]');
      if (errorMessage) {
        const errorText = await errorMessage.textContent();
        throw new Error(`خطا در ورود: ${errorText}`);
      }
    }
  }

  // تست مشاهده جزئیات دوره
  async testCourseDetails() {
    await this.frontendPage.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });

    // یافتن اولین دوره
    await this.frontendPage.waitForSelector('a[href*="/courses/"], .course-card a');
    const courseLink = await this.frontendPage.$('a[href*="/courses/"], .course-card a');
    
    if (!courseLink) {
      throw new Error('لینک دوره یافت نشد');
    }

    await courseLink.click();
    await this.frontendPage.waitForNavigation({ waitUntil: 'networkidle2' });

    // بررسی بارگذاری صفحه جزئیات دوره
    const courseTitle = await this.frontendPage.$('h1, .course-title');
    if (!courseTitle) {
      throw new Error('عنوان دوره یافت نشد');
    }

    // بررسی وجود اطلاعات دوره
    const courseDescription = await this.frontendPage.$('.course-description, .description');
    if (!courseDescription) {
      throw new Error('توضیحات دوره یافت نشد');
    }
  }

  // تست بارگذاری پنل مدیریت
  async testAdminPanelLogin() {
    await this.adminPage.goto(`${ADMIN_URL}/login`, { waitUntil: 'networkidle2' });

    // پر کردن فرم ورود ادمین
    await this.adminPage.waitForSelector('input[name="email"], input[placeholder*="ایمیل"]');
    await this.adminPage.type('input[name="email"], input[placeholder*="ایمیل"]', 'admin@lms.com');
    await this.adminPage.type('input[name="password"], input[placeholder*="رمز"]', 'admin123');

    // کلیک روی دکمه ورود
    await this.adminPage.click('button[type="submit"], button:contains("ورود")');

    // انتظار برای redirect
    await this.adminPage.waitForTimeout(3000);

    // بررسی موفقیت ورود
    const currentUrl = this.adminPage.url();
    if (currentUrl.includes('/login')) {
      const errorMessage = await this.adminPage.$('.error, .alert-error, [role="alert"]');
      if (errorMessage) {
        const errorText = await errorMessage.textContent();
        throw new Error(`خطا در ورود ادمین: ${errorText}`);
      }
    }
  }

  // تست داشبورد پنل مدیریت
  async testAdminDashboard() {
    // اطمینان از ورود به پنل
    const currentUrl = this.adminPage.url();
    if (currentUrl.includes('/login')) {
      await this.testAdminPanelLogin();
    }

    await this.adminPage.goto(`${ADMIN_URL}/dashboard`, { waitUntil: 'networkidle2' });

    // بررسی بارگذاری آمار
    await this.adminPage.waitForSelector('.stats, .statistics, [data-testid="stats"]', { timeout: 10000 });

    // بررسی وجود کارت‌های آماری
    const statsCards = await this.adminPage.$$('.card, .stat-card');
    if (statsCards.length === 0) {
      throw new Error('کارت‌های آماری یافت نشد');
    }
  }

  // تست مدیریت کاربران در پنل ادمین
  async testAdminUserManagement() {
    await this.adminPage.goto(`${ADMIN_URL}/users`, { waitUntil: 'networkidle2' });

    // بررسی بارگذاری لیست کاربران
    await this.adminPage.waitForSelector('table, .users-list, [data-testid="users-table"]', { timeout: 10000 });

    // بررسی وجود کاربران
    const userRows = await this.adminPage.$$('tr, .user-item');
    if (userRows.length <= 1) { // حداقل header + یک کاربر
      throw new Error('کاربری در لیست یافت نشد');
    }
  }

  // تست مدیریت دوره‌ها در پنل ادمین
  async testAdminCourseManagement() {
    await this.adminPage.goto(`${ADMIN_URL}/courses`, { waitUntil: 'networkidle2' });

    // بررسی بارگذاری لیست دوره‌ها
    await this.adminPage.waitForSelector('table, .courses-list, [data-testid="courses-table"]', { timeout: 10000 });
  }

  // تست API connectivity از Frontend
  async testFrontendAPIConnectivity() {
    // تست درخواست API از Frontend
    const apiResponse = await this.frontendPage.evaluate(async (apiUrl) => {
      try {
        const response = await fetch(`${apiUrl}/health`);
        return {
          status: response.status,
          ok: response.ok,
          data: await response.json()
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    }, API_URL);

    if (apiResponse.error) {
      throw new Error(`خطا در اتصال به API از Frontend: ${apiResponse.error}`);
    }

    if (!apiResponse.ok) {
      throw new Error(`API پاسخ نامعتبر داد: ${apiResponse.status}`);
    }
  }

  // تست Performance
  async testPerformance() {
    // تست سرعت بارگذاری صفحه اصلی
    const startTime = Date.now();
    await this.frontendPage.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - startTime;

    if (loadTime > 10000) { // بیش از 10 ثانیه
      throw new Error(`صفحه اصلی خیلی کند بارگذاری شد: ${loadTime}ms`);
    }

    this.log(`⏱️ زمان بارگذاری صفحه اصلی: ${loadTime}ms`, 'info');
  }

  // تست Responsive Design
  async testResponsiveDesign() {
    // تست در اندازه‌های مختلف
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await this.frontendPage.setViewport(viewport);
      await this.frontendPage.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // بررسی عدم وجود scroll افقی
      const hasHorizontalScroll = await this.frontendPage.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      if (hasHorizontalScroll) {
        throw new Error(`Scroll افقی در ${viewport.name} وجود دارد`);
      }
    }
  }

  // پاک‌سازی
  async cleanup() {
    this.log('🧹 بستن مرورگر...', 'info');
    if (this.browser) {
      await this.browser.close();
    }
  }

  // اجرای تمام تست‌ها
  async runAllTests() {
    this.log('🚀 شروع تست‌های یکپارچگی...', 'info');
    
    const startTime = Date.now();

    try {
      // راه‌اندازی
      await this.setupBrowser();

      // تست‌های Frontend
      await this.runTest('Frontend Home Page Load', () => this.testFrontendHomePage());
      await this.runTest('Frontend Registration', () => this.testFrontendRegistration());
      await this.runTest('Frontend Login', () => this.testFrontendLogin());
      await this.runTest('Course Details View', () => this.testCourseDetails());
      await this.runTest('Frontend API Connectivity', () => this.testFrontendAPIConnectivity());

      // تست‌های Admin Panel
      await this.runTest('Admin Panel Login', () => this.testAdminPanelLogin());
      await this.runTest('Admin Dashboard', () => this.testAdminDashboard());
      await this.runTest('Admin User Management', () => this.testAdminUserManagement());
      await this.runTest('Admin Course Management', () => this.testAdminCourseManagement());

      // تست‌های Performance و UX
      await this.runTest('Performance Test', () => this.testPerformance());
      await this.runTest('Responsive Design', () => this.testResponsiveDesign());

    } finally {
      await this.cleanup();
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // نمایش نتایج
    this.displayResults(duration);
    
    // ذخیره نتایج
    this.saveResults();
  }

  // نمایش نتایج
  displayResults(duration) {
    console.log('\n' + '='.repeat(60));
    this.log('📊 نتایج تست‌های یکپارچگی', 'info');
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

    const reportPath = path.join(TEST_RESULTS_DIR, `integration-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    this.log(`📄 گزارش ذخیره شد: ${reportPath}`, 'info');
  }
}

// اجرای تست‌ها
async function main() {
  const testSuite = new IntegrationTestSuite();
  
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

module.exports = IntegrationTestSuite;


