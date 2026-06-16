# راهنمای استقرار Skiln LMS

این سند برای فاز Production Readiness اضافه شده و مسیر اجرای Docker، CI و تنظیمات محیطی را توضیح می‌دهد.

## اجرای محلی با Docker Compose

1. فایل env بک‌اند را بسازید:

```bash
cp backend/.env.example backend/.env
```

2. مقدارهای حساس را تغییر دهید:

```env
JWT_SECRET=یک-رشته-تصادفی-طولانی
```

3. سرویس‌ها را اجرا کنید:

```bash
docker compose up --build
```

آدرس‌ها:

- Frontend: http://localhost:3000
- Admin Panel: http://localhost:3001
- Backend API: http://localhost:5000/api
- API Docs: http://localhost:5000/api/docs
- Redis: localhost:6379
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001
- Reverse Proxy نمونه: http://localhost:8080

## نکات Production

- مقدار `JWT_SECRET` باید محرمانه و طولانی باشد.
- برای چند instance، `REDIS_URL` را فعال نگه دارید تا rate limitها بین instanceها مشترک باشند. بدون Redis سیستم به in-memory fallback می‌کند.
- در docker-compose، uploadها به صورت S3-compatible روی MinIO ذخیره می‌شوند. برای Production واقعی می‌توانید همین متغیرهای S3 را به AWS S3/Arvan/لیارا/MinIO خارجی وصل کنید. اگر `STORAGE_DRIVER=local` باشد volume `backend_uploads` استفاده می‌شود.
- پشت reverse proxy، هدرهای `X-Forwarded-*` و HTTPS را درست تنظیم کنید.
- متغیرهای `FRONTEND_URL` و `ADMIN_PANEL_URL` باید دامنه واقعی باشند.
- مسیر `/api/docs/openapi.yaml` فایل OpenAPI را ارائه می‌کند.

## CI/CD

Workflow زیر اضافه شده است:

```text
.github/workflows/ci.yml
```

این workflow سه job دارد:

1. Backend: نصب، syntax check، audit high
2. Frontend: نصب، test، build، audit high
3. Admin Panel: نصب، build، audit high

## دستورات صحت‌سنجی دستی

```bash
cd backend
npm ci
node -c server.js && find src -name '*.js' -print0 | xargs -0 -n1 node -c
npm audit --audit-level=high
```

```bash
cd frontend
npm ci
npm test -- --runInBand --silent
npm run build
npm audit --audit-level=high
```

```bash
cd admin-panel
npm ci
npm run build
npm audit --audit-level=high
```
