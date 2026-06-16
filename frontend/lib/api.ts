import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login only if not already on login/register page
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        // Don't redirect if already on login or register page to avoid infinite loop
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please wait before making more requests.');
      // Don't redirect on rate limit, just log warning
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Public endpoints برای فرانت‌اند (بدون چک admin)
  sendCode: (phoneNumber: string) =>
    api.post('/auth/public/send-code', { phoneNumber }),
  verifyCode: (phoneNumber: string, code: string, name?: string) =>
    api.post('/auth/public/verify-code', { phoneNumber, code, name }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Courses API
export const coursesAPI = {
  getAll: (params?: {
    search?: string;
    category?: string;
    level?: string;
    page?: number;
    limit?: number;
    includeUnpublished?: string;
  }) => api.get('/courses', { params }),
  getById: (id: string) => api.get(`/courses/${id}`),
  create: (data: any) => api.post('/courses', data),
  update: (id: string, data: any) => api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
  getAnalytics: (id: string) => api.get(`/courses/${id}/analytics`),
};

// Lessons API
export const lessonsAPI = {
  getByCourse: (courseId: string) => api.get(`/courses/${courseId}/lessons`),
  getById: (id: string) => api.get(`/lessons/${id}`),
  create: (courseId: string, data: any) =>
    api.post(`/courses/${courseId}/lessons`, data),
  update: (id: string, data: any) => api.put(`/lessons/${id}`, data),
  delete: (id: string) => api.delete(`/lessons/${id}`),
};

// Payments API
export const paymentsAPI = {
  createIntent: (courseId: string, couponCode?: string) =>
    api.post('/payments/create-intent', { courseId, couponCode }),
  verify: (paymentId: string, paymentIntentId?: string) =>
    api.post('/payments/verify', { paymentId, paymentIntentId }),
  getById: (paymentId: string) => api.get(`/payments/${paymentId}`),
  getMyPayments: () => api.get('/payments/my-payments'),
  adminPurchase: (courseId: string, userId?: string) =>
    api.post('/payments/admin-purchase', { courseId, userId }),
};

// Coupons API
export const couponsAPI = {
  validate: (payload: { code: string; courseId: string; amount?: number }) =>
    api.post('/coupons/validate', payload),
};

// Enrollments API
export const enrollmentsAPI = {
  getMyCourses: () => api.get('/enrollments/my-courses'),
  enroll: (courseId: string) => api.post(`/enrollments/${courseId}`),
  getEnrollment: (courseId: string) => api.get(`/enrollments/${courseId}`),
  updateProgress: (courseId: string, lessonId: string, completed: boolean) =>
    api.put(`/enrollments/${courseId}/progress`, { lessonId, completed }),
};

// Progress API
export const progressAPI = {
  getProgress: (courseId: string) => api.get(`/progress/${courseId}`),
  updateProgress: (courseId: string, lessonId: string, completed: boolean) =>
    api.put(`/progress/${courseId}`, { lessonId, completed }),
};

// Certificates API
export const certificatesAPI = {
  download: (courseId: string) =>
    api.get(`/certificates/${courseId}`, { responseType: 'blob' }),
};

// Users API
export const usersAPI = {
  getStats: () => api.get('/users/stats'),
  updateProfile: (data: { name?: string; email?: string; avatar?: string }) =>
    api.put('/users/me', data),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
};

// Blog API
export const blogAPI = {
  getAll: (params?: {
    search?: string;
    category?: string;
    tag?: string;
    author?: string;
    sort?: string;
    page?: number;
    limit?: number;
    includeUnpublished?: string;
  }) => api.get('/blogs', { params }),
  getById: (id: string) => api.get(`/blogs/${id}`),
  create: (data: any) => api.post('/blogs', data),
  update: (id: string, data: any) => api.put(`/blogs/${id}`, data),
  delete: (id: string) => api.delete(`/blogs/${id}`),
  getCategories: () => api.get('/blogs/categories/list'),
  getTags: () => api.get('/blogs/tags/list'),
  toggleLike: (id: string) => api.post(`/blogs/${id}/like`),
};

export default api;


