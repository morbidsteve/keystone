import apiClient from './client';
import { isDemoMode, mockApi } from './mockClient';
import { SupplyStatus, SupplyClass } from '@/lib/types';
import type {
  DashboardSummary,
  SupplyClassSummary,
  ReadinessSummary,
  SustainabilityProjection,
  Alert,
  ApiResponse,
} from '@/lib/types';

const CLASS_NAMES: Record<string, string> = {
  I: 'Subsistence',
  II: 'Clothing',
  III: 'POL',
  IIIA: 'POL (Aviation)',
  IV: 'Construction',
  V: 'Ammunition',
  VI: 'Personal Demand',
  VII: 'Major End Items',
  VIII: 'Medical',
  IX: 'Repair Parts',
  X: 'Agriculture',
};

export async function getDashboardSummary(unitId?: string, timeRange?: string): Promise<DashboardSummary> {
  if (isDemoMode) return mockApi.getDashboardSummary(unitId, timeRange);
  const response = await apiClient.get<ApiResponse<any>>('/dashboard/summary', {
    params: { ...(unitId && { unitId }), ...(timeRange && { timeRange }) },
  });
  const raw = response.data.data ?? {};
  const eqReadiness = typeof raw.equipmentReadiness === 'number' ? raw.equipmentReadiness : 0;
  return {
    unitId: String(raw.unitId ?? unitId ?? ''),
    unitName: raw.unitName ?? '',
    overallReadiness: eqReadiness,
    overallStatus: (eqReadiness >= 90 ? SupplyStatus.GREEN : eqReadiness >= 75 ? SupplyStatus.AMBER : SupplyStatus.RED),
    supplyStatus: Array.isArray(raw.supplyOverview) ? raw.supplyOverview : [],
    equipmentReadiness: {
      overall: eqReadiness,
      byType: [],
      status: SupplyStatus.GREEN,
      trend: 'STABLE' as const,
    },
    activeMovements: raw.activeMovements ?? 0,
    pendingRequisitions: raw.pendingRequisitions ?? 0,
    criticalAlerts: raw.criticalAlerts ?? 0,
    warningAlerts: raw.totalAlerts ?? 0,
    sustainabilityDays: raw.sustainabilityDays ?? 0,
    lastUpdated: raw.lastUpdated ?? new Date().toISOString(),
  };
}

export async function getSupplyOverview(unitId?: string, timeRange?: string): Promise<SupplyClassSummary[]> {
  if (isDemoMode) return mockApi.getSupplyOverview(unitId, timeRange);
  const response = await apiClient.get<ApiResponse<Array<{ supplyClass: string; avgDos: number; status: string; itemCount: number }>>>(
    '/dashboard/supply',
    { params: { ...(unitId && { unitId }), ...(timeRange && { timeRange }) } },
  );
  const arr = Array.isArray(response.data.data) ? response.data.data : [];
  return arr.map((r) => ({
    supplyClass: r.supplyClass as SupplyClass,
    name: CLASS_NAMES[r.supplyClass] ?? `Class ${r.supplyClass}`,
    percentage: Math.min(100, Math.round(((r.avgDos ?? 0) / 30) * 100)),
    dos: r.avgDos ?? 0,
    status: (r.status as SupplyStatus) ?? SupplyStatus.GREEN,
    trend: 'STABLE' as const,
    onHand: r.itemCount ?? 0,
    authorized: r.itemCount ?? 0,
  }));
}

export async function getReadinessOverview(unitId?: string, timeRange?: string): Promise<ReadinessSummary> {
  if (isDemoMode) return mockApi.getReadinessOverview(unitId, timeRange);
  const response = await apiClient.get<
    ApiResponse<
      Array<{
        unitId: number;
        unitName: string;
        overallReadinessPct: number;
        totalEquipment: number;
        missionCapable: number;
        notMissionCapable: number;
      }>
    >
  >('/dashboard/readiness', {
    params: { ...(unitId && { unitId }), ...(timeRange && { timeRange }) },
  });
  const arr = Array.isArray(response.data.data) ? response.data.data : [];
  const total = arr.reduce((s, r) => s + (r.totalEquipment ?? 0), 0);
  const mc = arr.reduce((s, r) => s + (r.missionCapable ?? 0), 0);
  const overall = total > 0 ? Math.round((mc / total) * 1000) / 10 : 0;
  const status = overall >= 90 ? SupplyStatus.GREEN : overall >= 75 ? SupplyStatus.AMBER : SupplyStatus.RED;
  return {
    overall,
    byType: arr.map((r) => ({
      type: r.unitName,
      authorized: r.totalEquipment ?? 0,
      missionCapable: r.missionCapable ?? 0,
      readinessPercent: r.overallReadinessPct ?? 0,
      status:
        (r.overallReadinessPct ?? 0) >= 90
          ? SupplyStatus.GREEN
          : (r.overallReadinessPct ?? 0) >= 75
            ? SupplyStatus.AMBER
            : SupplyStatus.RED,
    })),
    status,
    trend: 'STABLE' as const,
  };
}

export async function getSustainability(unitId?: string, timeRange?: string): Promise<SustainabilityProjection[]> {
  if (isDemoMode) return mockApi.getSustainability(unitId, timeRange);
  const response = await apiClient.get<ApiResponse<SustainabilityProjection[]>>(
    '/dashboard/sustainability',
    { params: { ...(unitId && { unitId }), ...(timeRange && { timeRange }) } },
  );
  const data = response.data.data;
  return Array.isArray(data) ? data : [];
}

export async function getAlerts(unitId?: string, timeRange?: string): Promise<Alert[]> {
  if (isDemoMode) return mockApi.getDashboardAlerts(unitId, timeRange);
  const response = await apiClient.get<ApiResponse<Alert[]>>('/dashboard/alerts', {
    params: { ...(unitId && { unitId }), ...(timeRange && { timeRange }) },
  });
  const data = response.data.data;
  return Array.isArray(data) ? data : [];
}
