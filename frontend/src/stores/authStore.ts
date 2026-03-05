import { create } from 'zustand';
import type { User } from '@/lib/types';
import * as authApi from '@/api/auth';

// ---------------------------------------------------------------------------
// Default permission sets per role — used when server doesn't provide them
// ---------------------------------------------------------------------------

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  commander: [
    'dashboard:view',
    'map:view',
    'supply:view',
    'equipment:view',
    'maintenance:view',
    'requisitions:view',
    'requisitions:approve',
    'personnel:view',
    'readiness:view',
    'medical:view',
    'fuel:view',
    'custody:view',
    'audit:view',
    'transportation:view',
    'ingestion:view',
    'ingestion:upload',
    'reports:view',
    'reports:generate',
    'alerts:view',
    'alerts:acknowledge',
    'docs:view',
  ],
  s4: [
    'dashboard:view',
    'map:view',
    'supply:view',
    'supply:edit',
    'equipment:view',
    'equipment:edit',
    'maintenance:view',
    'maintenance:create',
    'maintenance:edit',
    'requisitions:view',
    'requisitions:create',
    'requisitions:edit',
    'requisitions:approve',
    'readiness:view',
    'fuel:view',
    'fuel:edit',
    'custody:view',
    'custody:edit',
    'transportation:view',
    'transportation:edit',
    'ingestion:view',
    'ingestion:upload',
    'reports:view',
    'reports:generate',
    'alerts:view',
    'alerts:acknowledge',
    'docs:view',
  ],
  s3: [
    'dashboard:view',
    'map:view',
    'personnel:view',
    'personnel:edit',
    'medical:view',
    'readiness:view',
    'readiness:edit',
    'equipment:view',
    'transportation:view',
    'transportation:edit',
    'reports:view',
    'reports:generate',
    'alerts:view',
    'alerts:acknowledge',
    'docs:view',
  ],
  operator: [
    'dashboard:view',
    'map:view',
    'supply:view',
    'equipment:view',
    'maintenance:view',
    'requisitions:view',
    'requisitions:create',
    'requisitions:edit',
    'personnel:view',
    'readiness:view',
    'medical:view',
    'fuel:view',
    'custody:view',
    'transportation:view',
    'ingestion:view',
    'ingestion:upload',
    'reports:view',
    'alerts:view',
    'docs:view',
  ],
  viewer: [
    'dashboard:view',
    'map:view',
    'supply:view',
    'equipment:view',
    'readiness:view',
    'alerts:view',
    'reports:view',
    'personnel:view',
    'docs:view',
  ],
};

// ---------------------------------------------------------------------------
// Auth Store
// ---------------------------------------------------------------------------

interface AuthState {
  user: User | null;
  token: string | null;
  permissions: string[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setPermissions: (perms: string[]) => void;
  checkAuth: () => boolean;
  clearError: () => void;
}

function resolvePermissions(user: User): string[] {
  if (user.permissions && user.permissions.length > 0) {
    return user.permissions;
  }
  const role = (user.role || '').toLowerCase();
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
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
  permissions: (() => {
    try {
      const stored = localStorage.getItem('keystone_permissions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),
  isLoading: false,
  error: null,

  get isAuthenticated() {
    return !!get().token && !!get().user;
  },

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(username, password);
      const perms = resolvePermissions(response.user);
      localStorage.setItem('keystone_token', response.token);
      localStorage.setItem('keystone_user', JSON.stringify(response.user));
      localStorage.setItem('keystone_permissions', JSON.stringify(perms));
      set({
        user: response.user,
        token: response.token,
        permissions: perms,
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
    localStorage.removeItem('keystone_permissions');
    set({ user: null, token: null, permissions: [], error: null });
  },

  setUser: (user: User) => {
    localStorage.setItem('keystone_user', JSON.stringify(user));
    set({ user });
  },

  setPermissions: (perms: string[]) => {
    localStorage.setItem('keystone_permissions', JSON.stringify(perms));
    set({ permissions: perms });
  },

  checkAuth: () => {
    const token = localStorage.getItem('keystone_token');
    const userStr = localStorage.getItem('keystone_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const permsStr = localStorage.getItem('keystone_permissions');
        const permissions = permsStr ? JSON.parse(permsStr) : resolvePermissions(user);
        set({ token, user, permissions });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },

  clearError: () => set({ error: null }),
}));
