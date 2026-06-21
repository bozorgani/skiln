# گزارش وضعیت فعلی پروژه Skiln LMS

**آخرین بروزرسانی:** 2026-06-16

## خلاصه اجرایی

پروژه Skiln اکنون یک LMS سه‌بخشی شامل Backend، Frontend کاربران و Admin Panel است. طی چند مرحله، مشکلات اصلی Build، Payment Flow، Contact/Reviews/Categories، امنیت دسترسی درس/ویدئو، Storage، Docker/CI و پیشرفت دوره‌ها اصلاح شده‌اند.

وضعیت فعلی پروژه: **MVP پیشرفته / نزدیک به نسخه staging**

برای Production نهایی هنوز چند مورد مهم باقی مانده است، اما هسته محصول قابل اجرا، توسعه و تست است.

---

## وضعیت اجزا

### Backend

- Express + MongoDB + Mongoose
- JWT/OTP auth
- Redis-ready rate limiting
- Zod validation layer
- Contact messages API
- Reviews API
- Categories API
- Courses/Lessons API
- Payment intent + Zarinpal callback/verify + retry/receipt
- Progress tracking کامل‌تر
- Certificate base module
- Upload local/S3-compatible storage
- Secure video streaming
- OpenAPI پایه

وضعیت: **پایدار برای staging**

### Frontend

- Home page
- Course details
- Lessons/player
- Checkout
- Payment success/failed
- Dashboard
- Auth
- Blog
- Contact form واقعی
- Reviews UI
- Course progress display

وضعیت: **قابل استفاده، نیازمند polish نهایی UX**

### Admin Panel

- Dashboard
- Users
- Courses builder
- Blog
- Finance
- Tickets
- Feedback/Reviews moderation
- Contact messages inbox
- Categories management
- Settings/Reports هنوز placeholder هستند.

وضعیت: **قابل استفاده برای مدیریت محتوای اصلی، نیازمند تکمیل reports/settings**

---

## کارهای کلیدی انجام‌شده

1. رفع Build frontend/admin.
2. اصلاح hydration و hook order در کارت دوره‌ها.
3. اضافه شدن Dockerfile و docker-compose.
4. اضافه شدن Redis و MinIO در compose.
5. اضافه شدن CI با smoke test backend.
6. اضافه شدن OpenAPI پایه.
7. اضافه شدن Contact API و صفحه پیام‌ها در admin.
8. اضافه شدن Reviews API و moderation.
9. اضافه شدن Categories CRUD و UI مدیریت.
10. اضافه شدن Zarinpal payment flow، callback، verify، retry و receipt.
11. امن‌سازی lesson/video access در backend.
12. تکمیل Progress tracking با watchedPercentage و completedLessons.
13. پاکسازی فایل‌های گزارش موقت، اسکریپت‌های تست دستی قدیمی و خروجی‌های test-result.

---

## موارد باقی‌مانده برای Production

### اولویت بالا

1. تکمیل Certificate PDF و صفحه verify عمومی.
2. تکمیل Settings واقعی در Admin Panel.
3. تکمیل Reports واقعی در Admin Panel.
4. افزودن Audit Logs برای عملیات admin.
5. افزودن migration script برای normalize کردن داده‌های قدیمی:
   - thumbnail URLs
   - progress records
   - blog fields
6. تست واقعی درگاه زرین‌پال با merchant sandbox/production.

### اولویت متوسط

1. جایگزینی/ایمن‌سازی کامل React-Quill به دلیل advisoryهای moderate.
2. افزودن Playwright E2E برای frontend/admin.
3. افزودن notification system.
4. تکمیل OpenAPI برای تمام endpointها.
5. بهبود mobile UX پنل مدیریت.

### اولویت پایین

1. Advanced search با Meilisearch/Typesense.
2. CDN/signed URL برای ویدئوها.
3. Multi-language/i18n.
4. Recommendation/Affiliate.

---

## دستورات صحت‌سنجی

Backend:

```bash
cd backend
node -c server.js && find src scripts -name '*.js' -print0 | xargs -0 -n1 node -c
npm audit --audit-level=high
```

Frontend:

```bash
cd frontend
npm test -- --runInBand --silent
npm run build
```

Admin Panel:

```bash
cd admin-panel
npm run build
```

---

## اجرای لوکال پیشنهادی

زیرساخت:

```bash
docker start skiln-mongo
# یا اگر وجود ندارد:
docker run -d --name skiln-mongo -p 27017:27017 mongo:7
```

Backend:

```bash
cd backend
cp .env.example .env
npm ci
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

Admin:

```bash
cd admin-panel
cp .env.example .env.local
npm ci
npm run dev
```

---

## نتیجه

پروژه اکنون در مرحله **Staging-ready MVP** قرار دارد. هسته آموزشی، پرداخت، پیشرفت، ارتباط با کاربر، نظرها، دسته‌بندی‌ها و پنل مدیریت اصلی آماده است. برای نسخه Production، تمرکز بعدی باید روی Certificate، Reports/Settings، Audit logs، تست E2E و migration داده‌های قدیمی باشد.
