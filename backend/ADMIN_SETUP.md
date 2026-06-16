# راهنمای تنظیم شماره‌های Admin

برای دسترسی به پنل مدیریت، باید شماره تلفن‌های مجاز را در **دیتابیس** تنظیم کنید.

## روش 1: استفاده از API (توصیه می‌شود)

بعد از ورود به پنل مدیریت، می‌توانید از API زیر استفاده کنید:

### افزودن شماره Admin جدید:
```bash
POST /api/auth/admin-phones
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "09123456789",
  "name": "مدیر سیستم"
}
```

### مشاهده لیست شماره‌های Admin:
```bash
GET /api/auth/admin-phones
Authorization: Bearer <token>
```

### به‌روزرسانی شماره Admin:
```bash
PATCH /api/auth/admin-phones/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "نام جدید",
  "isActive": true
}
```

### حذف شماره Admin:
```bash
DELETE /api/auth/admin-phones/:id
Authorization: Bearer <token>
```

## روش 2: استفاده از MongoDB Shell

می‌توانید مستقیماً در دیتابیس MongoDB یک شماره admin اضافه کنید:

```javascript
use your_database_name

db.adminphones.insertOne({
  phone: "09123456789",
  name: "مدیر سیستم",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## نحوه کار

1. شماره‌های admin در **دیتابیس** ذخیره می‌شوند (collection: `adminphones`)
2. وقتی کاربری با شماره admin ثبت‌نام می‌کند، به صورت خودکار نقش `admin` می‌گیرد
3. اگر کاربری قبلاً با نقش `student` ثبت‌نام کرده باشد و شماره‌اش در لیست admin ها باشد، نقشش به `admin` به‌روزرسانی می‌شود
4. فقط کاربران با نقش `admin` می‌توانند به پنل مدیریت دسترسی داشته باشند
5. لیست شماره‌های admin به مدت 5 دقیقه cache می‌شود برای بهبود عملکرد

## ساختار Collection در MongoDB

```javascript
{
  _id: ObjectId("..."),
  phone: "09123456789",        // شماره تلفن (unique, indexed)
  name: "مدیر سیستم",          // نام (اختیاری)
  isActive: true,              // فعال/غیرفعال
  addedBy: ObjectId("..."),    // کاربری که اضافه کرده (اختیاری)
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

## نکات مهم

- شماره‌ها باید با فرمت `09xxxxxxxxx` (11 رقم) باشند
- شماره‌ها به صورت خودکار normalize می‌شوند
- فقط شماره‌های با `isActive: true` در نظر گرفته می‌شوند
- بعد از تغییرات، cache به صورت خودکار پاک می‌شود

