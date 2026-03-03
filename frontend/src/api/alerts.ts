import apiClient from './client';
import { isDemoMode, mockApi } from './mockClient';
import type { Alert, ApiResponse } from '@/lib/types';

export async function getAlerts(params?: {
  unitId?: string;
  severity?: string;
  acknowledged?: boolean;
}): Promise<Alert[]> {
  if (isDemoMode) return mockApi.getAlerts(params);
  const response = await apiClient.get<ApiResponse<Alert[]>>('/alerts', { params });
  return response.data.data;
}

export async function acknowledgeAlert(id: string): Promise<Alert> {
  if (isDemoMode) return mockApi.acknowledgeAlert(id);
  const response = await apiClient.post<ApiResponse<Alert>>(`/alerts/${id}/acknowledge`);
  return response.data.data;
}

export async function getAlertCount(): Promise<number> {
  if (isDemoMode) return mockApi.getAlertCount();
  const response = await apiClient.get<ApiResponse<{ count: number }>>('/alerts/count');
  return response.data.data.count;
}
