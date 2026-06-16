/**
 * Centralized Token Manager
 * Manages token storage and retrieval in a consistent way
 */

import Cookies from 'js-cookie';

const TOKEN_COOKIE_NAME = 'token';
const TOKEN_STORAGE_KEY = 'token';

/**
 * Get token from storage
 * Priority: Cookie > localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try cookie first (preferred for SSR and cross-tab sync)
  let token = Cookies.get(TOKEN_COOKIE_NAME);
  
  // Fallback to localStorage if cookie is not available
  if (!token) {
    token = localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  
  return token || null;
}

/**
 * Set token in storage
 * Stores in both cookie and localStorage for redundancy
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Store in cookie (primary)
  try {
    Cookies.set(TOKEN_COOKIE_NAME, token, {
      expires: 7, // 7 days
      path: '/',
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production' // HTTPS only in production
    });
  } catch (error) {
    console.warn('[TokenManager] Failed to set cookie:', error);
  }

  // Also store in localStorage as fallback
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.warn('[TokenManager] Failed to set localStorage:', error);
  }
}

/**
 * Remove token from storage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Remove from cookie
  try {
    Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
  } catch (error) {
    console.warn('[TokenManager] Failed to remove cookie:', error);
  }

  // Remove from localStorage
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn('[TokenManager] Failed to remove localStorage:', error);
  }
}

/**
 * Check if token exists
 */
export function hasToken(): boolean {
  return getToken() !== null;
}













