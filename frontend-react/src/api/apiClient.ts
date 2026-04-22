import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Match the angular proxy configuration which likely proxies /api to the API Gateway
export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // We fetch token from Zustand store directly
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // If token expired, we could try to refresh or just logout
      // For now we map Angular's typical behavior which is to logout or refresh
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
