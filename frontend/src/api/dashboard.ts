import apiClient from './client';
import { isDemoMode, mockApi } from './mockClient';
import type {
  DashboardSummary,
  SupplyClassSummary,
  ReadinessSummary,
  SustainabilityProjection,
  Alert,
  ApiResponse,
} from '@/lib/types';

export async function getDashboardSummary(unitId?: string): Promise<DashboardSummary> {
  if (isDemoMode) return mockApi.getDashboardSummary(unitId);
  const response = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary', {
    params: unitId ? { unitId } : undefined,
  });
  return response.data.data;
}

export async function getSupplyOverview(unitId?: string): Promise<SupplyClassSummary[]> {
  if (isDemoMode) return mockApi.getSupplyOverview(unitId);
  const response = await apiClient.get<ApiResponse<SupplyClassSummary[]>>('/dashboard/supply', {
    params: unitId ? { unitId } : undefined,
  });
  return response.data.data;
}

export async function getReadinessOverview(unitId?: string): Promise<ReadinessSummary> {
  if (isDemoMode) return mockApi.getReadinessOverview(unitId);
  const response = await apiClient.get<ApiResponse<ReadinessSummary>>('/dashboard/readiness', {
    params: unitId ? { unitId } : undefined,
  });
  return response.data.data;
}

export async function getSustainability(unitId?: string): Promise<SustainabilityProjection[]> {
  if (isDemoMode) return mockApi.getSustainability(unitId);
  const response = await apiClient.get<ApiResponse<SustainabilityProjection[]>>(
    '/dashboard/sustainability',
    { params: unitId ? { unitId } : undefined },
  );
  return response.data.data;
}

export async function getAlerts(unitId?: string): Promise<Alert[]> {
  if (isDemoMode) return mockApi.getDashboardAlerts(unitId);
  const response = await apiClient.get<ApiResponse<Alert[]>>('/dashboard/alerts', {
    params: unitId ? { unitId } : undefined,
  });
  return response.data.data;
}
