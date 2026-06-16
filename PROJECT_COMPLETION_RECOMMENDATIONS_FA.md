# پیشنهادهای تکمیل پروژه Skiln از دید UI/UX و API

**تاریخ:** 2026-06-16

## خلاصه وضعیت فعلی

پروژه از نظر زیرساخت فنی نسبت به شروع بررسی بسیار پایدارتر شده است:

- Build فرانت‌اند و پنل ادمین پاس می‌شود.
- تست‌های فرانت‌اند پاس می‌شوند.
- Backend syntax و audit سطح high پاس می‌شود.
- Redis rate limit، MinIO/S3 storage، OpenAPI پایه، Docker/CI و smoke test اضافه شده‌اند.

اما برای کامل شدن محصول LMS در سطح production، هنوز چند شکاف محصولی و API/UI باقی مانده است.

---

## اولویت‌بندی پیشنهادی

### P0 — الزامی برای MVP قابل انتشار

#### API

1. پرداخت واقعی
   - پیاده‌سازی حداقل یک درگاه واقعی ایرانی مثل زرین‌پال.
   - endpointهای callback/verify.
   - ثبت وضعیت تراکنش، refId، authority و خطاهای درگاه.
   - idempotency برای جلوگیری از پرداخت/ثبت‌نام تکراری.

2. کنترل دسترسی درس و ویدئو در backend
   - دسترسی به lesson content و video باید در API enforce شود، نه فقط frontend.
   - فقط دانشجوی ثبت‌نام‌شده، admin/teacher، یا lesson/free section مجاز باشند.

3. یکپارچه‌سازی response و pagination
   - همه list endpointها الگوی واحد داشته باشند:
     ```json
     { "data": { "items": [], "pagination": {} } }
     ```
   - فعلاً بعضی جاها `courses`, `blogs`, `payments`, `transactions` متفاوت هستند.

4. Contact و Reviews واقعی
   - صفحه contact فعلاً بیشتر UI است؛ API تماس/پیام نیاز دارد.
   - admin feedback از `reviewsAPI` استفاده می‌کند ولی backend module کامل reviews ندارد.

5. Category/Tag مدیریت‌شونده
   - الان categories بیشتر از blog distinct یا UI ثابت هستند.
   - API CRUD برای category دوره و بلاگ لازم است.

#### UI/UX

1. پنل پرداخت کامل
   - نمایش مسیر پرداخت واقعی، وضعیت pending/failed/success.
   - امکان retry پرداخت.
   - رسید پرداخت.

2. تکمیل صفحات placeholder پنل ادمین
   - Reports
   - Settings
   - Feedback/Reviews واقعی

3. نمایش خطاهای استاندارد
   - Error stateها و empty stateها باید در همه صفحات یکسان شوند.
   - ErrorBoundary و Toast کافی است ولی باید UX یکدست شود.

---

### P1 — تکمیل محصول و افزایش کیفیت

#### API

1. Teacher workflow
   - تعیین تکلیف نقش teacher.
   - یا حذف از MVP، یا ساخت teacher dashboard/API.
   - دسترسی teacher فقط به دوره‌های خودش.

2. Certificate واقعی
   - تولید PDF واقعی.
   - template فارسی.
   - QR verification.
   - public verify page.

3. Notification system
   - اعلان ثبت‌نام، پرداخت، پاسخ تیکت، انتشار درس جدید.
   - API read/unread.

4. Audit Log
   - ثبت عملیات admin:
     - ایجاد/حذف دوره
     - تغییر نقش کاربر
     - refund
     - publish/unpublish

5. Data seed و migration
   - seed admin، categories، courses demo.
   - migration script برای schemaهای جدید مثل blog fields/payment fields.

#### UI/UX

1. Course Builder حرفه‌ای‌تر
   - Drag & drop section/lesson.
   - preview lesson.
   - upload مستقیم ویدئو/تصویر از فرم دوره.
   - نمایش وضعیت ذخیره draft.

2. Dashboard دانشجو
   - ادامه از آخرین درس.
   - نمودار پیشرفت.
   - certificate CTA.
   - payment history.

3. Admin tables
   - pagination server-side.
   - bulk actions.
   - filters/sort.
   - export CSV.

4. Blog editor
   - editor امن و حرفه‌ای.
   - preview مقاله.
   - SEO fields.
   - status draft/published/scheduled.

---

### P2 — رشد و مقیاس‌پذیری

#### API/Platform

1. Recommendation system
2. Affiliate/referral
3. Course reviews analytics
4. Advanced search با Meilisearch/Typesense
5. CDN و signed URL برای ویدئوها
6. Multi-language/i18n
7. Webhook framework برای پرداخت/notification

#### UI/UX

1. landing pages برای دسته‌ها
2. صفحه instructor profile
3. wish list
4. مقایسه دوره‌ها
5. onboarding کاربر جدید

---

## پیشنهاد endpointهای جدید

### Contact

```http
POST /api/contact/messages
GET /api/contact/messages             admin
PATCH /api/contact/messages/:id/status admin
```

### Reviews

```http
POST /api/courses/:courseId/reviews
GET /api/courses/:courseId/reviews
GET /api/reviews                       admin
PATCH /api/reviews/:id/moderate        admin
DELETE /api/reviews/:id                admin
```

### Notifications

```http
GET /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

### Categories

```http
GET /api/categories?type=course|blog
POST /api/categories                   admin
PATCH /api/categories/:id              admin
DELETE /api/categories/:id             admin
```

### Payment Gateway

```http
POST /api/payments/create-intent
GET /api/payments/zarinpal/callback
POST /api/payments/:id/retry
GET /api/payments/:id/receipt
```

### Audit Logs

```http
GET /api/audit-logs                    admin
```

---

## پیشنهاد صفحات UI جدید/تکمیلی

### Frontend

1. `/courses?category=&level=&sort=&page=` با pagination کامل.
2. `/certificates/verify/:certificateNumber`
3. `/dashboard/payments`
4. `/dashboard/certificates`
5. `/dashboard/tickets`
6. `/instructors/:id`
7. `/categories/:slug`

### Admin Panel

1. `/categories`
2. `/coupons`
3. `/notifications`
4. `/audit-logs`
5. `/payments/:id`
6. `/settings/payment`
7. `/settings/storage`
8. `/reports/sales`
9. `/reports/courses`
10. `/reports/users`

---

## پیشنهاد ترتیب اجرای بعدی

### Sprint 1

- Contact API + Admin inbox
- Reviews API + Feedback admin واقعی
- Category CRUD
- تکمیل Settings اولیه

### Sprint 2

- Zarinpal واقعی + callback/verify
- payment receipt
- payment retry
- payment history dashboard

### Sprint 3

- Secure lesson/video access
- Certificate PDF + verify page
- Teacher ownership/permissions

### Sprint 4

- Admin reports واقعی
- Audit logs
- Notification system

---

## نتیجه پیشنهادی

برای رسیدن به MVP قابل انتشار، بهتر است به ترتیب زیر ادامه دهیم:

1. Contact + Reviews + Categories
2. Payment real gateway
3. Secure lesson/video access
4. Certificate PDF/verification
5. Admin reports/settings واقعی

این مسیر بیشترین ارزش محصولی را با کمترین ریسک فنی ایجاد می‌کند.
