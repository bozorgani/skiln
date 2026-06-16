# راهنمای رفع مشکلات پنل مدیریت

## 🔴 مشکل: خطای ECONNRESET در API Gateway

### مشکل:
در terminal API Gateway، خطای زیر نمایش داده می‌شود:
```
[HPM] ECONNRESET: Error: socket hang up
```
یا
```
[HPM] ECONNRESET: Error: read ECONNRESET
```

این خطاها نشان می‌دهند که API Gateway نمی‌تواند به microservice متصل شود.

### راه حل:

1. **بررسی Services:**
   - مطمئن شوید که User Service (یا service مربوطه) در حال اجرا است
   - Health check را تست کنید: `curl http://localhost:5001/health`

2. **راه‌اندازی مجدد:**
   ```bash
   # ابتدا microservice را راه‌اندازی کنید
   cd services/user-service
   npm run dev
   
   # سپس API Gateway را راه‌اندازی کنید
   cd services/api-gateway
   npm run dev
   ```

3. **بررسی Environment Variables:**
   - مطمئن شوید که `USER_SERVICE_URL` درست تنظیم شده است
   - در `services/api-gateway/.env`: `USER_SERVICE_URL=http://localhost:5001`

4. **ترتیب راه‌اندازی:**
   - همیشه ابتدا microservices را راه‌اندازی کنید
   - سپس API Gateway را راه‌اندازی کنید

⚠️ **نکته:** این خطا خطرناک نیست و فقط نشان می‌دهد که service در دسترس نیست.

---

## 🔴 مشکل: خطای "request aborted" در User Service

### مشکل:
در terminal User Service، خطای زیر نمایش داده می‌شود:
```
Error: BadRequestError: request aborted
code: 'ECONNABORTED'
type: 'request.aborted'
```

### راه حل:

**این خطا خطرناک نیست!** این خطا زمانی رخ می‌دهد که:
- کاربر صفحه را می‌بندد
- کاربر درخواست را cancel می‌کند
- Network connection قطع می‌شود

### تغییرات انجام شده:

✅ خطاهای "request aborted" دیگر در console نمایش داده نمی‌شوند  
✅ فقط خطاهای واقعی لاگ می‌شوند  
✅ Error handling بهبود یافته است

### اگر می‌خواهید debug کنید:

می‌توانید در `services/user-service/src/server.js` این کد را اضافه کنید:
```javascript
app.use((req, res, next) => {
  req.on('aborted', () => {
    console.log('Request aborted:', req.method, req.url);
  });
  next();
});
```

⚠️ **نکته:** این خطا نمی‌تواند باعث crash شدن service شود.

---

## 🔴 مشکل: API در حالت Pending می‌ماند

### مشکل:
وقتی لاگین می‌زنید، درخواست API در حالت pending می‌ماند و هیچ پاسخی دریافت نمی‌شود.

### راه حل:

1. **بررسی Services:**
   ```bash
   # بررسی API Gateway (باید روی پورت 5000 باشد)
   curl http://localhost:5000/api/health
   
   # بررسی User Service (باید روی پورت 5001 باشد)
   curl http://localhost:5001/health
   # یا
   curl http://localhost:5001/api/health
   ```

2. **راه‌اندازی Services:**
   ```bash
   # Terminal 1 - API Gateway
   cd services/api-gateway
   npm install  # اگر dependencies نصب نشده
   npm run dev
   
   # Terminal 2 - User Service
   cd services/user-service
   npm install  # اگر dependencies نصب نشده
   npm run dev
   ```

3. **بررسی MongoDB:**
   - مطمئن شوید MongoDB در حال اجرا است
   - بررسی کنید که connection string درست است

4. **بررسی Environment Variables:**
   - در `services/api-gateway/.env`:
     ```env
     PORT=5000
     USER_SERVICE_URL=http://localhost:5001
     JWT_SECRET=your-secret-key
     ```
   - در `services/user-service/.env`:
     ```env
     PORT=5001
     MONGODB_URI=mongodb://localhost:27017/lms-bozorgani
     JWT_SECRET=your-secret-key
     ```

5. **بررسی Console:**
   - Developer Tools را باز کنید
   - در Network tab، درخواست `/api/auth/login` را بررسی کنید
   - ببینید آیا درخواست ارسال می‌شود یا نه

6. **بررسی CORS:**
   - مطمئن شوید که `ADMIN_PANEL_URL` در API Gateway تنظیم شده است:
     ```env
     ADMIN_PANEL_URL=http://localhost:3001
     ```

---

## 🔴 خطای 401 (Unauthorized)

### مشکل: `GET http://localhost:5000/api/auth/me 401 (Unauthorized)`

