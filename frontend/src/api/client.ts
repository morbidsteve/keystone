import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

// ---------------------------------------------------------------------------
// Axios client with timeout
// ---------------------------------------------------------------------------

const apiClient = axios.create({
  baseURL: isDemoMode
    ? '/api/v1'
    : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ---------------------------------------------------------------------------
// Request interceptor: attach JWT
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('keystone_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor: retry with exponential backoff (5xx / network errors)
// ---------------------------------------------------------------------------

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1s base

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config) return Promise.reject(error);

    config._retryCount = config._retryCount ?? 0;

    const shouldRetry = config._retryCount < MAX_RETRIES && (
      !error.response || // network error
      error.response.status >= 500 // server error
    );

    if (!shouldRetry) return Promise.reject(error);

    config._retryCount += 1;
    const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return apiClient(config);
  },
);

// ---------------------------------------------------------------------------
// Response interceptor: handle 401 (must be AFTER retry interceptor)
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('keystone_token');
      localStorage.removeItem('keystone_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Cancel token helper
// ---------------------------------------------------------------------------

export function createCancelToken() {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
}

export default apiClient;
