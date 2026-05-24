import axios from 'axios';

const BASE = import.meta.env.VITE_BASE_PATH || '/pachka';
const client = axios.create({ baseURL: `${BASE}/api` });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = `${BASE}/login`;
    }
    return Promise.reject(err);
  },
);

export default client;
