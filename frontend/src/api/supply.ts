import apiClient from './client';
import type {
  SupplyRecord,
  SupplyFilters,
  PaginatedResponse,
  ApiResponse,
  ConsumptionDataPoint,
} from '@/lib/types';

export async function getSupplyRecords(filters?: SupplyFilters): Promise<PaginatedResponse<SupplyRecord>> {
  const response = await apiClient.get<PaginatedResponse<SupplyRecord>>('/supply', {
    params: filters,
  });
  return response.data;
}

export async function getSupplyById(id: string): Promise<SupplyRecord> {
  const response = await apiClient.get<ApiResponse<SupplyRecord>>(`/supply/${id}`);
  return response.data.data;
}

export async function createSupply(data: Partial<SupplyRecord>): Promise<SupplyRecord> {
  const response = await apiClient.post<ApiResponse<SupplyRecord>>('/supply', data);
  return response.data.data;
}

export async function updateSupply(id: string, data: Partial<SupplyRecord>): Promise<SupplyRecord> {
  const response = await apiClient.put<ApiResponse<SupplyRecord>>(`/supply/${id}`, data);
  return response.data.data;
}

export async function getConsumptionRates(unitId: string): Promise<ConsumptionDataPoint[]> {
  const response = await apiClient.get<ApiResponse<ConsumptionDataPoint[]>>(
    `/supply/consumption/${unitId}`,
  );
  return response.data.data;
}

export async function getSupplyTrends(unitId: string): Promise<ConsumptionDataPoint[]> {
  const response = await apiClient.get<ApiResponse<ConsumptionDataPoint[]>>(
    `/supply/trends/${unitId}`,
  );
  return response.data.data;
}
