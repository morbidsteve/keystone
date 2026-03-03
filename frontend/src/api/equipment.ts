import apiClient from './client';
import type {
  EquipmentRecord,
  EquipmentFilters,
  PaginatedResponse,
  ApiResponse,
  ConsumptionDataPoint,
} from '@/lib/types';

export async function getEquipmentRecords(
  filters?: EquipmentFilters,
): Promise<PaginatedResponse<EquipmentRecord>> {
  const response = await apiClient.get<PaginatedResponse<EquipmentRecord>>('/equipment', {
    params: filters,
  });
  return response.data;
}

export async function getEquipmentById(id: string): Promise<EquipmentRecord> {
  const response = await apiClient.get<ApiResponse<EquipmentRecord>>(`/equipment/${id}`);
  return response.data.data;
}

export async function createEquipment(data: Partial<EquipmentRecord>): Promise<EquipmentRecord> {
  const response = await apiClient.post<ApiResponse<EquipmentRecord>>('/equipment', data);
  return response.data.data;
}

export async function updateEquipment(
  id: string,
  data: Partial<EquipmentRecord>,
): Promise<EquipmentRecord> {
  const response = await apiClient.put<ApiResponse<EquipmentRecord>>(`/equipment/${id}`, data);
  return response.data.data;
}

export async function getReadinessTrends(unitId: string): Promise<ConsumptionDataPoint[]> {
  const response = await apiClient.get<ApiResponse<ConsumptionDataPoint[]>>(
    `/equipment/readiness-trends/${unitId}`,
  );
  return response.data.data;
}
