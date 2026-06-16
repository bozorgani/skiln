# گزارش پیاده‌سازی Sprint: Contact + Reviews + Categories

**تاریخ:** 2026-06-16

## خلاصه

در این Sprint سه شکاف مهم محصولی و API تکمیل شد:

1. Contact messages واقعی
2. Reviews/Feedback واقعی
3. Categories مدیریت‌شونده برای course/blog

---

## 1) Contact Messages

### Backend

ماژول جدید:

```text
backend/src/modules/contact
```

فایل‌ها:

```text
contact.model.js
contact.service.js
contact.controller.js
contact.routes.js
```

Endpointها:

```http
POST   /api/contact/messages
GET    /api/contact/messages              admin
GET    /api/contact/messages/:id          admin
PATCH  /api/contact/messages/:id          admin
PUT    /api/contact/messages/:id          admin
DELETE /api/contact/messages/:id          admin
```

ویژگی‌ها:

- ثبت پیام از فرم تماس frontend
- rate limit اختصاصی contact
- status message:
  - new
  - read
  - replied
  - closed
- ثبت reply داخلی/ادمین
- ذخیره IP و user-agent برای audit/debug
- search text index

### Frontend

صفحه تماس به API واقعی وصل شد:

```text
frontend/app/contact/page.tsx
frontend/lib/api.ts
```

### Admin Panel

صفحه جدید مدیریت پیام‌ها:

```text
admin-panel/app/(dashboard)/contact-messages/page.tsx
```

امکانات:

- لیست پیام‌ها
- مشاهده جزئیات
- تغییر status
- ثبت پاسخ/یادداشت
- حذف پیام

---

## 2) Reviews / Feedback

### Backend

ماژول جدید:

```text
backend/src/modules/reviews
```

فایل‌ها:

```text
review.model.js
review.service.js
review.controller.js
review.routes.js
```

Endpointها:

```http
GET    /api/courses/:courseId/reviews
POST   /api/courses/:courseId/reviews       auth
GET    /api/reviews                         admin
GET    /api/reviews/course/:courseId
POST   /api/reviews/course/:courseId        auth
PUT    /api/reviews/:id/moderate            admin
PATCH  /api/reviews/:id/moderate            admin
DELETE /api/reviews/:id                     admin
```

ویژگی‌ها:

- هر کاربر برای هر دوره فقط یک review می‌تواند ثبت کند.
- ثبت review فقط برای کاربر ثبت‌نام‌شده مجاز است.
- admin/teacher برای تست/مدیریت مجاز هستند.
- review ابتدا pending است.
- admin می‌تواند approve/reject کند.
- بعد از moderation، rating دوره recalculation می‌شود.
- فیلد ratings به Course اضافه شد:

```js
ratings: {
  average,
  count
}
```

### Frontend

کامپوننت جدید:

```text
frontend/components/course/CourseReviews.tsx
```

در صفحه دوره اضافه شد:

```text
frontend/app/courses/[id]/page.tsx
```

امکانات:

- نمایش نظرات تاییدشده
- نمایش میانگین امتیاز
- ثبت نظر با ستاره و متن
- پیام مناسب برای کاربر مهمان یا ثبت‌نام‌نشده

### Admin Panel

صفحه موجود feedback به API واقعی هماهنگ شد:

```text
admin-panel/app/(dashboard)/feedback/page.tsx
```

---

## 3) Categories

### Backend

ماژول جدید:

```text
backend/src/modules/categories
```

فایل‌ها:

```text
category.model.js
category.service.js
category.controller.js
category.routes.js
```

Endpointها:

```http
GET    /api/categories?type=course|blog
POST   /api/categories              admin
GET    /api/categories/:id
PATCH  /api/categories/:id          admin
PUT    /api/categories/:id          admin
DELETE /api/categories/:id          admin
```

ویژگی‌ها:

- type: course یا blog
- slug یکتا per type
- icon/color/order/isActive
- public فقط activeها را می‌بیند
- admin با includeInactive می‌تواند inactiveها را هم ببیند

### Admin Panel

صفحه جدید:

```text
admin-panel/app/(dashboard)/categories/page.tsx
```

امکانات:

- ایجاد category
- نمایش لیست
- فعال/غیرفعال کردن
- حذف

### Admin Navigation

منوهای جدید اضافه شد:

- پیام‌ها
- دسته‌بندی‌ها

فایل:

```text
admin-panel/components/layout/AdminLayout.tsx
```

---

## 4) Validation و OpenAPI

Schemaهای جدید به Zod اضافه شد:

```text
categorySchemas
contactSchemas
reviewSchemas
```

فایل:

```text
backend/src/validations/schemas.js
```

OpenAPI هم برای مسیرهای جدید به‌روزرسانی شد:

```text
backend/openapi.yaml
```

---

## 5) CI Smoke Test

Smoke test backend توسعه یافت و حالا موارد زیر را هم پوشش می‌دهد:

- ایجاد category
- ثبت contact message
- ثبت review
- moderation review
- دریافت review تاییدشده

فایل:

```text
backend/scripts/ci-smoke-test.js
```

---

## صحت‌سنجی

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
npm audit --audit-level=high
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
npm audit --audit-level=high
```

نتیجه: موفق.

---

## قدم بعدی پیشنهادی

بعد از این Sprint، بهترین ادامه برای MVP:

1. پرداخت واقعی زرین‌پال + receipt/retry
2. Secure lesson/video access در backend
3. Certificate PDF + verify page
4. Reports/Settings واقعی در admin
