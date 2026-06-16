# گزارش Sprint: Secure Lesson/Video Access + Clean Code

**تاریخ:** 2026-06-16

## خلاصه

در این Sprint امنیت دسترسی به محتوای دوره از سمت Backend enforce شد و یک پاکسازی کد برای حذف لاگ‌های debug و endpointهای ناسازگار انجام شد.

---

## 1) Secure Lesson Access در Backend

### انجام‌شده

- دسترسی به لیست درس‌ها و جزئیات درس‌ها فقط بر اساس قوانین Backend کنترل می‌شود.
- اگر کاربر به درس دسترسی نداشته باشد، `content` و `videoUrl` از خروجی list حذف می‌شود.
- اگر کاربر مستقیماً جزئیات درس قفل‌شده را درخواست کند، backend خطای 403 می‌دهد.

### قوانین دسترسی

کاربر فقط در این حالت‌ها به محتوای درس دسترسی دارد:

1. دوره رایگان باشد.
2. lesson رایگان باشد.
3. section رایگان باشد.
4. کاربر در دوره ثبت‌نام کرده باشد.
5. کاربر admin باشد.
6. کاربر teacher مالک دوره باشد.
7. paid order معتبر برای کاربر وجود داشته باشد.

### فایل‌های اصلی

```text
backend/src/modules/courses/course.service.js
backend/src/modules/courses/course.controller.js
backend/src/modules/courses/course.routes.js
```

---

## 2) جلوگیری از Leak شدن لینک ویدئو در Course Detail

صفحه جزئیات دوره قبلاً می‌توانست sections/lessons را همراه با `content` برگرداند. اکنون برای کاربران غیرمجاز، محتوای ویدئو از response حذف می‌شود.

---

## 3) Secure Video Streaming

### انجام‌شده

- route ویدئوها دیگر public ساده نیست.
- برای هر فایل ویدئو، backend بررسی می‌کند این فایل به کدام lesson/course مربوط است.
- اگر ویدئو متعلق به درس قفل‌شده باشد، فقط کاربران مجاز اجازه stream دارند.
- HEAD و GET هر دو کنترل دسترسی دارند.
- CORS برای video streaming همچنان با credentials پشتیبانی می‌شود.

### فایل‌های اصلی

```text
backend/src/modules/uploads/video-stream.routes.js
backend/src/modules/uploads/video-stream.controller.js
frontend/components/course/VideoPlayer.tsx
```

در frontend برای پخش ویدئو، `crossOrigin='use-credentials'` اضافه شد تا cookie auth در درخواست video ارسال شود.

---

## 4) پشتیبانی از S3/MinIO در Streaming

Storage abstraction تکمیل‌تر شد:

- local و S3 هر دو از طریق backend proxy قابل stream هستند.
- ویدئوهای S3 دیگر نیازمند public URL مستقیم نیستند.
- image proxy هم اضافه شد تا در حالت S3 private، تصاویر از backend قابل دریافت باشند.

### فایل‌های اصلی

```text
backend/src/services/storage.service.js
backend/src/modules/uploads/upload.controller.js
backend/src/app.js
```

در docker-compose، MinIO bucket دیگر anonymous public download نمی‌شود.

---

## 5) Clean Code و حذف لاگ‌های Debug

### انجام‌شده

- `console.log` و `console.warn`های debug از frontend/admin/backend حذف شدند.
- لاگ‌های ساختاری backend از logger مرکزی باقی ماندند.
- endpoint ناسازگار legacy در مسیر `/courses/[id]/lesson/[lessonId]` اصلاح شد.
- APIهای lesson در frontend/admin با مسیر backend هماهنگ شدند.

### فایل‌های اصلاح‌شده نمونه

```text
frontend/components/course/VideoPlayer.tsx
frontend/app/courses/[id]/lessons/[lessonId]/page.tsx
frontend/app/courses/[id]/lesson/[lessonId]/page.tsx
frontend/lib/api.ts
admin-panel/lib/api.ts
admin-panel/contexts/AuthContext.tsx
```

---

## 6) صحت‌سنجی

### Backend

```bash
node -c server.js && find src scripts -name '*.js' -print0 | xargs -0 -n1 node -c
npm audit --audit-level=high
```

نتیجه: موفق، 0 high vulnerability.

### Frontend

```bash
npm test -- --runInBand --silent
npm run build
```

نتیجه:

```text
Test Suites: 7 passed, 7 total
Tests: 93 passed, 93 total
Build: passed
```

### Admin Panel

```bash
npm run build
```

نتیجه: موفق.

---

## نکات باقی‌مانده

1. برای امنیت کامل ویدئو در production بهتر است signed URL کوتاه‌مدت یا session-based streaming token هم اضافه شود.
2. بهتر است audit log برای مشاهده/دانلود محتواهای حساس اضافه شود.
3. در مرحله بعد می‌توان Certificate PDF و verify page را پیاده‌سازی کرد.
