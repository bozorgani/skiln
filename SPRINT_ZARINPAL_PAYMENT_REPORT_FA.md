# گزارش پیاده‌سازی Sprint پرداخت واقعی زرین‌پال

**تاریخ:** 2026-06-16

## خلاصه

در این Sprint پرداخت واقعی زرین‌پال، callback/verify، receipt و retry پرداخت پیاده‌سازی شد.

---

## Backend

### قابلیت‌های اضافه‌شده

1. ایجاد درخواست پرداخت زرین‌پال هنگام `create-intent` در صورت تنظیم `ZARINPAL_MERCHANT_ID`.
2. ذخیره `authority` و اطلاعات request در `payment.metadata.zarinpal`.
3. endpoint عمومی callback زرین‌پال.
4. verify پرداخت و ثبت refId.
5. ثبت‌نام خودکار کاربر در دوره بعد از verify موفق.
6. retry پرداخت برای تراکنش‌های pending/failed/cancelled.
7. receipt endpoint برای پرداخت‌های موفق.

### Endpointهای جدید

```http
GET  /api/payments/zarinpal/callback
POST /api/payments/:id/retry
GET  /api/payments/:id/receipt
```

### فایل‌های اصلی تغییرکرده

```text
backend/src/modules/payments/payment.service.js
backend/src/modules/payments/payment.controller.js
backend/src/modules/payments/payment.routes.js
backend/openapi.yaml
backend/.env.example
```

### متغیرهای env جدید

```env
ZARINPAL_MERCHANT_ID=
ZARINPAL_SANDBOX=true
ZARINPAL_AMOUNT_MULTIPLIER=10
PAYMENT_CALLBACK_BASE_URL=http://localhost:5000
```

نکته: چون قیمت‌ها در UI به تومان نمایش داده می‌شوند، مقدار پیش‌فرض `ZARINPAL_AMOUNT_MULTIPLIER=10` برای تبدیل تومان به ریال در درخواست زرین‌پال استفاده شده است.

---

## Frontend

### قابلیت‌های اضافه‌شده

1. صفحه پرداخت ناموفق حالا `paymentId` را می‌خواند.
2. دکمه «تلاش مجدد» در صورت وجود `paymentId` با API retry کار می‌کند.
3. اگر retry لینک زرین‌پال برگرداند، کاربر به صفحه پرداخت هدایت می‌شود.
4. APIهای frontend برای receipt/retry اضافه شدند.

### فایل‌های اصلی تغییرکرده

```text
frontend/lib/api.ts
frontend/app/payment/failed/page.tsx
```

---

## Flow جدید پرداخت زرین‌پال

1. کاربر در checkout پرداخت را شروع می‌کند.
2. frontend درخواست زیر را می‌زند:

```http
POST /api/payments/create-intent
```

3. backend order و payment می‌سازد.
4. backend به زرین‌پال request می‌زند.
5. frontend مقدار `zarinpalUrl` را دریافت می‌کند و کاربر را redirect می‌کند.
6. زرین‌پال بعد از پرداخت به این endpoint برمی‌گردد:

```http
GET /api/payments/zarinpal/callback?paymentId=...&Authority=...&Status=...
```

7. backend verify می‌کند.
8. در صورت موفقیت:
   - order => paid
   - payment => succeeded
   - user در course enrolled می‌شود
   - کاربر به `/payment/success?paymentId=...` برمی‌گردد
9. در صورت خطا یا لغو:
   - payment/order failed یا cancelled می‌شود
   - کاربر به `/payment/failed?paymentId=...&reason=...` برمی‌گردد

---

## صحت‌سنجی انجام‌شده

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

## نکات Production

1. مقدار `PAYMENT_CALLBACK_BASE_URL` باید دامنه backend در production باشد.
2. اگر backend پشت proxy/nginx است، مسیر callback باید public و HTTPS باشد.
3. مقدار `ZARINPAL_SANDBOX=false` برای محیط واقعی تنظیم شود.
4. واحد قیمت در دیتابیس اگر از تومان به ریال تغییر کند، باید `ZARINPAL_AMOUNT_MULTIPLIER=1` شود.
5. بهتر است webhook/logging پرداخت‌ها در مرحله بعد با audit log تکمیل شود.
