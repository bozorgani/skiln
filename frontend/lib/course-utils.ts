/**
 * محاسبه مدت زمان کل دوره از sections و lessons
 */
export function calculateCourseDuration(course: any): number {
  if (!course) {
    return 0;
  }

  // اول از sections و lessons محاسبه کن (اگر وجود داشته باشد)
  if (course.sections && Array.isArray(course.sections) && course.sections.length > 0) {
    let totalDuration = 0;
    let hasLessonDuration = false;
    
    course.sections.forEach((section: any) => {
      if (section.lessons && Array.isArray(section.lessons) && section.lessons.length > 0) {
        section.lessons.forEach((lesson: any) => {
          if (lesson.duration && typeof lesson.duration === 'number' && lesson.duration > 0) {
            totalDuration += lesson.duration;
            hasLessonDuration = true;
          }
        });
      }
    });

    // اگر از lessons محاسبه شد و عدد معتبری است، آن را برگردان
    if (hasLessonDuration && totalDuration > 0) {
      return totalDuration;
    }
  }

  // اگر از sections محاسبه نشد، از course.duration استفاده کن
  if (course.duration && typeof course.duration === 'number' && course.duration > 0) {
    return course.duration;
  }

  // در غیر این صورت 0 برگردان
  return 0;
}

/**
 * محاسبه تعداد کل درس‌ها از sections
 */
export function calculateTotalLessons(course: any): number {
  if (!course || !course.sections || !Array.isArray(course.sections)) {
    return course?.lessons?.length || 0;
  }

  let total = 0;
  course.sections.forEach((section: any) => {
    if (section.lessons && Array.isArray(section.lessons)) {
      total += section.lessons.length;
    }
  });

  return total || course?.lessons?.length || 0;
}


/**
 * قیمت‌گذاری دوره با پشتیبانی از تخفیف درصدی
 */
export function getCoursePricing(course: any): {
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  hasDiscount: boolean;
} {
  const originalPrice = Math.max(0, Number(course?.price || 0));
  const discountPercent = Math.min(100, Math.max(0, Number(course?.discountPercent || 0)));
  const finalPrice = discountPercent > 0
    ? Math.max(0, Math.round(originalPrice * (1 - discountPercent / 100)))
    : originalPrice;

  return {
    originalPrice,
    finalPrice,
    discountPercent,
    hasDiscount: originalPrice > 0 && discountPercent > 0 && finalPrice < originalPrice,
  };
}
