import apiClient from './client';
import type { LoginResponse, User, ApiResponse } from '@/lib/types';

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    username,
    password,
  });
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
}

export async function getUsers(): Promise<User[]> {
  const response = await apiClient.get<ApiResponse<User[]>>('/auth/users');
  return response.data.data;
}
