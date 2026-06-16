# اطلاعات ورود به پنل مدیریت

## 🔐 اطلاعات پیش‌فرض

پس از راه‌اندازی اولیه سیستم، می‌توانید با اطلاعات زیر وارد شوید:

### ایمیل و رمز عبور پیش‌فرض:
```
ایمیل: admin@lms.com
رمز عبور: admin123
```

⚠️ **هشدار امنیتی:** این اطلاعات فقط برای محیط توسعه هستند. حتماً در production این اطلاعات را تغییر دهید!

---

## 📝 نحوه ورود

1. به آدرس پنل مدیریت بروید:
   ```
   http://localhost:3001/login
   ```

2. اطلاعات زیر را وارد کنید:
   - **ایمیل:** `admin@lms.com`
   - **رمز عبور:** `admin123`

3. روی دکمه "ورود" کلیک کنید

4. در صورت موفقیت، به صفحه Dashboard هدایت می‌شوید

---

## 🔧 ایجاد کاربر Admin جدید

اگر کاربر admin وجود ندارد، می‌توانید یکی از روش‌های زیر را استفاده کنید:

### روش 1: استفاده از Seed Script
```bash
cd services/user-service
npm run seed
```

### روش 2: ایجاد دستی در MongoDB
```javascript
// در MongoDB shell یا Compass
db.users.insertOne({
  name: "مدیر سیستم",
  email: "admin@lms.com",
  phoneNumber: "09123456789",
  password: "$2a$10$...", // hashed password for "admin123"
  role: "admin",
  emailVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### روش 3: استفاده از API Register
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "مدیر سیستم",
  "email": "admin@lms.com",
  "phoneNumber": "09123456789",
  "password": "admin123"
}
```

سپس نقش کاربر را به admin تغییر دهید:
```bash
PUT http://localhost:5000/api/users/{userId}/role
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "admin"
}
```

---

## 🚨 مشکلات احتمالی

### مشکل: "شما دسترسی به پنل مدیریت ندارید"
**راه حل:** مطمئن شوید که نقش کاربر شما `admin` است.

### مشکل: "Authentication required"
**راه حل:** 
- مطمئن شوید که API Gateway و User Service در حال اجرا هستند
- بررسی کنید که token در cookie ذخیره شده است

### مشکل: "Invalid or expired token"
**راه حل:**
- از صفحه خارج شوید و دوباره وارد شوید
- Cookie را پاک کنید و دوباره لاگین کنید

---

## 📞 پشتیبانی

در صورت بروز مشکل، لطفاً:
1. لاگ‌های console را بررسی کنید
2. لاگ‌های backend را بررسی کنید
3. مطمئن شوید که تمام services در حال اجرا هستند

---

**نکته:** برای امنیت بیشتر، حتماً در production:
- رمز عبور قوی‌تری انتخاب کنید
- از 2FA استفاده کنید
- دسترسی‌ها را محدود کنید

