import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor dodający token do każdego requestu
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor obsługujący błędy
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (email, password) => 
    api.post('/auth/register', { email, password }),
  
  login: (email, password, token) => 
    api.post('/auth/login', { email, password, token }),
  
  verify: () => 
    api.get('/auth/verify'),
  
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// TOTP endpoints
export const totpAPI = {
  getAll: () => 
    api.get('/totp'),
  
  getOne: (id) => 
    api.get(`/totp/${id}`),
  
  create: (data) => 
    api.post('/totp', data),
  
  update: (id, data) => 
    api.put(`/totp/${id}`, data),
  
  delete: (id) => 
    api.delete(`/totp/${id}`),
  
  generate: (id) => 
    api.get(`/totp/${id}/generate`),
};

// Sync endpoints
export const syncAPI = {
  export: () => 
    api.get('/sync/export'),
  
  exportUri: () => 
    api.get('/sync/export/uri'),
  
  importJson: (entries, replaceAll = false) => 
    api.post('/sync/import/json', { entries, replaceAll }),
  
  importUri: (uris) => 
    api.post('/sync/import/uri', { uris }),
  
  pull: (lastSyncTime, deviceId) => 
    api.post('/sync/pull', { lastSyncTime, deviceId }),
  
  push: (entries, deviceId) => 
    api.post('/sync/push', { entries, deviceId }),
};

export default api;
