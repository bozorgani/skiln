/**
 * تبدیل URL نسبی تصویر به URL کامل برای استفاده در Next.js Image component
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) {
    return '/img/cr1.webp';
  }

  if (url.startsWith('data:')) {
    return url;
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = API_URL.replace(/\/api\/?$/, '');

  // Fix legacy records that accidentally stored /api/uploads or http://host/api/uploads.
  let normalizedUrl = url.replace('/api/uploads/', '/uploads/');

  if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
    return normalizedUrl;
  }

  const imageUrl = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
  return `${baseUrl}${imageUrl}`;
}
