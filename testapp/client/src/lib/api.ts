import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

/**
 * API Client Configuration
 *
 * Configured to work with the Express backend.
 * In development, Vite proxies /api requests to the backend.
 * In production, update baseURL to point to your API server.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session-based auth
});

// Request interceptor for adding auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if using token-based auth
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

/**
 * Type-safe API request wrapper
 */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

/**
 * API endpoints
 */
export const api = {
  auth: {
    signIn: (email: string, password: string) =>
      apiRequest<{ success: boolean }>({
        method: 'POST',
        url: '/auth/signin',
        data: { email, password },
      }),

    signUp: (name: string, email: string, password: string) =>
      apiRequest<{ success: boolean }>({
        method: 'POST',
        url: '/auth/signup',
        data: { name, email, password },
      }),

    signOut: () =>
      apiRequest<{ success: boolean }>({
        method: 'POST',
        url: '/auth/signout',
      }),

    me: () =>
      apiRequest<{ user: User | null }>({
        method: 'GET',
        url: '/auth/me',
      }),
  },

  health: {
    check: () =>
      apiRequest<{ status: string; timestamp: string }>({
        method: 'GET',
        url: '/health',
      }),
  },
};

// Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export default api;
