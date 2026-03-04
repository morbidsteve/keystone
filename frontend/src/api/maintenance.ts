import apiClient from './client';
import { isDemoMode, mockApi } from './mockClient';
import type {
  MaintenanceWorkOrder,
  MaintenancePart,
  MaintenanceLabor,
  PaginatedResponse,
  ApiResponse,
  WorkOrderFilters,
} from '@/lib/types';

export async function getWorkOrders(
  filters?: WorkOrderFilters,
): Promise<PaginatedResponse<MaintenanceWorkOrder>> {
  if (isDemoMode) return mockApi.getWorkOrders(filters);
  const response = await apiClient.get<PaginatedResponse<MaintenanceWorkOrder>>('/maintenance/work-orders', {
    params: filters,
  });
  return response.data;
}

export async function getWorkOrderById(id: string): Promise<MaintenanceWorkOrder> {
  if (isDemoMode) return mockApi.getWorkOrderById(id);
  const response = await apiClient.get<ApiResponse<MaintenanceWorkOrder>>(`/maintenance/work-orders/${id}`);
  return response.data.data;
}

export async function createWorkOrder(
  data: Partial<MaintenanceWorkOrder>,
): Promise<MaintenanceWorkOrder> {
  if (isDemoMode) return mockApi.createWorkOrder(data);
  const response = await apiClient.post<ApiResponse<MaintenanceWorkOrder>>('/maintenance/work-orders', data);
  return response.data.data;
}

export async function updateWorkOrder(
  id: string,
  data: Partial<MaintenanceWorkOrder>,
): Promise<MaintenanceWorkOrder> {
  if (isDemoMode) return mockApi.updateWorkOrder(id, data);
  const response = await apiClient.put<ApiResponse<MaintenanceWorkOrder>>(
    `/maintenance/work-orders/${id}`,
    data,
  );
  return response.data.data;
}

export async function deleteWorkOrder(id: string): Promise<void> {
  if (isDemoMode) return mockApi.deleteWorkOrder(id);
  await apiClient.delete(`/maintenance/work-orders/${id}`);
}

export async function addPart(
  workOrderId: string,
  data: Partial<MaintenancePart>,
): Promise<MaintenancePart> {
  if (isDemoMode) return mockApi.addPart(workOrderId, data);
  const response = await apiClient.post<ApiResponse<MaintenancePart>>(
    `/maintenance/work-orders/${workOrderId}/parts`,
    data,
  );
  return response.data.data;
}

export async function updatePart(
  workOrderId: string,
  partId: string,
  data: Partial<MaintenancePart>,
): Promise<MaintenancePart> {
  if (isDemoMode) return mockApi.updatePart(workOrderId, partId, data);
  const response = await apiClient.put<ApiResponse<MaintenancePart>>(
    `/maintenance/work-orders/${workOrderId}/parts/${partId}`,
    data,
  );
  return response.data.data;
}

export async function deletePart(workOrderId: string, partId: string): Promise<void> {
  if (isDemoMode) return mockApi.deletePart(workOrderId, partId);
  await apiClient.delete(`/maintenance/work-orders/${workOrderId}/parts/${partId}`);
}

export async function addLabor(
  workOrderId: string,
  data: Partial<MaintenanceLabor>,
): Promise<MaintenanceLabor> {
  if (isDemoMode) return mockApi.addLabor(workOrderId, data);
  const response = await apiClient.post<ApiResponse<MaintenanceLabor>>(
    `/maintenance/work-orders/${workOrderId}/labor`,
    data,
  );
  return response.data.data;
}

export async function updateLabor(
  workOrderId: string,
  laborId: string,
  data: Partial<MaintenanceLabor>,
): Promise<MaintenanceLabor> {
  if (isDemoMode) return mockApi.updateLabor(workOrderId, laborId, data);
  const response = await apiClient.put<ApiResponse<MaintenanceLabor>>(
    `/maintenance/work-orders/${workOrderId}/labor/${laborId}`,
    data,
  );
  return response.data.data;
}

export async function deleteLabor(workOrderId: string, laborId: string): Promise<void> {
  if (isDemoMode) return mockApi.deleteLabor(workOrderId, laborId);
  await apiClient.delete(`/maintenance/work-orders/${workOrderId}/labor/${laborId}`);
}
