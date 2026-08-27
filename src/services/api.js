import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('guru_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// SPA ini bisa di-serve dari sub-path (mis. /guru/, /admin/) pada domain yang
// sama, jadi redirect harus menghormati BASE_URL. Path absolut '/login' akan
// melempar pengguna ke aplikasi lain yang di-serve di root domain.
const LOGIN_PATH = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/login`;

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('guru_token');
      localStorage.removeItem('guru_user');
      if (window.location.pathname !== LOGIN_PATH) {
        window.location.href = LOGIN_PATH;
      }
    }
    return Promise.reject(error);
  }
);

export default API;
