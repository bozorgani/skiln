/**
 * تست سریع برای بررسی ساختار فایل‌های تست
 * این تست فقط ساختار کد را بررسی می‌کند بدون نیاز به Backend
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 در حال بررسی فایل‌های تست...\n');

// لیست فایل‌های تست
const testFiles = [
  'api-test-suite.js',
  'integration-test-suite.js',
  'error-scenarios-test.js',
  'auth-flow-test.js',
  'run-all-tests.js'
];

let allTestsValid = true;

testFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    try {
      // بررسی که فایل قابل import است
      require(`./${file}`);
      console.log(`✅ ${file} - ساختار صحیح`);
    } catch (error) {
      console.log(`❌ ${file} - خطا: ${error.message}`);
      allTestsValid = false;
    }
  } else {
    console.log(`❌ ${file} - فایل یافت نشد`);
    allTestsValid = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allTestsValid) {
  console.log('✅ همه فایل‌های تست ساختار صحیح دارند!');
  console.log('\n📝 برای اجرای تست‌های واقعی:');
  console.log('   1. Backend را راه‌اندازی کنید: cd ../backend && npm run dev');
  console.log('   2. سپس تست‌ها را اجرا کنید: npm test');
} else {
  console.log('⚠️ برخی فایل‌ها مشکل دارند');
  process.exit(1);
}

console.log('='.repeat(60));


