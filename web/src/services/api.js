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
  deleteAccount: (password, twoFactorCode) =>
    api.delete('/auth/account', { data: { password, twoFactorCode } }),
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
  importJson: (data, replaceAll = false) => {
    // Wyślij cały obiekt JSON - backend sam wykryje format
    const payload = { ...data, replaceAll };
    return api.post('/sync/import/json', payload);
  },
  importUri: (uris) =>
    api.post('/sync/import/uri', { uris }),
  pull: (lastSyncTime, deviceId) =>
    api.post('/sync/pull', { lastSyncTime, deviceId }),
  push: (entries, deviceId) =>
    api.post('/sync/push', { entries, deviceId }),
};
// WebAuthn endpoints
export const webAuthnAPI = {
  // Generate registration options (start key registration)
  registerOptions: () =>
    api.post('/auth/webauthn/register-options'),
  
  // Verify registration response (complete key registration)
  registerVerify: (credential, name) =>
    api.post('/auth/webauthn/register-verify', { credential, name }),
  
  // Generate authentication options (start key login)
  loginOptions: (email) =>
    api.post('/auth/webauthn/login-options', { email }),
  
  // Verify authentication response (complete key login)
  loginVerify: (credential, userId) =>
    api.post('/auth/webauthn/login-verify', { credential, userId }),
  
  // Get user's registered credentials
  getCredentials: () =>
    api.get('/auth/webauthn/credentials'),
  
  // Delete a credential
  deleteCredential: (id) =>
    api.delete(`/auth/webauthn/credentials/${id}`),
};

export default api;
