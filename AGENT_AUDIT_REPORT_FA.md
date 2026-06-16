# گزارش بررسی فنی و محصولی پروژه Skiln LMS

**تاریخ بررسی:** 2026-06-16  
**مخزن:** https://github.com/bozorgani/skiln.git  
**اجزای پروژه:** `backend`، `frontend`، `admin-panel`، `testing`

---

## 1) خلاصه مدیریتی

پروژه از نظر دامنه محصولی یک LMS نسبتاً کامل است: احراز هویت OTP، دوره/درس، پنل مدیریت، پرداخت، بلاگ، تیکت، کوپن و گواهینامه پیاده‌سازی شده‌اند. اما وضعیت قبل از اصلاحات اولیه برای Production آماده نبود، چون هر دو اپ Next.js در Build خطا داشتند.

پس از بررسی و اعمال اصلاحات اولیه:

- ✅ `backend` از نظر syntax خطای JS ندارد.
- ✅ `admin-panel` با `npm run build` موفق Build شد.
- ✅ `frontend` با `npm run build` موفق Build شد.
- ⚠️ تست‌های Jest فرانت‌اند هنوز Fail هستند و نیاز به همگام‌سازی با UI/کد فعلی دارند.
- 🔴 هر سه بخش دارای Vulnerability در dependencyها هستند؛ به‌خصوص `next` در frontend/admin و `multer@1` در backend.

---

## 2) اصلاحاتی که در این مرحله انجام شد

### Frontend

1. رفع خطای Build صفحه بلاگ:
   - مشکل: استفاده از `styled-jsx` و event handler داخل Server Component.
   - اصلاح: انتقال دکمه Share به Client Component جدید:
     - `frontend/components/blog/ShareBlogButton.tsx`
   - انتقال CSS محتوای بلاگ از `<style jsx global>` به `frontend/app/globals.css`.

2. رفع خطاهای `useSearchParams` در Next.js 15:
   - صفحات زیر با `Suspense` wrapper اصلاح شدند:
     - `frontend/app/login/page.tsx`
     - `frontend/app/register/page.tsx`
     - `frontend/app/payment/success/page.tsx`
     - `frontend/app/payment/failed/page.tsx`
   - `Header` در `frontend/app/layout.tsx` داخل `Suspense` قرار گرفت.

3. رفع خطای TypeScript در Toast:
   - `variant` می‌توانست `null` باشد.
   - اصلاح در `frontend/components/ui/toaster.tsx`.

4. اصلاح Type کاربران frontend:
   - فیلدهای واقعی Backend مثل `email`, `phone`, `_id` و نقش‌های `student | teacher | admin` اضافه شد.

5. اصلاح `next.config.js`:
   - حذف `swcMinify` که در Next.js 15 دیگر option معتبر نیست.
   - حذف `experimental.optimizeCss` چون بدون dependency `critters` باعث خطای Build می‌شد.

6. اصلاح signature فیلتر:
   - `SearchAndFilter` در callback فیلتر، فیلد `search` ارسال می‌کرد ولی type آن اجازه نمی‌داد.

### Admin Panel

1. رفع خطای Build صفحه Login:
   - `useSearchParams` با `Suspense` wrapper اصلاح شد.

2. رفع خطای TypeScript در Toast:
   - normalize کردن `variant` پیش از استفاده.

3. رفع type در `token-manager`:
   - مشکل `string | null` با `string | undefined` رفع شد.

### تنظیمات محیطی

برای مستندسازی اولیه Environment Variables فایل‌های زیر اضافه شد:

- `backend/.env.example`
- `frontend/.env.example`
- `admin-panel/.env.example`

---

## 3) نتیجه Build و تست

### Backend

```bash
node -c server.js && find src -name '*.js' -print0 | xargs -0 -n1 node -c
```

نتیجه: ✅ موفق

> نکته: اجرای کامل API نیازمند MongoDB و env واقعی است.

### Admin Panel

```bash
npm run build
```

نتیجه: ✅ موفق

### Frontend

```bash
npm run build
```

نتیجه: ✅ موفق

