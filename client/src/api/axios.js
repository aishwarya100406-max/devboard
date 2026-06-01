import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only treat 401 as session expiry for our own auth endpoints.
    // GitHub proxy routes can return 401 for rate limits — don't log the user out for those.
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/github/')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