این خطا **طبیعی** است و زمانی رخ می‌دهد که:
- کاربر هنوز لاگین نکرده است
- Token منقضی شده است
- Token وجود ندارد

### راه حل:

1. **اگر هنوز لاگین نکرده‌اید:**
   - به صفحه `/login` بروید
   - با اطلاعات زیر وارد شوید:
     - ایمیل: `admin@lms.com`
     - رمز عبور: `admin123`

2. **اگر قبلاً لاگین کرده‌اید:**
   - Cookie را پاک کنید
   - دوباره لاگین کنید

3. **بررسی Services:**
   - مطمئن شوید API Gateway در حال اجرا است (`http://localhost:5000`)
   - مطمئن شوید User Service در حال اجرا است (`http://localhost:5001`)

---

## 🔴 خطای "شما دسترسی به پنل مدیریت ندارید"

### مشکل:
پس از لاگین، پیام خطای "شما دسترسی به پنل مدیریت ندارید" نمایش داده می‌شود.

### راه حل:

1. **بررسی نقش کاربر:**
   - مطمئن شوید که نقش کاربر شما `admin` است
   - می‌توانید از API زیر استفاده کنید:
   ```bash
   PUT http://localhost:5000/api/users/{userId}/role
   Authorization: Bearer {token}
   Content-Type: application/json
   
   {
     "role": "admin"
   }
   ```

2. **ایجاد کاربر Admin جدید:**
   - از فایل `LOGIN_INFO.md` استفاده کنید

---

## 🔴 خطای "Service temporarily unavailable"

### مشکل:
پیام خطای "Service temporarily unavailable" نمایش داده می‌شود.

### راه حل:

1. **بررسی Services:**
   ```bash
   # بررسی API Gateway
   curl http://localhost:5000/api/health
   
   # بررسی User Service
   curl http://localhost:5001/api/health
   ```

2. **راه‌اندازی Services:**
   ```bash
   # API Gateway
   cd services/api-gateway
   npm run dev
   
   # User Service
   cd services/user-service
   npm run dev
   ```

---

## 🔴 فونت فارسی نمایش داده نمی‌شود

### مشکل:
متن‌های فارسی به درستی نمایش داده نمی‌شوند.

### راه حل:

1. **بررسی اتصال اینترنت:**
   - فونت Vazirmatn از Google Fonts لود می‌شود
   - مطمئن شوید که به اینترنت متصل هستید

2. **بررسی Console:**
   - در Developer Tools، Console را بررسی کنید
   - اگر خطای CORS یا network وجود دارد، آن را رفع کنید

3. **استفاده از فونت محلی (اختیاری):**
   - می‌توانید فونت را به صورت محلی نصب کنید
   - فایل فونت را در `public/fonts` قرار دهید

---

## 🔴 صفحه سفید نمایش داده می‌شود

### مشکل:
پس از لاگین، صفحه سفید نمایش داده می‌شود.

### راه حل:

1. **بررسی Console:**
   - Developer Tools را باز کنید
   - خطاهای JavaScript را بررسی کنید

2. **بررسی Network:**
   - در Network tab، درخواست‌های API را بررسی کنید
   - مطمئن شوید که درخواست‌ها موفق هستند

3. **پاک کردن Cache:**
   ```bash
   # پاک کردن cache Next.js
   rm -rf admin-panel/.next
   npm run dev
   ```

---

## 🔴 خطای CORS

### مشکل:
خطای CORS در Console نمایش داده می‌شود.

### راه حل:

1. **بررسی CORS در API Gateway:**
   - مطمئن شوید که `ADMIN_PANEL_URL` در `.env` تنظیم شده است:
   ```env
   ADMIN_PANEL_URL=http://localhost:3001
   ```

2. **راه‌اندازی مجدد API Gateway:**
   ```bash
   cd services/api-gateway
   npm run dev
   ```

---

## 🔴 Token منقضی می‌شود

### مشکل:
پس از مدتی، token منقضی می‌شود و باید دوباره لاگین کنید.

### راه حل:

1. **افزایش زمان انقضای Token:**
   - در `.env` فایل User Service:
   ```env
   JWT_EXPIRE=30d  # به جای 7d
   ```

2. **Refresh Token (پیشنهادی):**
   - می‌توانید سیستم refresh token را پیاده‌سازی کنید

---

## 📞 درخواست کمک

اگر مشکل شما حل نشد:

1. لاگ‌های Console را بررسی کنید
2. لاگ‌های Backend را بررسی کنید
3. مطمئن شوید که تمام Services در حال اجرا هستند
4. فایل `.env` را بررسی کنید

---

**نکته:** بیشتر مشکلات با راه‌اندازی مجدد Services حل می‌شوند.

