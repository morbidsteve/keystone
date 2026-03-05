// =============================================================================
// KEYSTONE Fuel / POL Management — API functions
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';
import type {
  FuelDashboard,
  FuelStoragePoint,
  FuelTransaction,
  FuelConsumptionRate,
  FuelForecast,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Helper: date string N days from now (ISO short form)
// ---------------------------------------------------------------------------

function dateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

function isoStr(daysFromNow: number, hoursOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Mock delay
// ---------------------------------------------------------------------------

const mockDelay = (ms = 150 + Math.random() * 150): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Mock Storage Points (4 records)
// ---------------------------------------------------------------------------

const MOCK_STORAGE_POINTS: FuelStoragePoint[] = [
  {
    id: 1,
    unit_id: 4,
    name: 'FARP-Alpha',
    facility_type: 'FARP',
    fuel_type: 'JP8',
    capacity_gallons: 10000,
    current_gallons: 7200,
    fill_percentage: 72,
    status: 'OPERATIONAL',
    latitude: 33.3528,
    longitude: 44.3661,
    mgrs: '38SMB4512067890',
    location_description: 'Forward Arming and Refueling Point, MSR TAMPA km 12',
    last_resupply_date: dateStr(-1),
    next_resupply_eta: dateStr(2),
    equipment_id: null,
    created_at: isoStr(-30),
    updated_at: isoStr(0, -2),
  },
  {
    id: 2,
    unit_id: 4,
    name: 'FSP-Main',
    facility_type: 'FSP',
    fuel_type: 'JP8',
    capacity_gallons: 50000,
    current_gallons: 31500,
    fill_percentage: 63,
    status: 'OPERATIONAL',
    latitude: 33.3650,
    longitude: 44.3700,
    mgrs: '38SMB4520068000',
    location_description: 'Fuel Supply Point, FOB WARRIOR main gate',
    last_resupply_date: dateStr(-2),
    next_resupply_eta: dateStr(1),
    equipment_id: null,
    created_at: isoStr(-60),
    updated_at: isoStr(0, -4),
  },
  {
    id: 3,
    unit_id: 4,
    name: 'TFDS-1',
    facility_type: 'TANK_FARM',
    fuel_type: 'DF2',
    capacity_gallons: 25000,
    current_gallons: 4200,
    fill_percentage: 16.8,
    status: 'DEGRADED',
    latitude: 33.3800,
    longitude: 44.3900,
    mgrs: '38SMB4545068350',
    location_description: 'Tactical Fuel Distribution System, BSA north',
    last_resupply_date: dateStr(-5),
    next_resupply_eta: dateStr(0),
    equipment_id: null,
    created_at: isoStr(-45),
    updated_at: isoStr(0, -1),
  },
  {
    id: 4,
    unit_id: 4,
    name: 'Bladder-South',
    facility_type: 'BLADDER_FARM',
    fuel_type: 'JP8',
    capacity_gallons: 20000,
    current_gallons: 1800,
    fill_percentage: 9,
    status: 'DEGRADED',
    latitude: 33.3400,
    longitude: 44.3500,
    mgrs: '38SMB4490067700',
    location_description: 'Bladder farm, PB DELTA perimeter',
    last_resupply_date: dateStr(-7),
    next_resupply_eta: dateStr(1),
    equipment_id: null,
    created_at: isoStr(-20),
    updated_at: isoStr(0, -3),
  },
];

// ---------------------------------------------------------------------------
// Mock Transactions (8 records)
// ---------------------------------------------------------------------------

const MOCK_TRANSACTIONS: FuelTransaction[] = [
  {
    id: 1,
    storage_point_id: 2,
    storage_point_name: 'FSP-Main',
    transaction_type: 'RECEIPT',
    fuel_type: 'JP8',
    quantity_gallons: 15000,
    receiving_unit_id: null,
    vehicle_bumper_number: null,
    vehicle_type: 'HEMTT M978',
    document_number: 'FSP-R-2026-0041',
    meter_reading_before: 16500,
    meter_reading_after: 31500,
    notes: 'Bulk resupply from CSSB fuel platoon',
    performed_by_name: 'SSgt Martinez',
    transaction_date: isoStr(-2, 6),
    created_at: isoStr(-2, 6),
  },
  {
    id: 2,
    storage_point_id: 1,
    storage_point_name: 'FARP-Alpha',
    transaction_type: 'ISSUE',
    fuel_type: 'JP8',
    quantity_gallons: 800,
    receiving_unit_id: 4,
    vehicle_bumper_number: 'HQ-12',
    vehicle_type: 'CH-53E',
    document_number: 'FARP-I-2026-0128',
    meter_reading_before: 8000,
    meter_reading_after: 7200,
    notes: 'Hot refuel — CH-53E CASEVAC mission',
    performed_by_name: 'Cpl Davis',
    transaction_date: isoStr(0, -2),
    created_at: isoStr(0, -2),
  },
  {
    id: 3,
    storage_point_id: 2,
    storage_point_name: 'FSP-Main',
    transaction_type: 'ISSUE',
    fuel_type: 'JP8',
    quantity_gallons: 2400,
    receiving_unit_id: 4,
    vehicle_bumper_number: null,
    vehicle_type: null,
    document_number: 'FSP-I-2026-0312',
    meter_reading_before: 33900,
    meter_reading_after: 31500,
    notes: 'Bulk issue to 1st PLT vehicle section (8x JLTV)',
    performed_by_name: 'Sgt Johnson',
    transaction_date: isoStr(-1, 8),
    created_at: isoStr(-1, 8),
  },
  {
    id: 4,
    storage_point_id: 3,
    storage_point_name: 'TFDS-1',
    transaction_type: 'TRANSFER',
    fuel_type: 'DF2',
    quantity_gallons: 5000,
    receiving_unit_id: null,
    vehicle_bumper_number: null,
    vehicle_type: 'M969 Tanker',
    document_number: 'TFDS-T-2026-0015',
    meter_reading_before: 9200,
    meter_reading_after: 4200,
    notes: 'Transfer to FARP-Bravo (adjacent unit)',
    performed_by_name: 'SSgt Williams',
    transaction_date: isoStr(-1, 4),
    created_at: isoStr(-1, 4),
  },
  {
    id: 5,
    storage_point_id: 4,
    storage_point_name: 'Bladder-South',
    transaction_type: 'LOSS',
    fuel_type: 'JP8',
    quantity_gallons: 200,
    receiving_unit_id: null,
    vehicle_bumper_number: null,
    vehicle_type: null,
    document_number: 'BLD-L-2026-0003',
    meter_reading_before: 2000,
    meter_reading_after: 1800,
    notes: 'Bladder seam leak — repaired. Loss documented per ATP 4-43.',
    performed_by_name: 'Sgt Thompson',
    transaction_date: isoStr(-3, 10),
    created_at: isoStr(-3, 10),
  },
  {
    id: 6,
    storage_point_id: 1,
    storage_point_name: 'FARP-Alpha',
    transaction_type: 'RECEIPT',
    fuel_type: 'JP8',
    quantity_gallons: 5000,
    receiving_unit_id: null,
    vehicle_bumper_number: null,
    vehicle_type: 'HEMTT M978',
    document_number: 'FARP-R-2026-0089',
    meter_reading_before: 3000,
    meter_reading_after: 8000,
    notes: 'Scheduled resupply from FSP-Main',
    performed_by_name: 'Cpl Davis',
    transaction_date: isoStr(-1, 6),
    created_at: isoStr(-1, 6),
  },
  {
    id: 7,
    storage_point_id: 2,
    storage_point_name: 'FSP-Main',
    transaction_type: 'SAMPLE',
    fuel_type: 'JP8',
    quantity_gallons: 1,
    receiving_unit_id: null,
    vehicle_bumper_number: null,
    vehicle_type: null,
    document_number: 'FSP-S-2026-0044',
    meter_reading_before: null,
    meter_reading_after: null,
    notes: 'Routine fuel quality sample — sent to lab',
    performed_by_name: 'LCpl Brown',
    transaction_date: isoStr(-1, 9),
    created_at: isoStr(-1, 9),
  },
  {
    id: 8,
    storage_point_id: 4,
    storage_point_name: 'Bladder-South',
    transaction_type: 'ISSUE',
    fuel_type: 'JP8',
    quantity_gallons: 1200,
    receiving_unit_id: 4,
    vehicle_bumper_number: 'W-21',
    vehicle_type: 'MTVR',
    document_number: 'BLD-I-2026-0078',
    meter_reading_before: 3000,
    meter_reading_after: 1800,
    notes: 'Issue to MTVR convoy — 4 vehicles',
    performed_by_name: 'Sgt Thompson',
    transaction_date: isoStr(0, -6),
    created_at: isoStr(0, -6),
  },
];

// ---------------------------------------------------------------------------
// Mock Consumption Rates (6 equipment types)
// ---------------------------------------------------------------------------

const MOCK_CONSUMPTION_RATES: FuelConsumptionRate[] = [
  {
    id: 1,
    equipment_catalog_item_id: 101,
    equipment_name: 'JLTV (M1280)',
    fuel_type: 'JP8',
    gallons_per_hour_idle: 1.2,
    gallons_per_hour_tactical: 5.8,
    gallons_per_mile: 0.21,
    gallons_per_flight_hour: null,
    source: 'TM_REFERENCE',
    notes: 'TM 9-2320-412-10',
    updated_at: isoStr(-10),
  },
  {
    id: 2,
    equipment_catalog_item_id: 102,
    equipment_name: 'HMMWV (M1151)',
    fuel_type: 'DF2',
    gallons_per_hour_idle: 0.8,
    gallons_per_hour_tactical: 3.5,
    gallons_per_mile: 0.14,
    gallons_per_flight_hour: null,
    source: 'TM_REFERENCE',
    notes: 'TM 9-2320-387-10',
    updated_at: isoStr(-15),
  },
  {
    id: 3,
    equipment_catalog_item_id: 103,
    equipment_name: 'MTVR (MK23)',
    fuel_type: 'JP8',
    gallons_per_hour_idle: 1.5,
    gallons_per_hour_tactical: 7.2,
    gallons_per_mile: 0.28,
    gallons_per_flight_hour: null,
    source: 'TM_REFERENCE',
    notes: 'TM 9-2320-406-10',
    updated_at: isoStr(-12),
  },
  {
    id: 4,
    equipment_catalog_item_id: 104,
    equipment_name: 'LAV-25',
    fuel_type: 'DF2',
    gallons_per_hour_idle: 2.0,
    gallons_per_hour_tactical: 9.5,
    gallons_per_mile: 0.35,
    gallons_per_flight_hour: null,
    source: 'CALCULATED',
    notes: 'Based on unit historical data',
    updated_at: isoStr(-8),
  },
  {
    id: 5,
    equipment_catalog_item_id: 105,
    equipment_name: 'CH-53E Super Stallion',
    fuel_type: 'JP8',
    gallons_per_hour_idle: 0,
    gallons_per_hour_tactical: 0,
    gallons_per_mile: null,
    gallons_per_flight_hour: 463,
    source: 'TM_REFERENCE',
    notes: 'NAVAIR 01-230HLH-1',
    updated_at: isoStr(-20),
  },
  {
    id: 6,
    equipment_catalog_item_id: 106,
    equipment_name: 'UH-1Y Venom',
    fuel_type: 'JP8',
    gallons_per_hour_idle: 0,
    gallons_per_hour_tactical: 0,
    gallons_per_mile: null,
    gallons_per_flight_hour: 178,
    source: 'TM_REFERENCE',
    notes: 'NAVAIR 01-110HCE-1',
    updated_at: isoStr(-18),
  },
];

// ---------------------------------------------------------------------------
// Mock Dashboard
// ---------------------------------------------------------------------------

const MOCK_DASHBOARD: FuelDashboard = {
  unit_id: 4,
  storage_points: MOCK_STORAGE_POINTS,
  total_capacity_gallons: 105000,
  total_on_hand_gallons: 44700,
  fill_percentage: 42.6,
  days_of_supply: 2.8,
  limiting_fuel_type: 'DF2',
  alert: true,
  forecast: {
    operational_tempo: 'HIGH',
    projected_daily_consumption: 15800,
    days_of_supply: 2.8,
    resupply_required_by: dateStr(2),
  },
};

// ---------------------------------------------------------------------------
// Mock Forecast
// ---------------------------------------------------------------------------

const MOCK_FORECAST: FuelForecast = {
  unit_id: 4,
  forecast_date: dateStr(0),
  operational_tempo: 'HIGH',
  projected_daily_consumption_gallons: 15800,
  current_on_hand_gallons: 44700,
  days_of_supply: 2.8,
  resupply_required_by_date: dateStr(2),
  alert: true,
};

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getFuelDashboard(unitId: number): Promise<FuelDashboard> {
  if (isDemoMode) {
    await mockDelay();
    return { ...MOCK_DASHBOARD, unit_id: unitId };
  }
  const response = await apiClient.get<{ data: FuelDashboard }>(`/units/${unitId}/fuel/dashboard`);
  return response.data.data;
}

export async function getFuelStoragePoints(unitId: number): Promise<FuelStoragePoint[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_STORAGE_POINTS.filter((sp) => sp.unit_id === unitId || unitId === 4);
  }
  const response = await apiClient.get<{ data: FuelStoragePoint[] }>('/fuel/storage-points', {
    params: { unit_id: unitId },
  });
  return response.data.data;
}

export async function getFuelStoragePointDetail(
  id: number,
): Promise<FuelStoragePoint & { recent_transactions: FuelTransaction[] }> {
  if (isDemoMode) {
    await mockDelay();
    const sp = MOCK_STORAGE_POINTS.find((s) => s.id === id) ?? MOCK_STORAGE_POINTS[0];
    const txns = MOCK_TRANSACTIONS.filter((t) => t.storage_point_id === id);
    return { ...sp, recent_transactions: txns };
  }
  const response = await apiClient.get<{
    data: FuelStoragePoint & { recent_transactions: FuelTransaction[] };
  }>(`/fuel/storage-points/${id}`);
  return response.data.data;
}

export async function createFuelStoragePoint(
  data: Partial<FuelStoragePoint>,
): Promise<FuelStoragePoint> {
  if (isDemoMode) {
    await mockDelay();
    return {
      id: 100 + Math.floor(Math.random() * 900),
      unit_id: (data.unit_id as number) ?? 4,
      name: (data.name as string) ?? 'New Point',
      facility_type: data.facility_type ?? 'FSP',
      fuel_type: data.fuel_type ?? 'JP8',
      capacity_gallons: data.capacity_gallons ?? 10000,
      current_gallons: data.current_gallons ?? 0,
      fill_percentage: 0,
      status: 'OPERATIONAL',
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      mgrs: data.mgrs ?? null,
      location_description: data.location_description ?? null,
      last_resupply_date: null,
      next_resupply_eta: null,
      equipment_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  const response = await apiClient.post<{ data: FuelStoragePoint }>('/fuel/storage-points', data);
  return response.data.data;
}

export async function updateFuelStoragePoint(
  id: number,
  data: Partial<FuelStoragePoint>,
): Promise<FuelStoragePoint> {
  if (isDemoMode) {
    await mockDelay();
    const existing = MOCK_STORAGE_POINTS.find((s) => s.id === id) ?? MOCK_STORAGE_POINTS[0];
    return { ...existing, ...data, id, updated_at: new Date().toISOString() };
  }
  const response = await apiClient.patch<{ data: FuelStoragePoint }>(
    `/fuel/storage-points/${id}`,
    data,
  );
  return response.data.data;
}

export async function recordFuelTransaction(
  data: Partial<FuelTransaction>,
): Promise<{ transaction_id: number; new_inventory: number; fill_percentage: number }> {
  if (isDemoMode) {
    await mockDelay();
    return {
      transaction_id: 100 + Math.floor(Math.random() * 900),
      new_inventory: 5000,
      fill_percentage: 50,
    };
  }
  const response = await apiClient.post<{
    data: { transaction_id: number; new_inventory: number; fill_percentage: number };
  }>('/fuel/transactions', data);
  return response.data.data;
}

export async function getFuelTransactions(params: {
  unit_id?: number;
  storage_point_id?: number;
  transaction_type?: string;
  period_days?: number;
}): Promise<FuelTransaction[]> {
  if (isDemoMode) {
    await mockDelay();
    let results = [...MOCK_TRANSACTIONS];
    if (params.storage_point_id) {
      results = results.filter((t) => t.storage_point_id === params.storage_point_id);
    }
    if (params.transaction_type) {
      results = results.filter((t) => t.transaction_type === params.transaction_type);
    }
    return results.sort(
      (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime(),
    );
  }
  const response = await apiClient.get<{ data: FuelTransaction[] }>('/fuel/transactions', {
    params,
  });
  return response.data.data;
}

export async function getFuelConsumptionRates(): Promise<FuelConsumptionRate[]> {
  if (isDemoMode) {
    await mockDelay();
    return [...MOCK_CONSUMPTION_RATES];
  }
  const response = await apiClient.get<{ data: FuelConsumptionRate[] }>(
    '/fuel/consumption-rates',
  );
  return response.data.data;
}

export async function updateFuelConsumptionRate(
  id: number,
  data: Partial<FuelConsumptionRate>,
): Promise<FuelConsumptionRate> {
  if (isDemoMode) {
    await mockDelay();
    const existing = MOCK_CONSUMPTION_RATES.find((r) => r.id === id) ?? MOCK_CONSUMPTION_RATES[0];
    return { ...existing, ...data, id, updated_at: new Date().toISOString() };
  }
  const response = await apiClient.patch<{ data: FuelConsumptionRate }>(
    `/fuel/consumption-rates/${id}`,
    data,
  );
  return response.data.data;
}

export async function getFuelForecast(
  unitId: number,
  tempo?: string,
): Promise<FuelForecast> {
  if (isDemoMode) {
    await mockDelay();
    if (tempo && tempo !== 'HIGH') {
      const multiplier = tempo === 'LOW' ? 0.5 : tempo === 'MEDIUM' ? 0.75 : tempo === 'SURGE' ? 1.4 : 1;
      const dailyBurn = 15800 * multiplier;
      const dos = 44700 / dailyBurn;
      return {
        ...MOCK_FORECAST,
        unit_id: unitId,
        operational_tempo: tempo as FuelForecast['operational_tempo'],
        projected_daily_consumption_gallons: Math.round(dailyBurn),
        days_of_supply: Math.round(dos * 10) / 10,
        resupply_required_by_date: dateStr(Math.floor(dos)),
        alert: dos <= 3,
      };
    }
    return { ...MOCK_FORECAST, unit_id: unitId };
  }
  const response = await apiClient.get<{ data: FuelForecast }>(`/units/${unitId}/fuel/forecast`, {
    params: tempo ? { tempo } : undefined,
  });
  return response.data.data;
}

export async function generateFuelForecast(
  unitId: number,
  data: { operational_tempo: string; planning_days?: number },
): Promise<FuelForecast> {
  if (isDemoMode) {
    await mockDelay();
    return getFuelForecast(unitId, data.operational_tempo);
  }
  const response = await apiClient.post<{ data: FuelForecast }>(
    `/units/${unitId}/fuel/forecast`,
    data,
  );
  return response.data.data;
}

export async function calculateBulkRequirement(data: {
  equipment_counts: Array<{ equipment_catalog_item_id: number; count: number }>;
  operational_tempo: string;
  duration_days: number;
}): Promise<{
  total_gallons: number;
  by_fuel_type: Array<{ fuel_type: string; gallons: number }>;
  by_equipment: Array<{ equipment_name: string; gallons: number }>;
}> {
  if (isDemoMode) {
    await mockDelay();
    return {
      total_gallons: 48500,
      by_fuel_type: [
        { fuel_type: 'JP8', gallons: 35200 },
        { fuel_type: 'DF2', gallons: 13300 },
      ],
      by_equipment: [
        { equipment_name: 'JLTV (M1280)', gallons: 12600 },
        { equipment_name: 'HMMWV (M1151)', gallons: 4800 },
        { equipment_name: 'MTVR (MK23)', gallons: 9800 },
        { equipment_name: 'LAV-25', gallons: 8200 },
        { equipment_name: 'CH-53E Super Stallion', gallons: 9260 },
        { equipment_name: 'UH-1Y Venom', gallons: 3840 },
      ],
    };
  }
  const response = await apiClient.post<{
    data: {
      total_gallons: number;
      by_fuel_type: Array<{ fuel_type: string; gallons: number }>;
      by_equipment: Array<{ equipment_name: string; gallons: number }>;
    };
  }>('/fuel/bulk-requirement', data);
  return response.data.data;
}
