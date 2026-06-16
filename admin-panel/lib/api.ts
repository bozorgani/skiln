import axios from 'axios';
import { getToken } from './token-manager';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 60000, // 60 seconds timeout (increased for POST requests with images)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token using centralized token manager
    const token = getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('[API Request] Token added to header:', token.substring(0, 20) + '...');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('[API Request] No token found');
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with improved error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    // Handle authentication errors
    if (status === 401) {
      import('./token-manager').then(({ removeToken }) => {
        removeToken();
      });
      // Only redirect if not already on login page and not checking auth
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthCheck = error.config?.url?.includes('/auth/me');
        
        // Don't redirect if:
        // 1. Already on login page
        // 2. This is an auth check request (will be handled by AuthContext)
        if (currentPath !== '/login' && !currentPath.startsWith('/login') && !isAuthCheck) {
          window.location.href = '/login?error=unauthorized';
        }
      }
    }
    
    // Handle forbidden errors (403)
    if (status === 403) {
      // Don't redirect on admin panel, just show error
      console.error('Access forbidden:', error.response?.data?.message);
    }
    
    // Log error for debugging (but not for expected 401s on auth check)
    if (process.env.NODE_ENV === 'development') {
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      if (!isAuthCheck || status !== 401) {
        // Safely log error with null checks
        const errorInfo: any = {
          message: error.message || 'Unknown error',
        };
        
        if (error.config) {
          errorInfo.url = error.config.url;
          errorInfo.method = error.config.method;
        }
        
        if (status !== undefined) {
          errorInfo.status = status;
        }
        
        if (error.response?.data) {
          errorInfo.responseMessage = error.response.data.message;
          errorInfo.responseData = error.response.data;
        }
        
        if (error.code) {
          errorInfo.code = error.code;
        }
        
        console.error('API Error:', errorInfo);
      }
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  // Phone-based authentication
  sendCode: (phoneNumber: string) =>
    api.post('/auth/send-code', { phoneNumber }),
  verifyCode: (phoneNumber: string, code: string, name?: string) =>
    api.post('/auth/verify-code', { phoneNumber, code, name }),
  
  // Legacy email/password (kept for backward compatibility)
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const usersAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  updateRole: (id: string, role: string) => api.put(`/users/${id}/role`, { role }),
};

export const coursesAPI = {
  getAll: (params?: any) => api.get('/courses', { params }),
  getById: (id: string, params?: any) => api.get(`/courses/${id}`, { params }),
  create: (data: any) => api.post('/courses', data),
  update: (id: string, data: any) => api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
  getAnalytics: (id: string) => api.get(`/courses/${id}/analytics`),
};

export const lessonsAPI = {
  getByCourse: (courseId: string) => api.get(`/courses/${courseId}/lessons`),
  getById: (id: string) => api.get(`/lessons/${id}`),
  create: (courseId: string, data: any) => api.post(`/courses/${courseId}/lessons`, data),
  update: (id: string, data: any) => api.put(`/lessons/${id}`, data),
  delete: (id: string) => api.delete(`/lessons/${id}`),
};

export const blogAPI = {
  getAll: (params?: any) => api.get('/posts', { params }),
  getById: (id: string) => api.get(`/posts/${id}`),
  getBySlug: (slug: string) => api.get(`/posts/slug/${slug}`),
  create: (data: any) => api.post('/posts', data),
  update: (id: string, data: any) => api.put(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  publish: (id: string, isPublished: boolean) => 
    api.put(`/posts/${id}/publish`, { isPublished }),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const paymentsAPI = {
  getAll: (params?: any) => api.get('/payments', { params }),
  getById: (id: string) => api.get(`/payments/${id}`),
  getTransactions: (params?: any) => api.get('/transactions', { params }),
  refund: (id: string) => api.post('/transactions/refund', { transactionId: id }),
};

export const ticketsAPI = {
  getAll: (params?: any) => api.get('/tickets', { params }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  updateStatus: (id: string, status: string) => 
    api.put(`/tickets/${id}/status`, { status }),
  assign: (id: string, userId: string) => 
    api.put(`/tickets/${id}/assign`, { assignedTo: userId }),
  getResponses: (ticketId: string) => api.get(`/tickets/${ticketId}/responses`),
  createResponse: (ticketId: string, data: any) => 
    api.post(`/tickets/${ticketId}/responses`, data),
};

export const reviewsAPI = {
  getAll: (params?: any) => api.get('/reviews', { params }),
  getByCourse: (courseId: string) => api.get(`/reviews/course/${courseId}`),
  moderate: (id: string, isApproved: boolean) => 
    api.put(`/reviews/${id}/moderate`, { isApproved }),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
};

export default api;

