import apiClient from './client';
import { isDemoMode, mockApi } from './mockClient';
import type {
  Report,
  ReportFilters,
  GenerateReportParams,
  PaginatedResponse,
  ApiResponse,
} from '@/lib/types';

export async function getReports(filters?: ReportFilters): Promise<PaginatedResponse<Report>> {
  if (isDemoMode) return mockApi.getReports(filters);
  const response = await apiClient.get<PaginatedResponse<Report>>('/reports', {
    params: filters,
  });
  return response.data;
}

export async function generateReport(params: GenerateReportParams): Promise<Report> {
  if (isDemoMode) return mockApi.generateReport(params);
  const response = await apiClient.post<ApiResponse<Report>>('/reports/generate', params);
  return response.data.data;
}

export async function getReport(id: string): Promise<Report> {
  if (isDemoMode) return mockApi.getReport(id);
  const response = await apiClient.get<ApiResponse<Report>>(`/reports/${id}`);
  return response.data.data;
}

export async function finalizeReport(id: string): Promise<Report> {
  if (isDemoMode) return mockApi.finalizeReport(id);
  const response = await apiClient.post<ApiResponse<Report>>(`/reports/${id}/finalize`);
  return response.data.data;
}
