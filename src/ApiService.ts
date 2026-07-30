import axios from 'axios';
import endpoints from './endpoints';

const api = axios.create({
  baseURL: endpoints.REST_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },  
});

// Interceptor to add the token to the request header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
  
export default api;