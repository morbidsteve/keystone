import apiClient from './client';
import { isDemoMode, mockApi } from './mockClient';
import type {
  Report,
  ReportFilters,
  GenerateReportParams,
  PaginatedResponse,
  ApiResponse,
  ExportDestination,
  ExportDestinationCreate,
  ExportDestinationUpdate,
  ApiExportResponse,
  ReportTemplate,
  ReportSchedule,
} from '@/lib/types';

export async function getReports(filters?: ReportFilters): Promise<PaginatedResponse<Report>> {
  if (isDemoMode) return mockApi.getReports(filters);
  const response = await apiClient.get<ApiResponse<Report[]>>('/reports', {
    params: filters,
  });
  const arr = Array.isArray(response.data?.data) ? response.data.data : [];
  return { data: arr, total: arr.length, page: 1, pageSize: arr.length };
}

export async function generateReport(params: GenerateReportParams): Promise<Report> {
  if (isDemoMode) return mockApi.generateReport(params);
  const response = await apiClient.post<Report>('/reports/generate', null, {
    params: {
      reportType: params.type,
      unitId: params.unitId,
      title: params.title,
      dateFrom: params.dateRange.start,
      dateTo: params.dateRange.end,
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
    destinationIds: destinationIds,
  });
  return response.data;
}

// --- SITREP/PERSTAT/SPOTREP quick generation ---

export async function generateSitrep(unitId: number, periodHours?: number): Promise<Report> {
  if (isDemoMode) return mockApi.generateSitrep(unitId, periodHours);
  const response = await apiClient.post<Report>(`/reports/generate/sitrep/${unitId}`, null, {
    params: { period_hours: periodHours || 24 },
  });
  return response.data;
}

export async function generatePerstat(unitId: number): Promise<Report> {
  if (isDemoMode) return mockApi.generatePerstat(unitId);
  const response = await apiClient.post<Report>(`/reports/generate/perstat/${unitId}`);
  return response.data;
}

export async function generateSpotrep(unitId: number, data: { title: string; situation_text: string; classification?: string }): Promise<Report> {
  if (isDemoMode) return mockApi.generateSpotrep(unitId, data);
  const response = await apiClient.post<Report>(`/reports/generate/spotrep/${unitId}`, data);
  return response.data;
}

export async function generateRollup(unitId: number, reportType?: string): Promise<Report> {
  if (isDemoMode) return mockApi.generateRollup(unitId, reportType);
  const response = await apiClient.post<Report>(`/reports/generate/rollup/${unitId}`, null, {
    params: { reportType: reportType || 'SITREP' },
  });
  return response.data;
}

// --- Templates ---

export async function getTemplates(): Promise<ReportTemplate[]> {
  if (isDemoMode) return mockApi.getTemplates();
  const response = await apiClient.get<ReportTemplate[]>('/reports/templates');
  return response.data;
}

export async function createTemplate(data: Omit<ReportTemplate, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
  if (isDemoMode) return mockApi.createTemplate(data);
  const response = await apiClient.post<ReportTemplate>('/reports/templates', data);
  return response.data;
}

export async function updateTemplate(id: number, data: Partial<ReportTemplate>): Promise<ReportTemplate> {
  if (isDemoMode) return mockApi.updateTemplate(id, data);
  const response = await apiClient.put<ReportTemplate>(`/reports/templates/${id}`, data);
  return response.data;
}

export async function deleteTemplate(id: number): Promise<void> {
  if (isDemoMode) return mockApi.deleteTemplate(id);
  await apiClient.delete(`/reports/templates/${id}`);
}

// --- Schedules ---

export async function getSchedules(unitId?: number): Promise<ReportSchedule[]> {
  if (isDemoMode) return mockApi.getSchedules(unitId);
  const response = await apiClient.get<ReportSchedule[]>('/reports/schedules', {
    params: unitId ? { unitId: unitId } : undefined,
  });
  return response.data;
}

export async function createSchedule(data: Omit<ReportSchedule, 'id' | 'lastGenerated' | 'nextGeneration' | 'createdAt' | 'updatedAt'>): Promise<ReportSchedule> {
  if (isDemoMode) return mockApi.createSchedule(data);
  const response = await apiClient.post<ReportSchedule>('/reports/schedules', data);
  return response.data;
}

export async function deleteSchedule(id: number): Promise<void> {
  if (isDemoMode) return mockApi.deleteSchedule(id);
  await apiClient.delete(`/reports/schedules/${id}`);
}
