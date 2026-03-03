import apiClient from './client';
import type {
  Report,
  ReportFilters,
  GenerateReportParams,
  PaginatedResponse,
  ApiResponse,
} from '@/lib/types';

export async function getReports(filters?: ReportFilters): Promise<PaginatedResponse<Report>> {
  const response = await apiClient.get<PaginatedResponse<Report>>('/reports', {
    params: filters,
  });
  return response.data;
}

export async function generateReport(params: GenerateReportParams): Promise<Report> {
  const response = await apiClient.post<ApiResponse<Report>>('/reports/generate', params);
  return response.data.data;
}

export async function getReport(id: string): Promise<Report> {
  const response = await apiClient.get<ApiResponse<Report>>(`/reports/${id}`);
  return response.data.data;
}

export async function finalizeReport(id: string): Promise<Report> {
  const response = await apiClient.post<ApiResponse<Report>>(`/reports/${id}/finalize`);
  return response.data.data;
}
