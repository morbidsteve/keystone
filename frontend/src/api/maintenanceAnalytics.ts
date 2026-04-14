// =============================================================================
// Maintenance Labor Analytics — API client with demo mode support
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';

// ── Types ────────────────────────────────────────────────────────────

export interface PersonnelWorkload {
  personnelId: number;
  edipi: string;
  firstName: string;
  lastName: string;
  rank: string;
  mos: string;
  totalHours: number;
  workOrderCount: number;
  avgHoursPerWo: number;
  laborBreakdown: Record<string, number>;
}

export interface EquipmentReliability {
  equipmentType: string;
  totalWos: number;
  correctiveCount: number;
  preventiveCount: number;
  correctivePct: number;
  preventivePct: number;
}

export interface PartFailure {
  partNumber: string;
  nomenclature: string;
  nsn: string;
  replacementCount: number;
  totalQuantity: number;
  avgCostPerPart: number;
  totalCost: number;
}

export interface MTBFMTTRData {
  equipmentType: string;
  mtbfDays: number;
  mttrHours: number;
  mtbfTrend: 'IMPROVING' | 'DEGRADING' | 'STABLE';
  correctiveWosTotal: number;
  lastCorrectiveDate: string | null;
  healthScore: number;
}

export interface PMRecommendation {
  equipmentType: string;
  recommendation: string;
  reason: string;
  priority: number;
  daysUntilFailure: number;
}

export interface PartsForecast {
  partNumber: string;
  nomenclature: string;
  forecastQuantity: number;
  equipmentTypes: string[];
  avgCostPerPart: number;
  totalForecastCost: number;
}

// ── Mock Data ────────────────────────────────────────────────────────

const MOCK_PERSONNEL_WORKLOAD: PersonnelWorkload[] = [
  { personnelId: 1, edipi: '1234567890', firstName: 'Marcus', lastName: 'Rodriguez', rank: 'Cpl', mos: '3521', totalHours: 145.5, workOrderCount: 12, avgHoursPerWo: 12.1, laborBreakdown: { INSPECT: 20, DIAGNOSE: 35.5, REPAIR: 60, REPLACE: 25, TEST: 5 } },
  { personnelId: 2, edipi: '2345678901', firstName: 'James', lastName: 'Mitchell', rank: 'LCpl', mos: '3521', totalHours: 128.0, workOrderCount: 10, avgHoursPerWo: 12.8, laborBreakdown: { INSPECT: 15, DIAGNOSE: 28, REPAIR: 55, REPLACE: 20, TEST: 10 } },
  { personnelId: 3, edipi: '3456789012', firstName: 'David', lastName: 'Chen', rank: 'Sgt', mos: '3531', totalHours: 110.5, workOrderCount: 8, avgHoursPerWo: 13.8, laborBreakdown: { INSPECT: 30, DIAGNOSE: 25, REPAIR: 30, REPLACE: 15, TEST: 10.5 } },
  { personnelId: 4, edipi: '4567890123', firstName: 'Tyler', lastName: 'Brooks', rank: 'PFC', mos: '3521', totalHours: 98.0, workOrderCount: 9, avgHoursPerWo: 10.9, laborBreakdown: { INSPECT: 10, DIAGNOSE: 18, REPAIR: 45, REPLACE: 20, TEST: 5 } },
  { personnelId: 5, edipi: '5678901234', firstName: 'Ryan', lastName: 'Jackson', rank: 'LCpl', mos: '3531', totalHours: 86.5, workOrderCount: 7, avgHoursPerWo: 12.4, laborBreakdown: { INSPECT: 12, DIAGNOSE: 20, REPAIR: 35, REPLACE: 14.5, TEST: 5 } },
  { personnelId: 6, edipi: '6789012345', firstName: 'Kevin', lastName: 'Torres', rank: 'Cpl', mos: '3521', totalHours: 75.0, workOrderCount: 6, avgHoursPerWo: 12.5, laborBreakdown: { INSPECT: 8, DIAGNOSE: 15, REPAIR: 32, REPLACE: 12, TEST: 8 } },
  { personnelId: 7, edipi: '7890123456', firstName: 'Brandon', lastName: 'Lee', rank: 'PFC', mos: '3531', totalHours: 62.0, workOrderCount: 5, avgHoursPerWo: 12.4, laborBreakdown: { INSPECT: 6, DIAGNOSE: 12, REPAIR: 28, REPLACE: 10, TEST: 6 } },
  { personnelId: 8, edipi: '8901234567', firstName: 'Andrew', lastName: 'Harris', rank: 'LCpl', mos: '3521', totalHours: 55.5, workOrderCount: 5, avgHoursPerWo: 11.1, laborBreakdown: { INSPECT: 5, DIAGNOSE: 10, REPAIR: 25, REPLACE: 8.5, TEST: 7 } },
];

