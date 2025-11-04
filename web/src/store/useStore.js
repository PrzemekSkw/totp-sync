import { create } from 'zustand';
import { authAPI, totpAPI } from '../services/api';
import api from '../services/api';

const useStore = create((set, get) => ({
  // Auth state
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,

  // TOTP entries
  entries: [],
  isLoadingEntries: false,

  // Theme
  isDarkMode: localStorage.getItem('theme') === 'dark' || 
              (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
  
  // Code visibility
  hideCodesByDefault: localStorage.getItem('hideCodesByDefault') === 'true' || 
                      !localStorage.getItem('hideCodesByDefault'),

  // Auth actions
  login: async (email, password, totpCode) => {
    try {
      const response = await authAPI.login(email, password, totpCode);
      
      // ✅ Sprawdź czy backend wymaga 2FA
      if (response.data.requires2FA) {
        return { 
          requires2FA: true,
          message: response.data.message 
        };
      }
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true });
      
      // Załaduj wpisy po zalogowaniu
      get().fetchEntries();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  },

  register: async (email, password, totpCode, pendingData) => {
    try {
      // Jeśli totpCode przekazany - weryfikuj 2FA
      if (totpCode) {
        const response = await api.post('/auth/register/verify-2fa', {
          email,
          password,
          token: totpCode,
          pendingData
        });
        
        const { token, user } = response.data;
        
        if (!token || !user) {
          throw new Error('Invalid response from server');
        }
        
        localStorage.setItem('token', token);
        set({ token, user, isAuthenticated: true });
        
        // Załaduj wpisy
        get().fetchEntries();
        
        return { success: true };
      }
      
      // Pierwsza rejestracja - bez kodu 2FA
      const response = await authAPI.register(email, password);
      
      // Sprawdź czy backend wymaga 2FA
      if (response.data.requires2FA) {
        return {
          success: false,
          requires2FA: true,
          twoFactor: response.data.twoFactor, // secret, otpauthUrl, backupCodes
          pendingRegistration: response.data.pendingRegistration
        };
      }
      
      // Standardowa rejestracja bez 2FA
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  },

  // Set authentication directly (for WebAuthn)
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true });
    // Load entries after authentication
    get().fetchEntries();
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ 
      token: null, 
      user: null, 
      isAuthenticated: false,
      entries: [] 
    });
  },

  verifyAuth: async () => {
    const token = localStorage.getItem('token');
    
    if (!token || token === 'undefined') {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await authAPI.verify();
      set({ 
        user: response.data.user, 
        isAuthenticated: true,
        isLoading: false 
      });
      
      // Załaduj wpisy
      get().fetchEntries();
    } catch (error) {
      localStorage.removeItem('token');
      set({ 
        token: null, 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  },

  // TOTP entries actions
  fetchEntries: async () => {
    set({ isLoadingEntries: true });
    try {
      const response = await totpAPI.getAll();
      set({ entries: response.data.entries, isLoadingEntries: false });
    } catch (error) {
      console.error('Failed to fetch entries:', error);
      set({ isLoadingEntries: false });
    }
  },

  addEntry: async (entryData) => {
    try {
      const response = await totpAPI.create(entryData);
      const newEntry = response.data.entry;
      
      set((state) => ({ 
        entries: [...state.entries, newEntry] 
      }));
      
      return { success: true, entry: newEntry };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to add entry' 
      };
    }
  },

  updateEntry: async (id, data) => {
    try {
      const response = await totpAPI.update(id, data);
      const updatedEntry = response.data.entry;
      
      set((state) => ({
        entries: state.entries.map((e) => 
          e.id === id ? { ...e, ...updatedEntry } : e
        )
      }));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to update entry' 
      };
    }
  },

  deleteEntry: async (id) => {
    try {
      await totpAPI.delete(id);
      
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id)
      }));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to delete entry' 
      };
    }
  },

  // Theme actions
  toggleTheme: () => {
    set((state) => {
      const newTheme = !state.isDarkMode;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      
      if (newTheme) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return { isDarkMode: newTheme };
    });
  },

  toggleHideCodes: () => {
    set((state) => {
      const newValue = !state.hideCodesByDefault;
      localStorage.setItem('hideCodesByDefault', newValue.toString());
      return { hideCodesByDefault: newValue };
    });
  },

  initTheme: () => {
    const isDark = get().isDarkMode;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));

export default useStore;