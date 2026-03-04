import apiClient from './client';
import { isDemoMode, mockApi } from './mockClient';
import type {
  Report,
  ReportFilters,
  GenerateReportParams,
  PaginatedResponse,
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
  const response = await apiClient.post<Report>('/reports/generate', null, {
    params: {
      report_type: params.type,
      unit_id: params.unitId,
      title: params.title,
      date_from: params.dateRange.start,
      date_to: params.dateRange.end,
    },
  });
  return response.data;
}

export async function getReport(id: string): Promise<Report> {
  if (isDemoMode) return mockApi.getReport(id);
  const response = await apiClient.get<Report>(`/reports/${id}`);
  return response.data;
}

export async function finalizeReport(id: string): Promise<Report> {
  if (isDemoMode) return mockApi.finalizeReport(id);
  const response = await apiClient.put<Report>(`/reports/${id}/finalize`);
  return response.data;
}