const MOCK_EQUIPMENT_RELIABILITY: EquipmentReliability[] = [
  { equipmentType: 'HMMWV', totalWos: 45, correctiveCount: 28, preventiveCount: 17, correctivePct: 62.2, preventivePct: 37.8 },
  { equipmentType: 'MTVR', totalWos: 32, correctiveCount: 18, preventiveCount: 14, correctivePct: 56.3, preventivePct: 43.7 },
  { equipmentType: 'LAV-25', totalWos: 24, correctiveCount: 16, preventiveCount: 8, correctivePct: 66.7, preventivePct: 33.3 },
  { equipmentType: 'AAV-P7A1', totalWos: 18, correctiveCount: 12, preventiveCount: 6, correctivePct: 66.7, preventivePct: 33.3 },
  { equipmentType: 'JLTV', totalWos: 12, correctiveCount: 5, preventiveCount: 7, correctivePct: 41.7, preventivePct: 58.3 },
];

const MOCK_PARTS_FAILURE: PartFailure[] = [
  { partNumber: 'M001234', nomenclature: 'Engine Oil Filter', nsn: '4310-00-123-4567', replacementCount: 24, totalQuantity: 48, avgCostPerPart: 18.50, totalCost: 888.0 },
  { partNumber: 'M002345', nomenclature: 'Brake Pad Set', nsn: '2530-01-234-5678', replacementCount: 18, totalQuantity: 36, avgCostPerPart: 145.00, totalCost: 5220.0 },
  { partNumber: 'M003456', nomenclature: 'Alternator Assembly', nsn: '2920-01-345-6789', replacementCount: 12, totalQuantity: 12, avgCostPerPart: 425.00, totalCost: 5100.0 },
  { partNumber: 'M004567', nomenclature: 'Hydraulic Hose', nsn: '4720-01-456-7890', replacementCount: 15, totalQuantity: 30, avgCostPerPart: 85.00, totalCost: 2550.0 },
  { partNumber: 'M005678', nomenclature: 'Air Filter Element', nsn: '2940-00-567-8901', replacementCount: 22, totalQuantity: 44, avgCostPerPart: 32.00, totalCost: 1408.0 },
  { partNumber: 'M006789', nomenclature: 'Radiator Cap', nsn: '2930-01-678-9012', replacementCount: 10, totalQuantity: 10, avgCostPerPart: 22.00, totalCost: 220.0 },
  { partNumber: 'M007890', nomenclature: 'Starter Motor', nsn: '2920-01-789-0123', replacementCount: 8, totalQuantity: 8, avgCostPerPart: 380.00, totalCost: 3040.0 },
  { partNumber: 'M008901', nomenclature: 'Fuel Filter', nsn: '4330-01-890-1234', replacementCount: 20, totalQuantity: 40, avgCostPerPart: 28.00, totalCost: 1120.0 },
];

const MOCK_MTBF_MTTR: MTBFMTTRData[] = [
  { equipmentType: 'HMMWV', mtbfDays: 22.5, mttrHours: 8.5, mtbfTrend: 'DEGRADING', correctiveWosTotal: 28, lastCorrectiveDate: '2026-03-01T10:30:00Z', healthScore: 10 },
  { equipmentType: 'MTVR', mtbfDays: 45.2, mttrHours: 12.3, mtbfTrend: 'STABLE', correctiveWosTotal: 18, lastCorrectiveDate: '2026-02-28T14:00:00Z', healthScore: 60 },
  { equipmentType: 'LAV-25', mtbfDays: 38.1, mttrHours: 18.7, mtbfTrend: 'DEGRADING', correctiveWosTotal: 16, lastCorrectiveDate: '2026-03-02T09:15:00Z', healthScore: 40 },
  { equipmentType: 'AAV-P7A1', mtbfDays: 55.8, mttrHours: 24.2, mtbfTrend: 'IMPROVING', correctiveWosTotal: 12, lastCorrectiveDate: '2026-02-15T11:00:00Z', healthScore: 80 },
  { equipmentType: 'JLTV', mtbfDays: 92.3, mttrHours: 6.1, mtbfTrend: 'STABLE', correctiveWosTotal: 5, lastCorrectiveDate: '2026-01-20T08:45:00Z', healthScore: 100 },
];

