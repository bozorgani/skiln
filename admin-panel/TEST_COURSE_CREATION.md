# راهنمای تست ایجاد دوره

این فایل راهنمای استفاده از اسکریپت تست برای ایجاد دوره است.

## روش 1: استفاده از اسکریپت ساده

### مرحله 1: دریافت Token
در مرورگر، Console را باز کنید و این دستور را اجرا کنید:
```javascript
localStorage.getItem('token')
```

یا از Cookie:
```javascript
document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
```

### مرحله 2: اجرای تست
```bash
cd admin-panel
node test-create-course-simple.mjs YOUR_TOKEN_HERE
```

یا با environment variable:
```bash
# Windows PowerShell
$env:TEST_TOKEN="YOUR_TOKEN_HERE"; node test-create-course-simple.mjs

# Windows CMD
set TEST_TOKEN=YOUR_TOKEN_HERE && node test-create-course-simple.mjs

# Linux/Mac
TEST_TOKEN=YOUR_TOKEN_HERE node test-create-course-simple.mjs
```

## روش 2: استفاده از curl

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "دوره تست",
    "description": "توضیحات دوره",
    "shortDescription": "خلاصه",
    "thumbnail": "https://via.placeholder.com/800x600",
    "price": 50000,
    "category": "General",
    "level": "Beginner",
    "duration": 120,
    "isPublished": false
  }'
```

## بررسی لاگ‌ها

بعد از اجرای تست، لاگ‌های زیر را بررسی کنید:

### در Terminal API Gateway:
- `[conditionalAuthForCourses] POST request detected`
- `[validateToken] Token validated successfully`
- `[onProxyReq] Forwarding user info`

### در Terminal LMS Service:
- `[Body Parser] Received body size: X KB`
- `[LMS Service] POST /api/courses`
- `[createCourse] Request received`
- `[createCourse] Course created successfully`

## عیب‌یابی

### اگر خطای `ECONNRESET` دریافت کردید:
1. بررسی کنید که LMS Service در حال اجرا است
2. بررسی کنید که Database متصل است
3. لاگ‌های LMS Service را بررسی کنید

### اگر خطای `401 Unauthorized` دریافت کردید:
1. بررسی کنید که token معتبر است
2. بررسی کنید که token منقضی نشده است
3. دوباره login کنید و token جدید بگیرید

### اگر خطای `403 Forbidden` دریافت کردید:
1. بررسی کنید که user role شما `admin` یا `teacher` است
2. بررسی کنید که token شامل role درست است

## داده‌های تست

می‌توانید داده‌های تست را در فایل `test-create-course-simple.mjs` تغییر دهید.






