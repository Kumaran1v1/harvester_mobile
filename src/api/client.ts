import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { BASE_URL } from '../config/env';
import { storage } from '../services/storage';

let inMemoryToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export const getAuthToken = () => inMemoryToken;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 35000, // 35 seconds to allow cloud server cold starts
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach Bearer token to outgoing requests with synchronous fast-path
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = inMemoryToken;
    if (!token) {
      token = await storage.getToken();
      if (token) inMemoryToken = token;
    }
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with automatic retry on server cold-start / network glitch
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as any;
    if (!config) return Promise.reject(error);

    // Auto-retry up to 2 times for cold starts / network timeouts
    config.__retryCount = config.__retryCount || 0;
    const isTimeoutOrServerWakeup =
      error.code === 'ECONNABORTED' ||
      !error.response ||
      (error.response.status >= 502 && error.response.status <= 504);

    if (isTimeoutOrServerWakeup && config.__retryCount < 2) {
      config.__retryCount += 1;
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1500));
      return apiClient(config);
    }

    if (error.response?.status === 401) {
      inMemoryToken = null;
      await storage.clear();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
