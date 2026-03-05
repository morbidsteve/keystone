// =============================================================================
// Maintenance Labor Analytics — API client with demo mode support
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';

// ── Types ────────────────────────────────────────────────────────────

export interface PersonnelWorkload {
  personnel_id: number;
  edipi: string;
  first_name: string;
  last_name: string;
  rank: string;
  mos: string;
  total_hours: number;
  work_order_count: number;
  avg_hours_per_wo: number;
  labor_breakdown: Record<string, number>;
}

export interface EquipmentReliability {
  equipment_type: string;
  total_wos: number;
  corrective_count: number;
  preventive_count: number;
  corrective_pct: number;
  preventive_pct: number;
}

export interface PartFailure {
  part_number: string;
  nomenclature: string;
  nsn: string;
  replacement_count: number;
  total_quantity: number;
  avg_cost_per_part: number;
  total_cost: number;
}

export interface MTBFMTTRData {
  equipment_type: string;
  mtbf_days: number;
  mttr_hours: number;
  mtbf_trend: 'IMPROVING' | 'DEGRADING' | 'STABLE';
  corrective_wos_total: number;
  last_corrective_date: string | null;
  health_score: number;
}

export interface PMRecommendation {
  equipment_type: string;
  recommendation: string;
  reason: string;
  priority: number;
  days_until_failure: number;
}

export interface PartsForecast {
  part_number: string;
  nomenclature: string;
  forecast_quantity: number;
  equipment_types: string[];
  avg_cost_per_part: number;
  total_forecast_cost: number;
}

// ── Mock Data ────────────────────────────────────────────────────────

const MOCK_PERSONNEL_WORKLOAD: PersonnelWorkload[] = [
  { personnel_id: 1, edipi: '1234567890', first_name: 'Marcus', last_name: 'Rodriguez', rank: 'Cpl', mos: '3521', total_hours: 145.5, work_order_count: 12, avg_hours_per_wo: 12.1, labor_breakdown: { INSPECT: 20, DIAGNOSE: 35.5, REPAIR: 60, REPLACE: 25, TEST: 5 } },
  { personnel_id: 2, edipi: '2345678901', first_name: 'James', last_name: 'Mitchell', rank: 'LCpl', mos: '3521', total_hours: 128.0, work_order_count: 10, avg_hours_per_wo: 12.8, labor_breakdown: { INSPECT: 15, DIAGNOSE: 28, REPAIR: 55, REPLACE: 20, TEST: 10 } },
  { personnel_id: 3, edipi: '3456789012', first_name: 'David', last_name: 'Chen', rank: 'Sgt', mos: '3531', total_hours: 110.5, work_order_count: 8, avg_hours_per_wo: 13.8, labor_breakdown: { INSPECT: 30, DIAGNOSE: 25, REPAIR: 30, REPLACE: 15, TEST: 10.5 } },
  { personnel_id: 4, edipi: '4567890123', first_name: 'Tyler', last_name: 'Brooks', rank: 'PFC', mos: '3521', total_hours: 98.0, work_order_count: 9, avg_hours_per_wo: 10.9, labor_breakdown: { INSPECT: 10, DIAGNOSE: 18, REPAIR: 45, REPLACE: 20, TEST: 5 } },
  { personnel_id: 5, edipi: '5678901234', first_name: 'Ryan', last_name: 'Jackson', rank: 'LCpl', mos: '3531', total_hours: 86.5, work_order_count: 7, avg_hours_per_wo: 12.4, labor_breakdown: { INSPECT: 12, DIAGNOSE: 20, REPAIR: 35, REPLACE: 14.5, TEST: 5 } },
  { personnel_id: 6, edipi: '6789012345', first_name: 'Kevin', last_name: 'Torres', rank: 'Cpl', mos: '3521', total_hours: 75.0, work_order_count: 6, avg_hours_per_wo: 12.5, labor_breakdown: { INSPECT: 8, DIAGNOSE: 15, REPAIR: 32, REPLACE: 12, TEST: 8 } },
  { personnel_id: 7, edipi: '7890123456', first_name: 'Brandon', last_name: 'Lee', rank: 'PFC', mos: '3531', total_hours: 62.0, work_order_count: 5, avg_hours_per_wo: 12.4, labor_breakdown: { INSPECT: 6, DIAGNOSE: 12, REPAIR: 28, REPLACE: 10, TEST: 6 } },
  { personnel_id: 8, edipi: '8901234567', first_name: 'Andrew', last_name: 'Harris', rank: 'LCpl', mos: '3521', total_hours: 55.5, work_order_count: 5, avg_hours_per_wo: 11.1, labor_breakdown: { INSPECT: 5, DIAGNOSE: 10, REPAIR: 25, REPLACE: 8.5, TEST: 7 } },
];

const MOCK_EQUIPMENT_RELIABILITY: EquipmentReliability[] = [
  { equipment_type: 'HMMWV', total_wos: 45, corrective_count: 28, preventive_count: 17, corrective_pct: 62.2, preventive_pct: 37.8 },
  { equipment_type: 'MTVR', total_wos: 32, corrective_count: 18, preventive_count: 14, corrective_pct: 56.3, preventive_pct: 43.7 },
  { equipment_type: 'LAV-25', total_wos: 24, corrective_count: 16, preventive_count: 8, corrective_pct: 66.7, preventive_pct: 33.3 },
  { equipment_type: 'AAV-P7A1', total_wos: 18, corrective_count: 12, preventive_count: 6, corrective_pct: 66.7, preventive_pct: 33.3 },
  { equipment_type: 'JLTV', total_wos: 12, corrective_count: 5, preventive_count: 7, corrective_pct: 41.7, preventive_pct: 58.3 },
];

