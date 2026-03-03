import { create } from 'zustand';
import type { User } from '@/lib/types';
import * as authApi from '@/api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  checkAuth: () => boolean;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('keystone_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('keystone_token'),
  isLoading: false,
  error: null,

  get isAuthenticated() {
    return !!get().token && !!get().user;
  },

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(username, password);
      localStorage.setItem('keystone_token', response.token);
      localStorage.setItem('keystone_user', JSON.stringify(response.user));
      set({
        user: response.user,
        token: response.token,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Authentication failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('keystone_token');
    localStorage.removeItem('keystone_user');
    set({ user: null, token: null, error: null });
  },

  setUser: (user: User) => {
    localStorage.setItem('keystone_user', JSON.stringify(user));
    set({ user });
  },

  checkAuth: () => {
    const token = localStorage.getItem('keystone_token');
    const userStr = localStorage.getItem('keystone_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },

  clearError: () => set({ error: null }),
}));
