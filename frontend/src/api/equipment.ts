import apiClient from './client';
import { isDemoMode, mockApi } from './mockClient';
import type {
  EquipmentRecord,
  EquipmentItem,
  EquipmentFault,
  EquipmentDriverAssignment,
  MaintenanceWorkOrder,
  EquipmentFilters,
  IndividualEquipmentFilters,
  PaginatedResponse,
  ApiResponse,
  ConsumptionDataPoint,
} from '@/lib/types';

export async function getEquipmentRecords(
  filters?: EquipmentFilters,
): Promise<PaginatedResponse<EquipmentRecord>> {
  if (isDemoMode) return mockApi.getEquipmentRecords(filters);
  const response = await apiClient.get<PaginatedResponse<EquipmentRecord>>('/equipment', {
    params: filters,
  });
  return response.data;
}

export async function getEquipmentById(id: string): Promise<EquipmentRecord> {
  if (isDemoMode) return mockApi.getEquipmentById(id);
  const response = await apiClient.get<ApiResponse<EquipmentRecord>>(`/equipment/${id}`);
  return response.data.data;
}

export async function createEquipment(data: Partial<EquipmentRecord>): Promise<EquipmentRecord> {
  if (isDemoMode) return mockApi.createEquipment(data);
  const response = await apiClient.post<ApiResponse<EquipmentRecord>>('/equipment', data);
  return response.data.data;
}

export async function updateEquipment(
  id: string,
  data: Partial<EquipmentRecord>,
): Promise<EquipmentRecord> {
  if (isDemoMode) return mockApi.updateEquipment(id, data);
  const response = await apiClient.put<ApiResponse<EquipmentRecord>>(`/equipment/${id}`, data);
  return response.data.data;
}

export async function getReadinessTrends(unitId: string): Promise<ConsumptionDataPoint[]> {
  if (isDemoMode) return mockApi.getReadinessTrends(unitId);
  const response = await apiClient.get<ApiResponse<ConsumptionDataPoint[]>>(
    `/equipment/readiness-trends/${unitId}`,
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Individual Equipment (serialized items)
// ---------------------------------------------------------------------------

export async function getIndividualEquipment(
  filters?: IndividualEquipmentFilters,
): Promise<PaginatedResponse<EquipmentItem>> {
  if (isDemoMode) return mockApi.getIndividualEquipment(filters);
  const response = await apiClient.get<PaginatedResponse<EquipmentItem>>('/equipment/individual', {
    params: filters,
  });
  return response.data;
}

export async function getIndividualEquipmentById(id: string): Promise<EquipmentItem> {
  if (isDemoMode) return mockApi.getIndividualEquipmentById(id);
  const response = await apiClient.get<ApiResponse<EquipmentItem>>(`/equipment/individual/${id}`);
  return response.data.data;
}

export async function createIndividualEquipment(
  data: Partial<EquipmentItem>,
): Promise<EquipmentItem> {
  if (isDemoMode) return mockApi.createIndividualEquipment(data);
  const response = await apiClient.post<ApiResponse<EquipmentItem>>('/equipment/individual', data);
  return response.data.data;
}

export async function updateIndividualEquipment(
  id: string,
  data: Partial<EquipmentItem>,
): Promise<EquipmentItem> {
  if (isDemoMode) return mockApi.updateIndividualEquipment(id, data);
  const response = await apiClient.put<ApiResponse<EquipmentItem>>(
    `/equipment/individual/${id}`,
    data,
  );
  return response.data.data;
}

export async function getEquipmentHistory(
  id: string,
): Promise<MaintenanceWorkOrder[]> {
  if (isDemoMode) return mockApi.getEquipmentHistory(id);
  const response = await apiClient.get<ApiResponse<MaintenanceWorkOrder[]>>(
    `/equipment/individual/${id}/history`,
  );
  return response.data.data;
}

export async function reportFault(
  equipmentId: string,
  data: Partial<EquipmentFault>,
): Promise<EquipmentFault> {
  if (isDemoMode) return mockApi.reportFault(equipmentId, data);
  const response = await apiClient.post<ApiResponse<EquipmentFault>>(
    `/equipment/individual/${equipmentId}/faults`,
    data,
  );
  return response.data.data;
}

export async function updateFault(
  equipmentId: string,
  faultId: string,
  data: Partial<EquipmentFault>,
): Promise<EquipmentFault> {
  if (isDemoMode) return mockApi.updateFault(equipmentId, faultId, data);
  const response = await apiClient.put<ApiResponse<EquipmentFault>>(
    `/equipment/individual/${equipmentId}/faults/${faultId}`,
    data,
  );
  return response.data.data;
}

export async function assignDriver(
  equipmentId: string,
  data: Partial<EquipmentDriverAssignment>,
): Promise<EquipmentDriverAssignment> {
  if (isDemoMode) return mockApi.assignDriver(equipmentId, data);
  const response = await apiClient.post<ApiResponse<EquipmentDriverAssignment>>(
    `/equipment/individual/${equipmentId}/drivers`,
    data,
  );
  return response.data.data;
}

export async function updateDriverAssignment(
  equipmentId: string,
  assignmentId: string,
  data: Partial<EquipmentDriverAssignment>,
): Promise<EquipmentDriverAssignment> {
  if (isDemoMode) return mockApi.updateDriverAssignment(equipmentId, assignmentId, data);
  const response = await apiClient.put<ApiResponse<EquipmentDriverAssignment>>(
    `/equipment/individual/${equipmentId}/drivers/${assignmentId}`,
    data,
  );
  return response.data.data;
}
