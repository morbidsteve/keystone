import apiClient from './client';
import { isDemoMode, mockApi } from './mockClient';
import type {
  Report,
  ReportFilters,
  GenerateReportParams,
  PaginatedResponse,
  ExportDestination,
  ExportDestinationCreate,
  ExportDestinationUpdate,
  ApiExportResponse,
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

// --- PDF Export ---

export async function exportReportPdf(reportId: string): Promise<Blob> {
  if (isDemoMode) return mockApi.exportReportPdf(reportId);
  const response = await apiClient.get(`/reports/${reportId}/export/pdf`, {
    responseType: 'blob',
  });
  return response.data as Blob;
}

// --- Export Destinations ---

export async function getExportDestinations(): Promise<ExportDestination[]> {
  if (isDemoMode) return mockApi.getExportDestinations();
  const response = await apiClient.get<ExportDestination[]>('/reports/export-destinations');
  return response.data;
}

export async function createExportDestination(data: ExportDestinationCreate): Promise<ExportDestination> {
  if (isDemoMode) return mockApi.createExportDestination(data);
  const response = await apiClient.post<ExportDestination>('/reports/export-destinations', data);
  return response.data;
}

export async function updateExportDestination(id: number, data: ExportDestinationUpdate): Promise<ExportDestination> {
  if (isDemoMode) return mockApi.updateExportDestination(id, data);
  const response = await apiClient.put<ExportDestination>(`/reports/export-destinations/${id}`, data);
  return response.data;
}

export async function deleteExportDestination(id: number): Promise<void> {
  if (isDemoMode) return mockApi.deleteExportDestination(id);
  await apiClient.delete(`/reports/export-destinations/${id}`);
}

// --- API Export ---

export async function exportReportToApi(reportId: string, destinationIds: number[]): Promise<ApiExportResponse> {
  if (isDemoMode) return mockApi.exportReportToApi(reportId, destinationIds);
  const response = await apiClient.post<ApiExportResponse>(`/reports/${reportId}/export/api`, {
    destination_ids: destinationIds,
  });
  return response.data;
}
