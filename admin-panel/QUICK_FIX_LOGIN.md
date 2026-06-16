# راهنمای سریع رفع مشکل Pending در لاگین

## ⚡ راه حل سریع

### مرحله 1: بررسی Services

ابتدا مطمئن شوید که تمام services در حال اجرا هستند:

```bash
# Terminal 1 - API Gateway
cd services/api-gateway
npm run dev

# Terminal 2 - User Service  
cd services/user-service
npm run dev

# Terminal 3 - MongoDB (اگر به صورت local اجرا می‌کنید)
mongod
```

### مرحله 2: بررسی Health Check

در مرورگر یا terminal، این آدرس‌ها را تست کنید:

```
http://localhost:5000/api/health
http://localhost:5001/health
یا
http://localhost:5001/api/health
```

اگر پاسخ دریافت نکردید، services در حال اجرا نیستند.

### مرحله 3: بررسی Console

1. Developer Tools را باز کنید (F12)
2. به تب Network بروید
3. دوباره لاگین کنید
4. درخواست `/api/auth/login` را بررسی کنید:
   - اگر درخواست ارسال نشده: مشکل از frontend است
   - اگر درخواست pending است: مشکل از backend است
   - اگر خطا می‌دهد: پیام خطا را بخوانید

### مرحله 4: بررسی MongoDB

مطمئن شوید MongoDB در حال اجرا است:

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl status mongod
# یا
brew services list | grep mongodb
```

### مرحله 5: بررسی Environment Variables

در `services/api-gateway/.env`:
```env
PORT=5000
USER_SERVICE_URL=http://localhost:5001
JWT_SECRET=your-secret-key-here
ADMIN_PANEL_URL=http://localhost:3001
```

در `services/user-service/.env`:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/lms-bozorgani
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
```

⚠️ **مهم:** `JWT_SECRET` باید در هر دو فایل یکسان باشد!

---

## 🔍 تشخیص مشکل

### اگر درخواست اصلاً ارسال نمی‌شود:
- مشکل از frontend است
- Console را بررسی کنید
- مطمئن شوید که `NEXT_PUBLIC_API_URL` درست تنظیم شده است

### اگر درخواست pending می‌ماند:
- مشکل از backend است
- API Gateway یا User Service در حال اجرا نیست
- MongoDB در حال اجرا نیست
- مشکل در connection string

### اگر خطای CORS می‌دهد:
- `ADMIN_PANEL_URL` در API Gateway تنظیم نشده است
- API Gateway را restart کنید

---

## ✅ تست سریع

بعد از راه‌اندازی services، این دستور را در terminal اجرا کنید:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lms.com","password":"admin123"}'
```

اگر پاسخ دریافت کردید، مشکل از frontend است.
اگر پاسخ نگرفتید، مشکل از backend است.

---

## 📞 اگر مشکل حل نشد

1. تمام لاگ‌های console را کپی کنید
2. لاگ‌های backend را بررسی کنید
3. مطمئن شوید که:
   - MongoDB در حال اجرا است
   - تمام services در حال اجرا هستند
   - پورت‌ها درست هستند (5000, 5001)
   - Environment variables درست تنظیم شده‌اند

