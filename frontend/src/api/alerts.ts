import apiClient from './client';
import type { Alert, ApiResponse } from '@/lib/types';

export async function getAlerts(params?: {
  unitId?: string;
  severity?: string;
  acknowledged?: boolean;
}): Promise<Alert[]> {
  const response = await apiClient.get<ApiResponse<Alert[]>>('/alerts', { params });
  return response.data.data;
}

export async function acknowledgeAlert(id: string): Promise<Alert> {
  const response = await apiClient.post<ApiResponse<Alert>>(`/alerts/${id}/acknowledge`);
  return response.data.data;
}

export async function getAlertCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<{ count: number }>>('/alerts/count');
  return response.data.data.count;
}
