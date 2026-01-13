// ===========================================
// GeoProof - API Configuration
// ===========================================
import axios from 'axios';

// API Base URL from environment variable or default
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  // Jangan set Content-Type default - biarkan axios menentukan otomatis
  // Untuk JSON: akan set application/json
  // Untuk FormData: akan set multipart/form-data dengan boundary
});

// Request interceptor - inject JWT token and handle Content-Type
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Jika data adalah FormData, biarkan browser set Content-Type dengan boundary
    // Jika bukan, set Content-Type ke application/json
    if (config.data && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    // Untuk FormData, JANGAN set Content-Type - browser akan otomatis set dengan boundary
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;