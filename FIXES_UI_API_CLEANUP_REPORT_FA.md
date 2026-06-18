# گزارش رفع ایرادهای UI/API و Clean Code

**تاریخ:** 2026-06-16

## موارد رفع‌شده

### 1) نمایش دسته‌بندی‌های ساخته‌شده در فرم دوره

در فرم ایجاد/ویرایش دوره، فیلد دسته‌بندی از input ساده به select متصل به API تبدیل شد.

فایل‌ها:

```text
admin-panel/app/(dashboard)/courses/new/page.tsx
admin-panel/app/(dashboard)/courses/[id]/edit/page.tsx
```

اکنون دسته‌بندی‌های type=course از endpoint زیر خوانده می‌شوند:

```http
GET /api/categories?type=course&includeInactive=true
```

---

### 2) فیلد تخفیف دوره در Backend و Admin UI

فیلد جدید `discountPercent` به مدل دوره و validation اضافه شد.

فایل‌ها:

```text
backend/src/modules/courses/course.model.js
backend/src/modules/courses/course.service.js
backend/src/validations/schemas.js
admin-panel/app/(dashboard)/courses/new/page.tsx
admin-panel/app/(dashboard)/courses/[id]/edit/page.tsx
```

در پرداخت، قیمت نهایی به شکل زیر محاسبه می‌شود:

```text
finalPrice = price - discountPercent%
```

فایل:

```text
backend/src/modules/payments/payment.service.js
```

در frontend نیز کارت‌های دوره و صفحه دوره قیمت تخفیف‌خورده را نمایش می‌دهند.

---

### 3) حذف alert ساده ایجاد دوره

پیام موفقیت ایجاد دوره از alert ساده به toast استاندارد پنل مدیریت تبدیل شد.

فایل:

```text
admin-panel/app/(dashboard)/courses/new/page.tsx
```

---

### 4) مشکل نمایش تصویر دوره

Storage URLها از سمت backend به proxy URL استاندارد `/uploads/...` برگشته و image proxy نیز برای S3/private storage اضافه شده بود. در این مرحله مسیرهای نمایش با همان URL استاندارد تثبیت شدند.

فایل‌های مرتبط:

```text
backend/src/services/storage.service.js
backend/src/modules/uploads/upload.controller.js
frontend/lib/image-utils.ts
```

---

### 5) خطای order of Hooks در CourseCarouselSection

علت خطا این بود که component قبل از اجرای تمام hookها در حالت courses.length=0 مقدار null برمی‌گرداند.

این مورد اصلاح شد و return شرطی بعد از hookها قرار گرفت.

فایل:

```text
frontend/components/common/CourseCarouselSection.tsx
```

---

### 6) Clean Code قوی‌تر

- لاگ‌های debug حذف شدند.
- warningهای Tailwind مربوط به duration arbitrary حذف شد.
- endpoint legacy درس‌ها اصلاح شد.
- دسترسی ویدئو و lesson از backend enforce شد.
- S3/MinIO streaming از backend proxy امن‌تر شد.

---

## صحت‌سنجی

### Backend

```bash
node -c server.js && find src scripts -name '*.js' -print0 | xargs -0 -n1 node -c
npm audit --audit-level=high
```

نتیجه: موفق.

### Frontend

```bash
npm test -- --runInBand --silent
npm run build
```

نتیجه: موفق، 93 تست پاس شد.

### Admin Panel

```bash
npm run build
```

نتیجه: موفق.
