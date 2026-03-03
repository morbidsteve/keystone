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
