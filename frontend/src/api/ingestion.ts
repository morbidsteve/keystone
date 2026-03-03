import apiClient from './client';
import { isDemoMode, mockApi } from './mockClient';
import type { RawData, ParsedRecord, ApiResponse, PaginatedResponse } from '@/lib/types';

export async function uploadFile(file: File): Promise<RawData> {
  if (isDemoMode) return mockApi.uploadFile(file);
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<RawData>>('/ingestion/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

export async function getIngestionHistory(): Promise<PaginatedResponse<RawData>> {
  if (isDemoMode) return mockApi.getIngestionHistory();
  const response = await apiClient.get<PaginatedResponse<RawData>>('/ingestion');
  return response.data;
}

export async function getReviewQueue(): Promise<ParsedRecord[]> {
  if (isDemoMode) return mockApi.getReviewQueue();
  const response = await apiClient.get<ApiResponse<ParsedRecord[]>>('/ingestion/review');
  return response.data.data;
}

export async function approveRecord(id: string): Promise<ParsedRecord> {
  if (isDemoMode) return mockApi.approveRecord(id);
  const response = await apiClient.post<ApiResponse<ParsedRecord>>(
    `/ingestion/review/${id}/approve`,
  );
  return response.data.data;
}

export async function rejectRecord(id: string): Promise<ParsedRecord> {
  if (isDemoMode) return mockApi.rejectRecord(id);
  const response = await apiClient.post<ApiResponse<ParsedRecord>>(
    `/ingestion/review/${id}/reject`,
  );
  return response.data.data;
}

export async function editRecord(
  id: string,
  fields: Record<string, unknown>,
): Promise<ParsedRecord> {
  if (isDemoMode) return mockApi.editRecord(id, fields);
  const response = await apiClient.put<ApiResponse<ParsedRecord>>(
    `/ingestion/review/${id}`,
    fields,
  );
  return response.data.data;
}
