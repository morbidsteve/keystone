import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock the auth API module
vi.mock('../../src/api/auth', () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  getUsers: vi.fn(),
}));

// Mock API modules to avoid import issues
vi.mock('../../src/api/mockClient', () => ({
  isDemoMode: false,
  mockApi: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    getUsers: vi.fn(),
  },
}));

vi.mock('../../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('../../src/api/demoUsers', () => ({
  DEMO_USERS_LIST: [],
}));

vi.mock('../../src/api/mockData', () => ({
  DEMO_SUPPLY_RECORDS: [],
  DEMO_INDIVIDUAL_EQUIPMENT: [],
  DEMO_WORK_ORDERS: [],
  DEMO_UNITS: [],
  DEMO_ALERTS: [],
  DEMO_MOVEMENTS: [],
  DEMO_REPORTS: [],
  DEMO_PERSONNEL: [],
}));

import { useAuthStore } from '../../src/stores/authStore';
import * as authApi from '../../src/api/auth';

describe('Auth Store', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useAuthStore.setState({
        user: null,
        token: null,
        permissions: [],
        isLoading: false,
        error: null,
      });
    });
  });

  it('initial state has no user', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('login sets user and token', async () => {
    const mockUser = {
      id: 1,
      username: 'admin',
      full_name: 'Admin User',
      role: 'admin',
      unit_id: 1,
      email: 'admin@test.com',
      is_active: true,
    };

    vi.mocked(authApi.login).mockResolvedValueOnce({
      token: 'jwt-token-123',
      user: mockUser,
    });

    await act(async () => {
      await useAuthStore.getState().login('admin', 'password');
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe('jwt-token-123');
    expect(state.permissions).toContain('*'); // admin gets wildcard
  });

  it('logout clears user and token', () => {
    // Set up logged-in state first
    act(() => {
      useAuthStore.setState({
        user: {
          id: 1,
          username: 'admin',
          full_name: 'Admin',
          role: 'admin',
          unit_id: 1,
          email: 'a@b.com',
          is_active: true,
        },
        token: 'some-token',
        permissions: ['*'],
      });
    });

    act(() => {
      useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.permissions).toEqual([]);
  });

  it('logout removes token from localStorage', () => {
    localStorage.setItem('keystone_token', 'some-token');
    localStorage.setItem('keystone_user', JSON.stringify({ id: 1 }));

    act(() => {
      useAuthStore.getState().logout();
    });

    expect(localStorage.getItem('keystone_token')).toBeNull();
    expect(localStorage.getItem('keystone_user')).toBeNull();
  });

  it('login stores token in localStorage', async () => {
    const mockUser = {
      id: 2,
      username: 'operator',
      full_name: 'Operator User',
      role: 'operator',
      unit_id: 1,
      email: 'op@test.com',
      is_active: true,
    };

    vi.mocked(authApi.login).mockResolvedValueOnce({
      token: 'jwt-operator-token',
      user: mockUser,
    });

    await act(async () => {
      await useAuthStore.getState().login('operator', 'password');
    });

    expect(localStorage.getItem('keystone_token')).toBe('jwt-operator-token');
    expect(localStorage.getItem('keystone_user')).toContain('operator');
  });
});