هشدار باقی‌مانده:

- `sitemap.ts` هنگام Build تلاش می‌کند از API لوکال دوره‌ها را fetch کند. چون Backend اجرا نبود، warning `ECONNREFUSED` ثبت شد، اما Build fail نشد.
- Tailwind درباره کلاس‌های `duration-[2s]` و `duration-[5s]` هشدار ambiguity می‌دهد.

### Frontend Tests

```bash
npm test -- --runInBand
```

نتیجه: ❌ ناموفق

علت‌های اصلی:

- تست‌ها با UI فعلی فارسی/متن‌های فعلی همگام نیستند.
- mockهای `next/navigation` ناقص‌اند، مخصوصاً `useSearchParams`.
- تست‌های `ProtectedRoute` انتظار redirect دارند ولی Component فعلی بیشتر حالت Access Denied render می‌کند.
- mock مربوط به iconهای `lucide-react` در تست PurchaseButton ناقص است.

---

## 4) یافته‌های مهم معماری و Backend

### 4.1 احراز هویت و نقش‌ها

Backend نقش‌های `admin`, `teacher`, `student` دارد، اما frontend قدیمی‌تر هنوز نقش `user` را هم فرض می‌کرد. Type اصلاح شد، ولی باید کل منطق محصولی نهایی شود:

- آیا نقش `teacher` واقعاً در محصول لازم است؟
- آیا teacher باید پنل جداگانه داشته باشد یا از admin-panel استفاده کند؟
- الان `auth(['admin', 'teacher'])` به‌خاطر منطق `requiresAdmin = roleList.includes('admin')` برای routeهایی که admin و teacher را همزمان قبول می‌کنند، عملاً client token پنل مدیریت می‌خواهد. از طرفی login پنل فقط شماره‌های admin را قبول می‌کند. پس نقش teacher در عمل ناقص است.

### 4.2 Refresh Token

در `refreshTokens`، access token جدید همیشه با `client: 'frontend'` صادر می‌شود. بنابراین refresh token ادمین می‌تواند session پنل ادمین را به frontend client تبدیل کند. باید `client` داخل refresh token ذخیره شود یا refresh endpoint client را امن و کنترل‌شده دریافت کند.

### 4.3 پرداخت‌ها

چند mismatch مهم وجود دارد:

- `createPaymentIntent` برای پرداخت تست `paymentId` را برابر `order._id` برمی‌گرداند، اما `paymentsAPI.getById` مسیر `/payments/:id` را صدا می‌زند که در Backend فقط admin مجاز است و Payment ID می‌خواهد، نه Order ID.
- `PaymentSuccessPage` انتظار `response.data.data.payment` دارد، ولی `getPaymentById` در controller داده را مستقیم در `data` برمی‌گرداند.
- Route `GET /api/payments/transactions` بعد از `GET /api/payments/:id` تعریف شده و برای GET احتمالاً با `:id = transactions` تداخل دارد. البته alias ریشه `/api/transactions` در `routes.js` وجود دارد، اما route داخلی payments بهتر است مرتب شود.
- integration واقعی Stripe/Zarinpal/Pay.ir/IDPay هنوز TODO است و در حالت mock قرار دارد.

### 4.4 Blog API

- Frontend برای blog list پارامترهایی مثل `search`, `category`, `tag`, `sort`, `limit` ارسال می‌کند، اما `blogService.listPosts` فعلاً query params را نادیده می‌گیرد.
- خروجی بعضی routeهای blog یکدست نیست: `/blogs/:idOrSlug` خروجی `{ blog }` می‌دهد ولی `/blogs/slug/:slug` خروجی مستقیم post می‌دهد.

### 4.5 Course API

- `listCourses` فقط `search`, `teacher`, `status/includeUnpublished` را اعمال می‌کند، اما frontend فیلترهای `category`, `level`, `page`, `limit` را هم ارسال می‌کند. باید pagination و فیلتر کامل اضافه شود.
- Access کنترل درس‌ها بیشتر در frontend انجام شده؛ endpoint `getLessonById` خودش enrollment/user access را جدی enforce نمی‌کند. برای ویدئو/lesson content باید Backend هم کنترل دسترسی داشته باشد.

