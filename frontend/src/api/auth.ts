import apiClient from './client';
import { isDemoMode, mockApi } from './mockClient';
import type { LoginResponse, User, ApiResponse } from '@/lib/types';

export async function login(username: string, password: string): Promise<LoginResponse> {
  if (isDemoMode) return mockApi.login(username, password);
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    username,
    password,
  });
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  if (isDemoMode) return mockApi.getCurrentUser();
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
}

export async function getUsers(): Promise<User[]> {
  if (isDemoMode) return mockApi.getUsers();
  const response = await apiClient.get<ApiResponse<User[]>>('/auth/users');
  return response.data.data;
}

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: string;
  unit_id?: number | null;
}): Promise<User> {
  if (isDemoMode) {
    // Return a synthetic user for demo mode
    return {
      id: Date.now(),
      username: data.username,
      email: data.email,
      full_name: data.full_name,
      role: data.role as User['role'],
      unit_id: data.unit_id ?? null,
      is_active: true,
      created_at: new Date().toISOString(),
    };
  }
  const response = await apiClient.post<ApiResponse<User>>('/auth/register', data);
  return response.data.data;
}
