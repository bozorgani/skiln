# رفع خطای Text Index

## مشکل
خطای `language override unsupported: Persian` زمانی رخ می‌دهد که MongoDB یک text index با language override می‌سازد و فیلد `language` با مقدار "Persian" را به عنوان language override تفسیر می‌کند.

## راه حل

### روش 1: اجرای اسکریپت خودکار (پیشنهادی)

```bash
cd backend
npm run fix-course-index
```

این اسکریپت:
1. تمام index های text قدیمی را حذف می‌کند
2. یک index جدید با `default_language: 'none'` ایجاد می‌کند

### روش 2: حذف دستی Index

اگر اسکریپت کار نکرد، می‌توانید دستی index را حذف کنید:

```bash
# اتصال به MongoDB
mongosh mongodb://localhost:27017/lms-bozorgani

# حذف index های text
db.courses.dropIndex("title_text_description_text")
# یا اگر نام دیگری دارد:
db.courses.getIndexes()  # برای دیدن لیست index ها

# خارج شدن از MongoDB
exit
```

سپس سرور را ری‌استارت کنید تا index جدید با تنظیمات صحیح ایجاد شود.

## بررسی

پس از اجرای اسکریپت یا حذف index، می‌توانید index ها را بررسی کنید:

```bash
mongosh mongodb://localhost:27017/lms-bozorgani
db.courses.getIndexes()
```

باید یک index با نام `title_description_text` و `default_language: 'none'` ببینید.

## نکته

اگر هنوز مشکل دارید:
1. مطمئن شوید که MongoDB در حال اجرا است
2. بررسی کنید که URI در `.env` درست است
3. سرور را ری‌استارت کنید


