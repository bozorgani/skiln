/**
 * Error handling utilities for admin panel
 */

export interface ApiError {
  message: string;
  status?: number;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Extract error message from API error response
 */
export function getErrorMessage(error: any): string {
  if (!error) {
    return 'خطای نامشخص رخ داد';
  }

  // Network error
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'درخواست شما زمان زیادی طول کشید. لطفا دوباره تلاش کنید.';
  }

  // Network connection error
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return 'اتصال به سرور برقرار نشد. لطفا اتصال اینترنت خود را بررسی کنید.';
  }

  // API error response
  const response = error.response;
  
  if (response?.data) {
    // Check for validation errors
    if (response.data.errors && Array.isArray(response.data.errors)) {
      const firstError = response.data.errors[0];
      return firstError.message || firstError.field 
        ? `${firstError.field}: ${firstError.message}` 
        : response.data.message || 'خطا در اعتبارسنجی داده‌ها';
    }

    // Check for error message
    if (response.data.message) {
      return response.data.message;
    }
  }

  // HTTP status code based messages
  const status = response?.status;
  switch (status) {
    case 400:
      return 'درخواست نامعتبر است';
    case 401:
      return 'احراز هویت شما منقضی شده است. لطفا دوباره وارد شوید';
    case 403:
      return 'شما دسترسی لازم برای انجام این عملیات را ندارید';
    case 404:
      return 'منبع مورد نظر یافت نشد';
    case 429:
      return 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفا کمی صبر کنید';
    case 500:
      return 'خطای سرور رخ داد. لطفا بعدا تلاش کنید';
    case 503:
      return 'سرویس موقتا در دسترس نیست';
    default:
      return error.message || 'خطای نامشخص رخ داد';
  }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.message?.includes('timeout') ||
    !error.response
  );
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return error.response?.status === 401 || error.response?.status === 403;
}

/**
 * Format error for display
 */
export function formatError(error: any): ApiError {
  return {
    message: getErrorMessage(error),
    status: error.response?.status,
    errors: error.response?.data?.errors
  };
}

