# گزارش رفع مشکل صفر ماندن پیشرفت دوره

**تاریخ:** 2026-06-16

## مشکل

بعد از مشاهده ویدئو، پیشرفت دوره همچنان 0٪ می‌ماند.

## علت‌های اصلی

1. پیشرفت فقط بر اساس تعداد درس‌های کامل‌شده محاسبه می‌شد؛ اگر ویدئو هنوز به 90٪ نرسیده بود، dashboard همچنان 0٪ نشان می‌داد.
2. در `getMyCourses` محاسبه progress جدا از سرویس اصلی انجام می‌شد و از watched percentage استفاده نمی‌کرد.
3. sync دوره‌ای مشاهده ویدئو اگر کاربر قبل از رسیدن به 90٪ صفحه را ترک می‌کرد، اثر قابل مشاهده‌ای در درصد کلی نداشت.

## اصلاحات انجام‌شده

### Backend

- `completionPercentage` اکنون از میانگین درصد مشاهده درس‌ها محاسبه می‌شود؛ نه فقط تعداد درس‌های complete شده.
- هر lesson می‌تواند `watchedPercentage` و `lastWatchedSeconds` داشته باشد.
- اگر درس کامل شود، درصد آن درس 100٪ حساب می‌شود.
- `getMyCourses` اکنون از `progressService.getProgress` استفاده می‌کند تا دقیقاً همان منبع حقیقت را نمایش دهد.
- `trackOnly` برای sync مشاهده بدون حذف completedLessons پشتیبانی می‌شود.

فایل‌ها:

```text
backend/src/modules/progress/progress.service.js
backend/src/modules/enrollments/enrollment.service.js
backend/src/modules/progress/progress.controller.js
backend/src/modules/enrollments/enrollment.controller.js
```

### Frontend

- VideoPlayer هر 5 ثانیه درصد مشاهده را sync می‌کند.
- وقتی ویدئو تمام شود، درس کامل می‌شود حتی اگر رویداد progress به 90٪ نرسیده باشد.
- Dashboard تب‌ها و درصدها را از `completionPercentage` واقعی backend می‌خواند.

فایل‌ها:

```text
frontend/components/course/VideoPlayer.tsx
frontend/app/dashboard/page.tsx
frontend/lib/api.ts
```

## نتیجه

حالا اگر کاربر حتی بخشی از ویدئو را ببیند، درصد پیشرفت دوره از 0٪ خارج می‌شود. اگر به 90٪ یا پایان ویدئو برسد، درس کامل حساب می‌شود.

## صحت‌سنجی

```bash
node -c server.js && find src scripts -name '*.js' -print0 | xargs -0 -n1 node -c
npm audit --audit-level=high
npm test -- --runInBand --silent
npm run build
```

همه موفق بودند.
