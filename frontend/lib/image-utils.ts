/**
 * تبدیل URL نسبی تصویر به URL کامل برای استفاده در Next.js Image component
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) {
    return '/img/cr1.webp'; // تصویر پیش‌فرض
  }

  // اگر base64 string است (شروع با data:)، همان را برگردان
  if (url.startsWith('data:')) {
    return url;
  }

  // اگر URL کامل است (شروع با http یا https)، همان را برگردان
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // اگر URL نسبی است (شروع با /)، آن را به URL کامل تبدیل کن
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = API_URL.replace('/api', ''); // حذف /api از انتهای URL
  
  // اگر URL با / شروع نمی‌شود، / اضافه کن
  const imageUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${baseUrl}${imageUrl}`;
}

