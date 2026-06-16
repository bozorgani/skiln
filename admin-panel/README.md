# LMS Admin Panel

پنل مدیریت جداگانه برای سیستم LMS

این پنل یک Next.js application مستقل است که در ریشه پروژه قرار دارد.

## 🚀 راه‌اندازی

### 1. نصب Dependencies

```bash
cd admin-panel
npm install
```

### 2. تنظیم Environment Variables

فایل `.env.local` را در پوشه `admin-panel` ایجاد کنید:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. اجرای Development Server

```bash
npm run dev
```

پنل مدیریت روی `http://localhost:3001` اجرا می‌شود.

### 4. فونت فارسی

پنل مدیریت از فونت **Vazirmatn** برای نمایش بهتر متن‌های فارسی استفاده می‌کند. این فونت به صورت خودکار از Google Fonts لود می‌شود و نیازی به تنظیمات اضافی نیست.

## 📁 ساختار پروژه

```
admin-panel/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── courses/
│   │   ├── blog/
│   │   ├── finance/
│   │   ├── tickets/
│   │   ├── feedback/
│   │   ├── reports/
│   │   └── settings/
│   └── layout.tsx
├── components/
│   ├── layout/
│   ├── dashboard/
│   ├── users/
│   ├── courses/
│   └── common/
├── lib/
│   ├── api.ts
│   └── auth.ts
└── contexts/
    └── AuthContext.tsx
```

## 🔐 احراز هویت

پنل مدیریت از API Gateway برای احراز هویت استفاده می‌کند. فقط کاربران با نقش `admin` می‌توانند به پنل دسترسی داشته باشند.

### اطلاعات ورود پیش‌فرض

```
ایمیل: admin@lms.com
رمز عبور: admin123
```

⚠️ **هشدار:** این اطلاعات فقط برای محیط توسعه هستند. در production حتماً تغییر دهید!

برای اطلاعات بیشتر، فایل `LOGIN_INFO.md` را مطالعه کنید.

## 📝 ویژگی‌ها

- ✅ مدیریت کاربران
- ✅ مدیریت دوره‌ها و دروس
- ✅ مدیریت وبلاگ
- ✅ مدیریت پرداخت‌ها و تراکنش‌ها
- ✅ مدیریت تیکت‌های پشتیبانی
- ✅ مدیریت نظرات و بازخوردها
- ✅ گزارش‌گیری و آمار
- ✅ تنظیمات سیستم

