import apiClient from './client';
import { isDemoMode, mockApi } from './mockClient';
import type {
  SupplyRecord,
  SupplyFilters,
  PaginatedResponse,
  ApiResponse,
  ConsumptionDataPoint,
} from '@/lib/types';

export async function getSupplyRecords(filters?: SupplyFilters): Promise<PaginatedResponse<SupplyRecord>> {
  if (isDemoMode) return mockApi.getSupplyRecords(filters);
  const response = await apiClient.get<PaginatedResponse<SupplyRecord>>('/supply', {
    params: filters,
  });
  return response.data;
}

export async function getSupplyById(id: string): Promise<SupplyRecord> {
  if (isDemoMode) return mockApi.getSupplyById(id);
  const response = await apiClient.get<ApiResponse<SupplyRecord>>(`/supply/${id}`);
  return response.data.data;
}

export async function createSupply(data: Partial<SupplyRecord>): Promise<SupplyRecord> {
  if (isDemoMode) return mockApi.createSupply(data);
  const response = await apiClient.post<ApiResponse<SupplyRecord>>('/supply', data);
  return response.data.data;
}

export async function updateSupply(id: string, data: Partial<SupplyRecord>): Promise<SupplyRecord> {
  if (isDemoMode) return mockApi.updateSupply(id, data);
  const response = await apiClient.put<ApiResponse<SupplyRecord>>(`/supply/${id}`, data);
  return response.data.data;
}

export async function getConsumptionRates(unitId: string): Promise<ConsumptionDataPoint[]> {
  if (isDemoMode) return mockApi.getConsumptionRates(unitId);
  const response = await apiClient.get<ApiResponse<ConsumptionDataPoint[]>>(
    `/supply/consumption/${unitId}`,
  );
  return response.data.data;
}

export async function getSupplyTrends(unitId: string): Promise<ConsumptionDataPoint[]> {
  if (isDemoMode) return mockApi.getSupplyTrends(unitId);
  const response = await apiClient.get<ApiResponse<ConsumptionDataPoint[]>>(
    `/supply/trends/${unitId}`,
  );
  return response.data.data;
}