### 4.6 File Upload و Video

- `multer@1.x` deprecated و دارای هشدار امنیتی است؛ باید به multer 2 ارتقا داده شود.
- نیاز به validation جدی‌تر MIME/type/size، اسکن فایل، و storage strategy production مثل S3/MinIO/CDN وجود دارد.

---

## 5) امنیت و Dependency Audit

خلاصه audit در زمان بررسی:

| بخش | Moderate | High | Critical | Total |
|---|---:|---:|---:|---:|
| Backend | 3 | 5 | 0 | 8 |
| Frontend | 7 | 9 | 1 | 17 |
| Admin Panel | 7 | 9 | 1 | 19 |

موارد مهم:

- `next` در frontend/admin دارای vulnerability بحرانی/بالا در نسخه فعلی نصب‌شده است؛ باید حداقل تا wanted patch همان major یا نسخه امن‌تر ارتقا یابد.
- `axios`, `js-cookie`, `postcss` نیاز به patch update دارند.
- `multer@1` باید به `multer@2` مهاجرت کند.
- `mongoose` backend patch update لازم دارد.

پیشنهاد اجرای مرحله‌ای:

1. `npm audit fix` جداگانه برای هر package.
2. Build مجدد frontend/admin.
3. smoke test API و login.
4. اگر آسیب‌پذیری Next باقی ماند، migration کنترل‌شده به نسخه امن‌تر Next.

---

## 6) وضعیت Product / UX

### نقاط قوت

- Scope محصولی خوب و نزدیک به LMS واقعی.
- پنل مدیریت صفحات اصلی لازم را دارد.
- frontend صفحات اصلی، دوره، بلاگ، داشبورد، پرداخت و auth را پوشش می‌دهد.
- طراحی بصری مدرن و فارسی/RTL در اکثر بخش‌ها رعایت شده است.

### ریسک‌های UX

- رفتار payment success ممکن است اطلاعات تراکنش را نمایش ندهد چون API mismatch دارد.
- متن‌های تست و UI با هم متفاوت‌اند؛ نشانه‌ای از drift در محصول است.
- وضعیت Loading/Error در بعضی صفحات نیاز به یک الگوی یکپارچه دارد.
- roleهای student/teacher/admin در UI باید شفاف‌تر شوند.

---

## 7) نقشه راه پیشنهادی برای تکمیل پروژه

### فاز 1 — پایدارسازی فنی، فوری

- [ ] رفع کامل test suite یا بازنویسی تست‌ها بر اساس UI فعلی.
- [ ] Update dependencyهای بحرانی.
- [ ] یکسان‌سازی response shape در Backend.
- [ ] رفع mismatch پرداخت و صفحه success.
- [ ] افزودن pagination/filter واقعی برای courses و blogs.
- [ ] اصلاح منطق role/client در auth middleware.

### فاز 2 — امنیت و Production Readiness

- [ ] OpenAPI/Swagger برای API.
- [ ] validation/sanitization ورودی‌ها با schema جدی‌تر.
- [ ] migrate multer 2 + storage production.
- [ ] rate limit اختصاصی برای OTP/auth.
- [ ] refresh token همراه client و device/session metadata.
- [ ] Docker Compose برای backend/frontend/admin/mongo/nginx.
- [ ] CI pipeline: install, lint, typecheck, build, test, audit.

### فاز 3 — تکمیل محصول LMS

- [ ] پرداخت واقعی با حداقل یک درگاه ایرانی، همراه verify callback.
- [ ] review/rating برای دوره‌ها.
- [ ] notification داخلی.
- [ ] teacher dashboard یا حذف نقش teacher از MVP.
- [ ] certificate PDF واقعی و verification عمومی.
- [ ] analytics پیشرفته دوره و فروش.

---

## 8) دستور اجرای محلی پیشنهادی

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

Admin Panel:

```bash
cd admin-panel
cp .env.example .env.local
npm ci
npm run dev
```

پورت‌ها:

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- Admin Panel: `http://localhost:3001`
