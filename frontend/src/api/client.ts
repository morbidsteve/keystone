import axios from 'axios';

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

const apiClient = axios.create({
  baseURL: isDemoMode
    ? '/api/v1'
    : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT
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

// Response interceptor: handle 401
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

export default apiClient;
