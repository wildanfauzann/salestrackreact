import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // Gunakan .env di production, proxy Vite di local
  withCredentials: true, // Send cookies/session automatically
});

// Interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // You can trigger a global logout or redirect to login here if needed
      console.warn('Unauthorized request, session might be expired');
    }
    return Promise.reject(error);
  }
);