const MOCK_PARTS_FAILURE: PartFailure[] = [
  { part_number: 'M001234', nomenclature: 'Engine Oil Filter', nsn: '4310-00-123-4567', replacement_count: 24, total_quantity: 48, avg_cost_per_part: 18.50, total_cost: 888.0 },
  { part_number: 'M002345', nomenclature: 'Brake Pad Set', nsn: '2530-01-234-5678', replacement_count: 18, total_quantity: 36, avg_cost_per_part: 145.00, total_cost: 5220.0 },
  { part_number: 'M003456', nomenclature: 'Alternator Assembly', nsn: '2920-01-345-6789', replacement_count: 12, total_quantity: 12, avg_cost_per_part: 425.00, total_cost: 5100.0 },
  { part_number: 'M004567', nomenclature: 'Hydraulic Hose', nsn: '4720-01-456-7890', replacement_count: 15, total_quantity: 30, avg_cost_per_part: 85.00, total_cost: 2550.0 },
  { part_number: 'M005678', nomenclature: 'Air Filter Element', nsn: '2940-00-567-8901', replacement_count: 22, total_quantity: 44, avg_cost_per_part: 32.00, total_cost: 1408.0 },
  { part_number: 'M006789', nomenclature: 'Radiator Cap', nsn: '2930-01-678-9012', replacement_count: 10, total_quantity: 10, avg_cost_per_part: 22.00, total_cost: 220.0 },
  { part_number: 'M007890', nomenclature: 'Starter Motor', nsn: '2920-01-789-0123', replacement_count: 8, total_quantity: 8, avg_cost_per_part: 380.00, total_cost: 3040.0 },
  { part_number: 'M008901', nomenclature: 'Fuel Filter', nsn: '4330-01-890-1234', replacement_count: 20, total_quantity: 40, avg_cost_per_part: 28.00, total_cost: 1120.0 },
];

const MOCK_MTBF_MTTR: MTBFMTTRData[] = [
  { equipment_type: 'HMMWV', mtbf_days: 22.5, mttr_hours: 8.5, mtbf_trend: 'DEGRADING', corrective_wos_total: 28, last_corrective_date: '2026-03-01T10:30:00Z', health_score: 10 },
  { equipment_type: 'MTVR', mtbf_days: 45.2, mttr_hours: 12.3, mtbf_trend: 'STABLE', corrective_wos_total: 18, last_corrective_date: '2026-02-28T14:00:00Z', health_score: 60 },
  { equipment_type: 'LAV-25', mtbf_days: 38.1, mttr_hours: 18.7, mtbf_trend: 'DEGRADING', corrective_wos_total: 16, last_corrective_date: '2026-03-02T09:15:00Z', health_score: 40 },
  { equipment_type: 'AAV-P7A1', mtbf_days: 55.8, mttr_hours: 24.2, mtbf_trend: 'IMPROVING', corrective_wos_total: 12, last_corrective_date: '2026-02-15T11:00:00Z', health_score: 80 },
  { equipment_type: 'JLTV', mtbf_days: 92.3, mttr_hours: 6.1, mtbf_trend: 'STABLE', corrective_wos_total: 5, last_corrective_date: '2026-01-20T08:45:00Z', health_score: 100 },
];

const MOCK_PM_RECOMMENDATIONS: PMRecommendation[] = [
  { equipment_type: 'HMMWV M1151 (H-21)', recommendation: 'Schedule preventive maintenance', reason: 'Predicted corrective failure in 8 days based on MTBF=22.5d', priority: 1, days_until_failure: 8 },
  { equipment_type: 'LAV-25 (L-14)', recommendation: 'Schedule preventive maintenance', reason: 'Predicted corrective failure in 14 days based on MTBF=38.1d', priority: 1, days_until_failure: 14 },
  { equipment_type: 'HMMWV M1165 (H-33)', recommendation: 'Schedule preventive maintenance', reason: 'Predicted corrective failure in 21 days based on MTBF=22.5d', priority: 2, days_until_failure: 21 },
];

const MOCK_PARTS_FORECAST: PartsForecast[] = [
  { part_number: 'M001234', nomenclature: 'Engine Oil Filter', forecast_quantity: 8, equipment_types: ['HMMWV', 'MTVR'], avg_cost_per_part: 18.50, total_forecast_cost: 148.0 },
  { part_number: 'M002345', nomenclature: 'Brake Pad Set', forecast_quantity: 4, equipment_types: ['HMMWV'], avg_cost_per_part: 145.00, total_forecast_cost: 580.0 },
  { part_number: 'M003456', nomenclature: 'Alternator Assembly', forecast_quantity: 2, equipment_types: ['HMMWV', 'LAV-25'], avg_cost_per_part: 425.00, total_forecast_cost: 850.0 },
  { part_number: 'M004567', nomenclature: 'Hydraulic Hose', forecast_quantity: 3, equipment_types: ['LAV-25', 'AAV-P7A1'], avg_cost_per_part: 85.00, total_forecast_cost: 255.0 },
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
