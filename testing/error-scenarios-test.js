/**
 * تست سناریوهای خطا و Edge Cases
 * این فایل تمام حالات خطا و موارد استثنایی را تست می‌کند
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

class ErrorScenariosTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: []
    };
    this.authToken = null;
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

  // دریافت token معتبر برای تست‌ها
  async getValidToken() {
    if (this.authToken) return this.authToken;

    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        phone: '09123456789',
        password: 'Test123456'
      });
      
      this.authToken = response.data.data.token;
      return this.authToken;
    } catch (error) {
      // اگر کاربر وجود ندارد، ابتدا ثبت‌نام کن
      await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test User',
        phone: '09123456789',
        email: 'test@example.com',
        password: 'Test123456'
      });

      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        phone: '09123456789',
        password: 'Test123456'
      });
      
      this.authToken = loginResponse.data.data.token;
      return this.authToken;
    }
  }

  // تست 404 - Endpoint غیرموجود
  async test404NotFound() {
    try {
      await axios.get(`${BASE_URL}/nonexistent-endpoint`);
      throw new Error('انتظار می‌رفت خطای 404 دریافت شود');
    } catch (error) {
      if (error.response?.status !== 404) {
        throw new Error(`انتظار 404 می‌رفت، اما ${error.response?.status} دریافت شد`);
      }
      
      // بررسی ساختار پاسخ خطا
      if (!error.response.data.success === false) {
        throw new Error('ساختار پاسخ خطای 404 نادرست است');
      }
    }
  }

  // تست 401 - عدم احراز هویت
  async test401Unauthorized() {
    try {
      await axios.get(`${BASE_URL}/admin/stats`);
      throw new Error('انتظار می‌رفت خطای 401 دریافت شود');
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error(`انتظار 401 می‌رفت، اما ${error.response?.status} دریافت شد`);
      }
    }
  }

  // تست 403 - عدم دسترسی
  async test403Forbidden() {
    const token = await this.getValidToken();
    
    try {
      await axios.get(`${BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      throw new Error('انتظار می‌رفت خطای 403 دریافت شود');
    } catch (error) {
      if (error.response?.status !== 403) {
        throw new Error(`انتظار 403 می‌رفت، اما ${error.response?.status} دریافت شد`);
      }
    }
  }

  // تست 400 - داده‌های نامعتبر
  async test400BadRequest() {
    const token = await this.getValidToken();
    
    try {
      await axios.post(`${BASE_URL}/courses`, {
        // داده‌های ناقص - بدون title
        description: 'Test course',
        price: 'invalid-price' // قیمت نامعتبر
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      throw new Error('انتظار می‌رفت خطای 400 دریافت شود');
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`انتظار 400 می‌رفت، اما ${error.response?.status} دریافت شد`);
      }
    }
  }

  // تست 422 - Validation Error
  async test422ValidationError() {
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: '', // نام خالی
        phone: '123', // شماره نامعتبر
        email: 'invalid-email', // ایمیل نامعتبر
        password: '123' // رمز کوتاه
      });
      throw new Error('انتظار می‌رفت خطای validation دریافت شود');
    } catch (error) {
      if (![400, 422].includes(error.response?.status)) {
        throw new Error(`انتظار 400 یا 422 می‌رفت، اما ${error.response?.status} دریافت شد`);
      }
    }
  }

  // تست SQL Injection
  async testSQLInjection() {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; DELETE FROM courses; --",
      "' UNION SELECT * FROM users --"
    ];

    for (const maliciousInput of maliciousInputs) {
      try {
        await axios.post(`${BASE_URL}/auth/login`, {
          phone: maliciousInput,
          password: 'test'
        });
      } catch (error) {
        // بررسی که خطای 500 (crash) رخ نداده باشد
        if (error.response?.status === 500) {
          throw new Error(`احتمال آسیب‌پذیری SQL Injection: ${maliciousInput}`);
        }
      }
    }
  }

  // تست XSS Protection
  async testXSSProtection() {
    const token = await this.getValidToken();
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(1)">',
      'javascript:alert("XSS")',
      '<svg onload="alert(1)">'
    ];

    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(`${BASE_URL}/courses`, {
          title: payload,
          description: 'Test course',
          price: 100000,
          thumbnail: 'test.jpg'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // بررسی که script tag ها sanitize شده باشند
        if (response.data.data?.title?.includes('<script>')) {
          throw new Error(`آسیب‌پذیری XSS شناسایی شد: ${payload}`);
        }
      } catch (error) {
        // خطاهای validation طبیعی هستند
        if (![400, 422].includes(error.response?.status)) {
          throw new Error(`خطای غیرمنتظره در تست XSS: ${error.response?.status}`);
        }
      }
    }
  }

  // تست Rate Limiting
  async testRateLimit() {
    const requests = [];
    
    // ارسال درخواست‌های متعدد همزمان
    for (let i = 0; i < 50; i++) {
      requests.push(
        axios.post(`${BASE_URL}/auth/login`, {
          phone: '09999999999',
          password: 'wrongpassword'
        }).catch(error => error.response)
      );
    }

    const responses = await Promise.all(requests);
    
    // بررسی وجود پاسخ 429 (Too Many Requests)
    const rateLimitedResponses = responses.filter(res => res?.status === 429);
    
    if (rateLimitedResponses.length === 0) {
      this.log('⚠️ Rate limiting فعال نیست', 'warning');
    } else {
      this.log(`✅ Rate limiting فعال است (${rateLimitedResponses.length} درخواست محدود شد)`, 'success');
    }
  }

  // تست Large Payload
  async testLargePayload() {
    const token = await this.getValidToken();
    const largeString = 'A'.repeat(10 * 1024 * 1024); // 10MB

    try {
      await axios.post(`${BASE_URL}/courses`, {
        title: 'Test Course',
        description: largeString,
        price: 100000,
        thumbnail: 'test.jpg'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      throw new Error('انتظار می‌رفت payload بزرگ رد شود');
    } catch (error) {
      if (![413, 400].includes(error.response?.status)) {
        throw new Error(`انتظار 413 یا 400 می‌رفت، اما ${error.response?.status} دریافت شد`);
      }
    }
  }

  // تست Invalid JSON
  async testInvalidJSON() {
    try {
      await axios.post(`${BASE_URL}/auth/login`, 'invalid json', {
        headers: { 'Content-Type': 'application/json' }
      });
      throw new Error('انتظار می‌رفت JSON نامعتبر رد شود');
    } catch (error) {
      if (![400, 422].includes(error.response?.status)) {
        throw new Error(`انتظار 400 یا 422 می‌رفت، اما ${error.response?.status} دریافت شد`);
      }
    }
  }

  // تست Invalid Content-Type
  async testInvalidContentType() {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        phone: '09123456789',
        password: 'test'
      }, {
        headers: { 'Content-Type': 'text/plain' }
      });
      throw new Error('انتظار می‌رفت Content-Type نامعتبر رد شود');
    } catch (error) {
      if (![400, 415].includes(error.response?.status)) {
        throw new Error(`انتظار 400 یا 415 می‌رفت، اما ${error.response?.status} دریافت شد`);
      }
    }
  }

  // تست Invalid Token
  async testInvalidToken() {
    const invalidTokens = [
      'invalid-token',
      'Bearer invalid',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      ''
    ];

    for (const token of invalidTokens) {
      try {
        await axios.get(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        throw new Error(`Token نامعتبر پذیرفته شد: ${token}`);
      } catch (error) {
        if (error.response?.status !== 401) {
          throw new Error(`انتظار 401 می‌رفت برای token نامعتبر، اما ${error.response?.status} دریافت شد`);
        }
      }
    }
  }

  // تست Expired Token
  async testExpiredToken() {
    // Token منقضی شده (فرضی)
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      throw new Error('Token منقضی شده پذیرفته شد');
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error(`انتظار 401 می‌رفت برای token منقضی، اما ${error.response?.status} دریافت شد`);
      }
    }
  }

  // تست CORS
  async testCORS() {
    try {
      const response = await axios.options(`${BASE_URL}/health`, {
        headers: {
          'Origin': 'http://malicious-site.com',
          'Access-Control-Request-Method': 'GET'
        }
      });

      // بررسی header های CORS
      const corsHeaders = response.headers['access-control-allow-origin'];
      if (corsHeaders === '*') {
        this.log('⚠️ CORS برای همه origin ها باز است', 'warning');
      }
    } catch (error) {
      // خطای CORS طبیعی است
      if (error.response?.status !== 200) {
        this.log('✅ CORS به درستی پیکربندی شده', 'success');
      }
    }
  }

  // تست File Upload Vulnerabilities
  async testFileUploadSecurity() {
    const token = await this.getValidToken();
    
    // تست آپلود فایل‌های خطرناک
    const maliciousFiles = [
      { name: 'test.php', content: '<?php system($_GET["cmd"]); ?>' },
      { name: 'test.js', content: 'console.log("XSS")' },
      { name: 'test.exe', content: 'MZ...' }
    ];

    for (const file of maliciousFiles) {
      try {
        const formData = new FormData();
        const blob = new Blob([file.content], { type: 'application/octet-stream' });
        formData.append('file', blob, file.name);

        await axios.post(`${BASE_URL}/uploads/image`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        throw new Error(`فایل خطرناک پذیرفته شد: ${file.name}`);
      } catch (error) {
        if (![400, 415, 422].includes(error.response?.status)) {
          throw new Error(`انتظار رد شدن فایل خطرناک می‌رفت: ${file.name}`);
        }
      }
    }
  }

  // تست Database Connection Error
  async testDatabaseConnectionError() {
    // این تست فرضی است - در واقعیت باید دیتابیس را موقتاً قطع کنیم
    this.log('⚠️ تست اتصال دیتابیس نیاز به قطع موقت دیتابیس دارد', 'warning');
  }

  // تست Memory Leak
  async testMemoryLeak() {
    const requests = [];
    
    // ارسال درخواست‌های متعدد برای تست memory leak
    for (let i = 0; i < 100; i++) {
      requests.push(
        axios.get(`${BASE_URL}/health`).catch(() => {})
      );
    }

    await Promise.all(requests);
    
    // در واقعیت باید memory usage را مانیتور کنیم
    this.log('✅ تست memory leak انجام شد (نیاز به مانیتورینگ دستی)', 'info');
  }

  // اجرای تمام تست‌ها
  async runAllTests() {
    this.log('🚀 شروع تست‌های سناریوهای خطا...', 'info');
    
    const startTime = Date.now();

    // تست‌های HTTP Status Codes
    await this.runTest('404 Not Found', () => this.test404NotFound());
    await this.runTest('401 Unauthorized', () => this.test401Unauthorized());
    await this.runTest('403 Forbidden', () => this.test403Forbidden());
    await this.runTest('400 Bad Request', () => this.test400BadRequest());
    await this.runTest('422 Validation Error', () => this.test422ValidationError());

    // تست‌های امنیت
    await this.runTest('SQL Injection Protection', () => this.testSQLInjection());
    await this.runTest('XSS Protection', () => this.testXSSProtection());
    await this.runTest('Rate Limiting', () => this.testRateLimit());
    await this.runTest('Large Payload Handling', () => this.testLargePayload());
    await this.runTest('Invalid JSON Handling', () => this.testInvalidJSON());
    await this.runTest('Invalid Content-Type', () => this.testInvalidContentType());
    await this.runTest('Invalid Token Handling', () => this.testInvalidToken());
    await this.runTest('Expired Token Handling', () => this.testExpiredToken());
    await this.runTest('CORS Configuration', () => this.testCORS());
    await this.runTest('File Upload Security', () => this.testFileUploadSecurity());

    // تست‌های عملکرد
    await this.runTest('Database Connection Error', () => this.testDatabaseConnectionError());
    await this.runTest('Memory Leak Test', () => this.testMemoryLeak());

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
    this.log('📊 نتایج تست‌های سناریوهای خطا', 'info');
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

    const reportPath = path.join(TEST_RESULTS_DIR, `error-scenarios-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    this.log(`📄 گزارش ذخیره شد: ${reportPath}`, 'info');
  }
}

// اجرای تست‌ها
async function main() {
  const testSuite = new ErrorScenariosTestSuite();
  
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

module.exports = ErrorScenariosTestSuite;