const MOCK_PM_RECOMMENDATIONS: PMRecommendation[] = [
  { equipmentType: 'HMMWV M1151 (H-21)', recommendation: 'Schedule preventive maintenance', reason: 'Predicted corrective failure in 8 days based on MTBF=22.5d', priority: 1, daysUntilFailure: 8 },
  { equipmentType: 'LAV-25 (L-14)', recommendation: 'Schedule preventive maintenance', reason: 'Predicted corrective failure in 14 days based on MTBF=38.1d', priority: 1, daysUntilFailure: 14 },
  { equipmentType: 'HMMWV M1165 (H-33)', recommendation: 'Schedule preventive maintenance', reason: 'Predicted corrective failure in 21 days based on MTBF=22.5d', priority: 2, daysUntilFailure: 21 },
];

const MOCK_PARTS_FORECAST: PartsForecast[] = [
  { partNumber: 'M001234', nomenclature: 'Engine Oil Filter', forecastQuantity: 8, equipmentTypes: ['HMMWV', 'MTVR'], avgCostPerPart: 18.50, totalForecastCost: 148.0 },
  { partNumber: 'M002345', nomenclature: 'Brake Pad Set', forecastQuantity: 4, equipmentTypes: ['HMMWV'], avgCostPerPart: 145.00, totalForecastCost: 580.0 },
  { partNumber: 'M003456', nomenclature: 'Alternator Assembly', forecastQuantity: 2, equipmentTypes: ['HMMWV', 'LAV-25'], avgCostPerPart: 425.00, totalForecastCost: 850.0 },
  { partNumber: 'M004567', nomenclature: 'Hydraulic Hose', forecastQuantity: 3, equipmentTypes: ['LAV-25', 'AAV-P7A1'], avgCostPerPart: 85.00, totalForecastCost: 255.0 },
];

// ── API Functions ────────────────────────────────────────────────────

const mockDelay = (): Promise<void> => new Promise((r) => setTimeout(r, 200 + Math.random() * 200));

export async function getPersonnelWorkload(unitId: number, days = 30): Promise<PersonnelWorkload[]> {
  if (isDemoMode) { await mockDelay(); return MOCK_PERSONNEL_WORKLOAD; }
  const r = await apiClient.get<PersonnelWorkload[]>(`/maintenance/analytics/${unitId}/personnel-workload`, { params: { days } });
  return r.data;
}

export async function getEquipmentReliability(unitId: number, days = 90): Promise<EquipmentReliability[]> {
  if (isDemoMode) { await mockDelay(); return MOCK_EQUIPMENT_RELIABILITY; }
  const r = await apiClient.get<EquipmentReliability[]>(`/maintenance/analytics/${unitId}/equipment-reliability`, { params: { days } });
  return r.data;
}

export async function getPartsFailureAnalysis(unitId: number, days = 90): Promise<PartFailure[]> {
  if (isDemoMode) { await mockDelay(); return MOCK_PARTS_FAILURE; }
  const r = await apiClient.get<PartFailure[]>(`/maintenance/analytics/${unitId}/parts-failure`, { params: { days } });
  return r.data;
}

export async function getMTBFMTTR(unitId: number): Promise<MTBFMTTRData[]> {
  if (isDemoMode) { await mockDelay(); return MOCK_MTBF_MTTR; }
  const r = await apiClient.get<MTBFMTTRData[]>(`/maintenance/analytics/${unitId}/mtbf-mttr`);
  return r.data;
}

export async function getPMRecommendations(unitId: number): Promise<PMRecommendation[]> {
  if (isDemoMode) { await mockDelay(); return MOCK_PM_RECOMMENDATIONS; }
  const r = await apiClient.get<PMRecommendation[]>(`/maintenance/analytics/${unitId}/pm-recommendations`);
  return r.data;
}

export async function getPartsForecast(unitId: number, days = 90): Promise<PartsForecast[]> {
  if (isDemoMode) { await mockDelay(); return MOCK_PARTS_FORECAST; }
  const r = await apiClient.get<PartsForecast[]>(`/maintenance/analytics/${unitId}/parts-forecast`, { params: { days } });
  return r.data;
}
