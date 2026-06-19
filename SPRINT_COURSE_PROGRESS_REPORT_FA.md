# گزارش تکمیل حرفه‌ای پیشرفت دوره

**تاریخ:** 2026-06-16

## خلاصه

سیستم پیشرفت دوره بازبینی و تکمیل شد تا به جای محاسبه‌های ناقص/Hardcoded، یک منبع حقیقت قابل اعتماد در Backend داشته باشد.

---

## Backend

### مدل Progress کامل‌تر شد

فایل:

```text
backend/src/modules/progress/progress.model.js
```

فیلدهای جدید/تکمیل‌شده:

```js
lessonProgress: [
  {
    lessonId,
    completed,
    completedAt,
    watchedPercentage,
    lastWatchedSeconds,
    lastAccessedAt
  }
]
totalLessons
startedAt
lastAccessed
```

### سرویس Progress بازنویسی شد

فایل:

```text
backend/src/modules/progress/progress.service.js
```

قابلیت‌ها:

- canonical کردن lessonId به فرمت استاندارد:

```text
courseId-sectionIndex-lessonIndex
```

- حذف completedLessons نامعتبر/قدیمی هنگام recalculation
- جلوگیری از duplicate completed lessons
- محاسبه دقیق totalLessons از sections/lessons
- محاسبه دقیق completionPercentage
- ثبت آخرین درس دیده‌شده
- ثبت درصد مشاهده ویدئو
- ثبت زمان آخرین مشاهده
- صدور certificate هنگام 100٪ شدن

### Enrollment progress واقعی شد

فایل:

```text
backend/src/modules/enrollments/enrollment.service.js
```

در `getMyCourses` دیگر progress hardcoded نیست و از Progress واقعی خوانده می‌شود.

---

## Frontend

### VideoPlayer پیشرفت را مرحله‌ای sync می‌کند

فایل:

```text
frontend/components/course/VideoPlayer.tsx
```

رفتار جدید:

- درصد مشاهده محلی نمایش داده می‌شود.
- هر چند ثانیه `watchedPercentage` و `lastWatchedSeconds` به backend sync می‌شود.
- در 90٪ مشاهده، درس کامل‌شده ثبت می‌شود.
- تکمیل درس دیگر فقط یک boolean ساده نیست؛ اطلاعات مشاهده هم ذخیره می‌شود.

### Dashboard از داده واقعی progress استفاده می‌کند

فایل:

```text
frontend/app/dashboard/page.tsx
```

Dashboard حالا از موارد زیر استفاده می‌کند:

- `progress.totalLessons`
- `progress.completedLessons.length`
- `progress.completionPercentage`
- `progress.lastAccessed`

---

## API

Endpointهای موجود حفظ شدند ولی payload کامل‌تر شد:

```http
PUT /api/progress/:courseId
PUT /api/enrollments/:courseId/progress
```

Payload:

```json
{
  "lessonId": "courseId-0-1",
  "completed": true,
  "watchedPercentage": 100,
  "lastWatchedSeconds": 420
}
```

برای sync فقط مشاهده بدون complete:

```json
{
  "lessonId": "courseId-0-1",
  "watchedPercentage": 45,
  "lastWatchedSeconds": 180
}
```

---

## صحت‌سنجی

### Backend

```bash
node -c server.js && find src scripts -name '*.js' -print0 | xargs -0 -n1 node -c
npm audit --audit-level=high
```

نتیجه: موفق.

### Frontend

```bash
npm test -- --runInBand --silent
npm run build
```

نتیجه: موفق.

### Admin Panel

```bash
npm run build
```

نتیجه: موفق.

---

## نکته مهاجرت

برای داده‌های قدیمی، recalculation در زمان خواندن/آپدیت progress انجام می‌شود. یعنی نیاز فوری به migration دستی نیست، اما اگر دیتای زیادی دارید، بعداً می‌توان یک اسکریپت migration batch برای normalize کردن progressهای قدیمی نوشت.
