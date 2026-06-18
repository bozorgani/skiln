export function getAdminImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  const normalizedUrl = url.replace('/api/uploads/', '/uploads/');

  if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
    return normalizedUrl;
  }

  const normalized = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
  return `${baseUrl}${normalized}`;
}
