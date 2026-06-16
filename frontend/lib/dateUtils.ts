/**
 * Format date to relative time in Persian
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'همین الان';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} دقیقه پیش`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ساعت پیش`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} روز پیش`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ماه پیش`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} سال پیش`;
}

/**
 * Format date to Persian date string
 */
export function formatPersianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  
  // Simple conversion (for better accuracy, use a Persian date library)
  const year = d.getFullYear();
  const month = persianMonths[d.getMonth()];
  const day = d.getDate();
  
  return `${day} ${month} ${year}`;
}

