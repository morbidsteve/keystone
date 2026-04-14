import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ---------------------------------------------------------------------------
// Axios client with timeout
// ---------------------------------------------------------------------------

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ---------------------------------------------------------------------------
// Response interceptor: normalize {data: T} wrapper for non-auth endpoints
// and deep-convert snake_case keys to camelCase
// ---------------------------------------------------------------------------

function toCamel(s: string): string {
  return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function camelizeKeys(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(camelizeKeys);
  if (
    input &&
    typeof input === 'object' &&
    (input as object).constructor === Object
  ) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[/^[a-z]+(_[a-z0-9]+)+$/.test(k) ? toCamel(k) : k] = camelizeKeys(v);
    }
    return out;
  }
  return input;
}

apiClient.interceptors.response.use((response) => {
  const url = response.config.url || '';
  // Skip auth/login — it has its own response shape
  if (url.includes('/auth/login')) return response;

  // If response is already wrapped in {data: ...}, leave it
  if (response.data && typeof response.data === 'object' && !Array.isArray(response.data) && 'data' in response.data) {
    response.data = camelizeKeys(response.data);
    return response;
  }

  // Wrap raw responses
  response.data = { data: response.data };
  response.data = camelizeKeys(response.data);
  return response;
});

// ---------------------------------------------------------------------------
// Request interceptor: attach JWT and convert any camelCase keys in request
// bodies to snake_case so the backend (which expects snake_case payloads)
// can deserialize them. This pairs with the response-side camelizer above.
// /auth/login is exempt to preserve the literal { username, password } shape.
// ---------------------------------------------------------------------------

function toSnake(s: string): string {
  return s.replace(/([A-Z])/g, (m) => '_' + m.toLowerCase());
}

function snakeCaseKeys(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(snakeCaseKeys);
  if (
    input &&
    typeof input === 'object' &&
    (input as object).constructor === Object
  ) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[/[A-Z]/.test(k) ? toSnake(k) : k] = snakeCaseKeys(v);
    }
    return out;
  }
  return input;
}

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('keystone_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const url = config.url || '';
    if (!url.includes('/auth/login')) {
      if (config.data && typeof config.data === 'object') {
        config.data = snakeCaseKeys(config.data);
      }
      if (config.params && typeof config.params === 'object') {
        config.params = snakeCaseKeys(config.params);
      }
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
