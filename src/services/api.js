import axios from 'axios';

// =============================================================================
// API Service — Axios wrapper
// =============================================================================
// Creates an axios instance that automatically:
//   1. Points to the correct API base URL
//   2. Injects the auth token on every request
//   3. Handles 401 responses by clearing the session
// =============================================================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — add auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ptraker_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — try to refresh
      const refreshToken = localStorage.getItem('ptraker_refresh_token');

      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
            { refreshToken }
          );
          const newToken = response.data.session.accessToken;
          localStorage.setItem('ptraker_token', newToken);
          localStorage.setItem('ptraker_refresh_token', response.data.session.refreshToken);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config);
        } catch {
          // Refresh failed — clear session and redirect to login
          localStorage.removeItem('ptraker_token');
          localStorage.removeItem('ptraker_user');
          localStorage.removeItem('ptraker_refresh_token');
          window.location.href = '/login';
        }
      } else {
        // No refresh token — clear session
        localStorage.removeItem('ptraker_token');
        localStorage.removeItem('ptraker_user');
        localStorage.removeItem('ptraker_refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
