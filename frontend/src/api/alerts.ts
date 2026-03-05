import apiClient from './client';
import { isDemoMode, mockApi, mockGetAlertSummary, mockResolveAlert, mockGetAlertRules, mockCreateAlertRule, mockUpdateAlertRule } from './mockClient';
import type { Alert, AlertRule, AlertSummary, ApiResponse } from '@/lib/types';

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

export async function getAlertSummary(unitId?: string): Promise<AlertSummary> {
  if (isDemoMode) return mockGetAlertSummary(unitId);
  const params = unitId ? `?unit_id=${unitId}` : '';
  const res = await apiClient.get(`/alerts/summary${params}`);
  return res.data;
}

export async function resolveAlert(id: string): Promise<void> {
  if (isDemoMode) { mockResolveAlert(id); return; }
  await apiClient.put(`/alerts/${id}/resolve`);
}

export async function escalateAlert(id: string, userId: number): Promise<void> {
  if (isDemoMode) return;
  await apiClient.put(`/alerts/${id}/escalate`, { escalate_to_user_id: userId });
}

export async function getAlertRules(): Promise<AlertRule[]> {
  if (isDemoMode) return mockGetAlertRules();
  const res = await apiClient.get('/alerts/rules');
  return res.data;
}

export async function createAlertRule(data: Partial<AlertRule>): Promise<AlertRule> {
  if (isDemoMode) return mockCreateAlertRule(data);
  const res = await apiClient.post('/alerts/rules', data);
  return res.data;
}

export async function updateAlertRule(id: number, data: Partial<AlertRule>): Promise<AlertRule> {
  if (isDemoMode) return mockUpdateAlertRule(id, data);
  const res = await apiClient.put(`/alerts/rules/${id}`, data);
  return res.data;
}

export async function deleteAlertRule(id: number): Promise<void> {
  if (isDemoMode) return;
  await apiClient.delete(`/alerts/rules/${id}`);
}

export async function evaluateRule(ruleId: number): Promise<{ triggered: boolean; message: string }> {
  if (isDemoMode) {
    return { triggered: true, message: `Rule ${ruleId} evaluated — threshold breached, alert generated.` };
  }
  const res = await apiClient.post(`/alerts/rules/${ruleId}/evaluate`);
  return res.data;
}
