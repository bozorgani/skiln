# 🧪 مجموعه تست‌های جامع LMS Bozorgani

این پوشه شامل تمام تست‌های خودکار پروژه LMS Bozorgani است که برای اطمینان از کیفیت و عملکرد صحیح سیستم طراحی شده‌اند.

## 📋 فهرست تست‌ها

### 1. تست‌های API (`api-test-suite.js`)
- ✅ تست تمام endpoint های API
- ✅ تست احراز هویت (ثبت‌نام، ورود، خروج)
- ✅ تست CRUD عملیات (دوره‌ها، کاربران، تیکت‌ها)
- ✅ تست سیستم پرداخت
- ✅ تست آپلود فایل
- ✅ تست امنیت (SQL Injection, XSS)

### 2. تست‌های یکپارچگی (`integration-test-suite.js`)
- ✅ تست ارتباط Frontend و Backend
- ✅ تست فرآیندهای کاربری (ثبت‌نام، ورود، خرید)
- ✅ تست پنل مدیریت
- ✅ تست Responsive Design
- ✅ تست Performance

### 3. تست‌های سناریوهای خطا (`error-scenarios-test.js`)
- ✅ تست HTTP Status Codes (404, 401, 403, 400, 422)
- ✅ تست امنیت (SQL Injection, XSS, CSRF)
- ✅ تست Rate Limiting
- ✅ تست Invalid Input
- ✅ تست File Upload Security

### 4. اسکریپت اصلی (`run-all-tests.js`)
- ✅ اجرای تمام تست‌ها به ترتیب
- ✅ تولید گزارش جامع (JSON + HTML)
- ✅ بررسی وضعیت سرویس‌ها

## 🚀 نصب و راه‌اندازی

### 1. نصب Dependencies

```bash
cd testing
npm install
```

### 2. راه‌اندازی سرویس‌ها

قبل از اجرای تست‌ها، مطمئن شوید که تمام سرویس‌ها در حال اجرا هستند:

```bash
# Backend API (پورت 5000)
cd backend
npm run dev

# Frontend (پورت 3000)
cd frontend
npm run dev

# Admin Panel (پورت 3001)
cd admin-panel
npm run dev
```

### 3. اجرای تست‌ها

#### اجرای تمام تست‌ها:
```bash
npm test
# یا
node run-all-tests.js
```

#### اجرای تست‌های جداگانه:
```bash
# فقط تست‌های API
npm run test:api

# فقط تست‌های یکپارچگی
npm run test:integration

# فقط تست‌های خطا
npm run test:errors
```

## 📊 گزارش‌ها

تمام گزارش‌ها در پوشه `test-results/` ذخیره می‌شوند:

- `master-test-report-[timestamp].json` - گزارش کلی JSON
- `master-test-report-[timestamp].html` - گزارش کلی HTML
- `api-test-report-[timestamp].json` - گزارش تست‌های API
- `integration-test-report-[timestamp].json` - گزارش تست‌های یکپارچگی
- `error-scenarios-report-[timestamp].json` - گزارش تست‌های خطا
- `error-[test-name]-[timestamp].png` - اسکرین‌شات خطاها

## 🔧 تنظیمات

### متغیرهای محیطی

می‌توانید URL های سرویس‌ها را تغییر دهید:

```bash
export API_URL=http://localhost:5000/api
export FRONTEND_URL=http://localhost:3000
export ADMIN_URL=http://localhost:3001
```

### تنظیمات Puppeteer

برای تست‌های یکپارچگی، Puppeteer استفاده می‌شود. می‌توانید تنظیمات آن را تغییر دهید:

```javascript
// در integration-test-suite.js
this.browser = await puppeteer.launch({
  headless: false, // برای دیدن تست‌ها
  slowMo: 100,     // کند کردن برای مشاهده بهتر
  args: ['--no-sandbox']
});
```

## 📝 نوشتن تست جدید

### مثال تست API:

```javascript
async testNewFeature() {
  const response = await axios.post(`${BASE_URL}/new-endpoint`, {
    data: 'test'
  });
  
  if (response.status !== 201) {
    throw new Error(`Expected 201, got ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Response not successful');
  }
}

// اضافه کردن به runAllTests
await this.runTest('New Feature Test', () => this.testNewFeature());
```

### مثال تست یکپارچگی:

```javascript
async testNewUIFeature() {
  await this.frontendPage.goto(`${FRONTEND_URL}/new-page`);
  
  await this.frontendPage.waitForSelector('.new-element');
  
  const element = await this.frontendPage.$('.new-element');
  if (!element) {
    throw new Error('New element not found');
  }
}
```

## 🐛 رفع مشکلات

### مشکلات رایج:

#### 1. خطای "ECONNREFUSED"
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```
**راه حل:** مطمئن شوید Backend API در حال اجرا است.

#### 2. خطای Puppeteer
```
Error: Failed to launch the browser process
```
**راه حل:** 
```bash
# نصب مجدد Puppeteer
npm install puppeteer --force

# یا استفاده از Chrome موجود در سیستم
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

#### 3. خطای Timeout
```
Error: Test timeout after 30000ms
```
**راه حل:** افزایش timeout یا بررسی عملکرد سرویس‌ها.

### لاگ‌های Debug:

برای فعال کردن لاگ‌های بیشتر:

```bash
DEBUG=true npm test
```

## 📈 CI/CD Integration

### GitHub Actions:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test
        working-directory: testing
```

### Docker:

```dockerfile
FROM node:18
WORKDIR /app
COPY testing/ .
RUN npm install
CMD ["npm", "test"]
```

## 📚 مستندات اضافی

- [راهنمای تست API](./docs/api-testing-guide.md)
- [راهنمای تست یکپارچگی](./docs/integration-testing-guide.md)
- [بهترین روش‌های تست](./docs/testing-best-practices.md)

## 🤝 مشارکت

برای اضافه کردن تست جدید:

1. تست را در فایل مناسب اضافه کنید
2. مطمئن شوید که تست قابل تکرار است
3. گزارش خطاهای واضح ارائه دهید
4. مستندات را به‌روزرسانی کنید

## 📞 پشتیبانی

در صورت مشکل در اجرای تست‌ها:

1. لاگ‌های کامل را بررسی کنید
2. وضعیت سرویس‌ها را چک کنید
3. گزارش‌های HTML را مطالعه کنید
4. Issue جدید در پروژه ایجاد کنید

---

**نکته:** این تست‌ها برای اطمینان از کیفیت کد طراحی شده‌اند. لطفاً قبل از هر commit، تست‌ها را اجرا کنید.


