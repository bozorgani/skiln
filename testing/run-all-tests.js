#!/usr/bin/env node

/**
 * اسکریپت اصلی برای اجرای تمام تست‌های پروژه LMS Bozorgani
 * این فایل تمام تست‌ها را به ترتیب اجرا می‌کند و گزارش کلی تولید می‌کند
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// وارد کردن کلاس‌های تست
const APITestSuite = require('./api-test-suite');
const IntegrationTestSuite = require('./integration-test-suite');
const ErrorScenariosTestSuite = require('./error-scenarios-test');

// تنظیمات پایه
const TEST_RESULTS_DIR = './test-results';

// ایجاد پوشه نتایج تست
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

class MasterTestSuite {
  constructor() {
    this.overallResults = {
      totalSuites: 0,
      passedSuites: 0,
      failedSuites: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      suites: []
    };
  }

  // لاگ کردن با رنگ
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      header: '\x1b[35m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  // بررسی وضعیت سرویس‌ها
  async checkServices() {
    this.log('🔍 بررسی وضعیت سرویس‌ها...', 'info');
    
    const services = [
      { name: 'Backend API', url: 'http://localhost:5000/api/health' },
      { name: 'Frontend', url: 'http://localhost:3000' },
      { name: 'Admin Panel', url: 'http://localhost:3001' }
    ];

    const axios = require('axios');
    
    for (const service of services) {
      try {
        const response = await axios.get(service.url, { timeout: 5000 });
        this.log(`✅ ${service.name} در دسترس است`, 'success');
      } catch (error) {
        this.log(`❌ ${service.name} در دسترس نیست: ${error.message}`, 'error');
        this.log(`⚠️ لطفاً ${service.name} را راه‌اندازی کنید`, 'warning');
      }
    }
  }

  // اجرای یک مجموعه تست
  async runTestSuite(suiteName, TestSuiteClass) {
    this.overallResults.totalSuites++;
    this.log(`🚀 شروع ${suiteName}...`, 'header');
    
    const startTime = Date.now();
    
    try {
      const testSuite = new TestSuiteClass();
      await testSuite.runAllTests();
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      // جمع‌آوری نتایج
      this.overallResults.passedSuites++;
      this.overallResults.totalTests += testSuite.results.total;
      this.overallResults.passedTests += testSuite.results.passed;
      this.overallResults.failedTests += testSuite.results.failed;
      
      this.overallResults.suites.push({
        name: suiteName,
        status: 'PASSED',
        duration: duration,
        totalTests: testSuite.results.total,
        passedTests: testSuite.results.passed,
        failedTests: testSuite.results.failed,
        successRate: ((testSuite.results.passed / testSuite.results.total) * 100).toFixed(1)
      });
      
      this.log(`✅ ${suiteName} با موفقیت انجام شد (${duration.toFixed(2)}s)`, 'success');
      
    } catch (error) {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      this.overallResults.failedSuites++;
      this.overallResults.suites.push({
        name: suiteName,
        status: 'FAILED',
        duration: duration,
        error: error.message
      });
      
      this.log(`❌ ${suiteName} با خطا مواجه شد: ${error.message}`, 'error');
    }
  }

  // اجرای تست‌های خاص با Node.js
  async runNodeTest(testFile, testName) {
    this.overallResults.totalSuites++;
    this.log(`🚀 شروع ${testName}...`, 'header');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const child = spawn('node', [testFile], { stdio: 'inherit' });
      
      child.on('close', (code) => {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        if (code === 0) {
          this.overallResults.passedSuites++;
          this.overallResults.suites.push({
            name: testName,
            status: 'PASSED',
            duration: duration
          });
          this.log(`✅ ${testName} با موفقیت انجام شد (${duration.toFixed(2)}s)`, 'success');
        } else {
          this.overallResults.failedSuites++;
          this.overallResults.suites.push({
            name: testName,
            status: 'FAILED',
            duration: duration,
            exitCode: code
          });
          this.log(`❌ ${testName} با کد خطای ${code} خاتمه یافت`, 'error');
        }
        
        resolve();
      });
    });
  }

  // اجرای تمام تست‌ها
  async runAllTests() {
    console.log('\n' + '='.repeat(80));
    this.log('🎯 شروع تست‌های جامع پروژه LMS Bozorgani', 'header');
    console.log('='.repeat(80));
    
    const overallStartTime = Date.now();

    // بررسی سرویس‌ها
    await this.checkServices();
    
    console.log('\n' + '-'.repeat(60));
    
    // اجرای تست‌های مختلف
    await this.runTestSuite('تست‌های API', APITestSuite);
    
    console.log('\n' + '-'.repeat(60));
    
    await this.runTestSuite('تست‌های سناریوهای خطا', ErrorScenariosTestSuite);
    
    console.log('\n' + '-'.repeat(60));
    
    // تست‌های یکپارچگی (نیاز به مرورگر)
    try {
      await this.runTestSuite('تست‌های یکپارچگی', IntegrationTestSuite);
    } catch (error) {
      this.log('⚠️ تست‌های یکپارچگی نیاز به نصب Puppeteer دارند', 'warning');
      this.log('برای نصب: npm install puppeteer', 'info');
    }
    
    console.log('\n' + '-'.repeat(60));
    
    // تست‌های اضافی (اگر وجود داشته باشند)
    const additionalTests = [
      { file: './auth-flow-test.js', name: 'تست فرآیند احراز هویت' },
      { file: './payment-flow-test.js', name: 'تست فرآیند پرداخت' }
    ];
    
    for (const test of additionalTests) {
      if (fs.existsSync(test.file)) {
        await this.runNodeTest(test.file, test.name);
        console.log('\n' + '-'.repeat(60));
      }
    }

    const overallEndTime = Date.now();
    const overallDuration = (overallEndTime - overallStartTime) / 1000;

    // نمایش نتایج کلی
    this.displayOverallResults(overallDuration);
    
    // ذخیره گزارش کلی
    this.saveOverallReport(overallDuration);
    
    // خروج با کد مناسب
    process.exit(this.overallResults.failedSuites > 0 ? 1 : 0);
  }

  // نمایش نتایج کلی
  displayOverallResults(duration) {
    console.log('\n' + '='.repeat(80));
    this.log('📊 گزارش کلی تست‌ها', 'header');
    console.log('='.repeat(80));
    
    // آمار کلی
    this.log(`📦 کل مجموعه تست‌ها: ${this.overallResults.totalSuites}`, 'info');
    this.log(`✅ مجموعه‌های موفق: ${this.overallResults.passedSuites}`, 'success');
    this.log(`❌ مجموعه‌های ناموفق: ${this.overallResults.failedSuites}`, 'error');
    
    if (this.overallResults.totalTests > 0) {
      this.log(`🧪 کل تست‌ها: ${this.overallResults.totalTests}`, 'info');
      this.log(`✅ تست‌های موفق: ${this.overallResults.passedTests}`, 'success');
      this.log(`❌ تست‌های ناموفق: ${this.overallResults.failedTests}`, 'error');
      
      const overallSuccessRate = ((this.overallResults.passedTests / this.overallResults.totalTests) * 100).toFixed(1);
      this.log(`📈 درصد موفقیت کلی: ${overallSuccessRate}%`, overallSuccessRate > 90 ? 'success' : 'warning');
    }
    
    this.log(`⏱️ زمان کل اجرا: ${duration.toFixed(2)} ثانیه`, 'info');
    
    console.log('\n' + '-'.repeat(60));
    this.log('📋 جزئیات مجموعه تست‌ها:', 'info');
    console.log('-'.repeat(60));
    
    // جزئیات هر مجموعه تست
    for (const suite of this.overallResults.suites) {
      const statusIcon = suite.status === 'PASSED' ? '✅' : '❌';
      const statusColor = suite.status === 'PASSED' ? 'success' : 'error';
      
      this.log(`${statusIcon} ${suite.name}`, statusColor);
      this.log(`   ⏱️ زمان: ${suite.duration?.toFixed(2)}s`, 'info');
      
      if (suite.totalTests) {
        this.log(`   🧪 تست‌ها: ${suite.passedTests}/${suite.totalTests} (${suite.successRate}%)`, 'info');
      }
      
      if (suite.error) {
        this.log(`   ❌ خطا: ${suite.error}`, 'error');
      }
      
      console.log('');
    }
    
    console.log('='.repeat(80));
    
    // پیام نهایی
    if (this.overallResults.failedSuites === 0) {
      this.log('🎉 تمام تست‌ها با موفقیت انجام شدند!', 'success');
    } else {
      this.log('⚠️ برخی تست‌ها ناموفق بودند. لطفاً گزارش‌ها را بررسی کنید.', 'warning');
    }
  }

  // ذخیره گزارش کلی
  saveOverallReport(duration) {
    const reportData = {
      summary: {
        totalSuites: this.overallResults.totalSuites,
        passedSuites: this.overallResults.passedSuites,
        failedSuites: this.overallResults.failedSuites,
        totalTests: this.overallResults.totalTests,
        passedTests: this.overallResults.passedTests,
        failedTests: this.overallResults.failedTests,
        overallSuccessRate: this.overallResults.totalTests > 0 
          ? ((this.overallResults.passedTests / this.overallResults.totalTests) * 100).toFixed(1)
          : 'N/A',
        duration: duration,
        timestamp: new Date().toISOString()
      },
      suites: this.overallResults.suites,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    const reportPath = path.join(TEST_RESULTS_DIR, `master-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    this.log(`📄 گزارش کلی ذخیره شد: ${reportPath}`, 'info');
    
    // ایجاد گزارش HTML (اختیاری)
    this.generateHTMLReport(reportData, reportPath.replace('.json', '.html'));
  }

  // تولید گزارش HTML
  generateHTMLReport(data, htmlPath) {
    const html = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>گزارش تست‌های LMS Bozorgani</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .stat-card.success { border-left-color: #28a745; }
        .stat-card.error { border-left-color: #dc3545; }
        .stat-card.warning { border-left-color: #ffc107; }
        .suites { margin-top: 30px; }
        .suite { margin-bottom: 20px; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
        .suite.passed { background: #d4edda; border-color: #c3e6cb; }
        .suite.failed { background: #f8d7da; border-color: #f5c6cb; }
        .suite-header { font-weight: bold; margin-bottom: 10px; }
        .suite-details { font-size: 0.9em; color: #666; }
        .timestamp { text-align: center; margin-top: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>گزارش تست‌های LMS Bozorgani</h1>
            <p>تاریخ: ${new Date(data.summary.timestamp).toLocaleString('fa-IR')}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <h3>کل مجموعه تست‌ها</h3>
                <h2>${data.summary.totalSuites}</h2>
            </div>
            <div class="stat-card success">
                <h3>موفق</h3>
                <h2>${data.summary.passedSuites}</h2>
            </div>
            <div class="stat-card error">
                <h3>ناموفق</h3>
                <h2>${data.summary.failedSuites}</h2>
            </div>
            <div class="stat-card">
                <h3>زمان اجرا</h3>
                <h2>${data.summary.duration.toFixed(2)}s</h2>
            </div>
            ${data.summary.totalTests > 0 ? `
            <div class="stat-card">
                <h3>کل تست‌ها</h3>
                <h2>${data.summary.totalTests}</h2>
            </div>
            <div class="stat-card ${data.summary.overallSuccessRate > 90 ? 'success' : 'warning'}">
                <h3>درصد موفقیت</h3>
                <h2>${data.summary.overallSuccessRate}%</h2>
            </div>
            ` : ''}
        </div>
        
        <div class="suites">
            <h2>جزئیات مجموعه تست‌ها</h2>
            ${data.suites.map(suite => `
                <div class="suite ${suite.status.toLowerCase()}">
                    <div class="suite-header">
                        ${suite.status === 'PASSED' ? '✅' : '❌'} ${suite.name}
                    </div>
                    <div class="suite-details">
                        <p>⏱️ زمان اجرا: ${suite.duration?.toFixed(2)}s</p>
                        ${suite.totalTests ? `<p>🧪 تست‌ها: ${suite.passedTests}/${suite.totalTests} (${suite.successRate}%)</p>` : ''}
                        ${suite.error ? `<p style="color: #dc3545;">❌ خطا: ${suite.error}</p>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="timestamp">
            تولید شده در: ${new Date().toLocaleString('fa-IR')}
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(htmlPath, html);
    this.log(`📄 گزارش HTML ذخیره شد: ${htmlPath}`, 'info');
  }
}

// اجرای تست‌ها
async function main() {
  const masterSuite = new MasterTestSuite();
  await masterSuite.runAllTests();
}

// اجرا فقط اگر به صورت مستقیم فراخوانی شود
if (require.main === module) {
  main().catch(error => {
    console.error('❌ خطای کلی:', error.message);
    process.exit(1);
  });
}

module.exports = MasterTestSuite;


