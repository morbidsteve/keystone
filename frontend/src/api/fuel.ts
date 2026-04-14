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
    unitId: 4,
    name: 'FARP-Alpha',
    facilityType: 'FARP',
    fuelType: 'JP8',
    capacityGallons: 10000,
    currentGallons: 7200,
    fillPercentage: 72,
    status: 'OPERATIONAL',
    latitude: 33.3528,
    longitude: 44.3661,
    mgrs: '38SMB4512067890',
    locationDescription: 'Forward Arming and Refueling Point, MSR TAMPA km 12',
    lastResupplyDate: dateStr(-1),
    nextResupplyEta: dateStr(2),
    equipmentId: null,
    createdAt: isoStr(-30),
    updatedAt: isoStr(0, -2),
  },
  {
    id: 2,
    unitId: 4,
    name: 'FSP-Main',
    facilityType: 'FSP',
    fuelType: 'JP8',
    capacityGallons: 50000,
    currentGallons: 31500,
    fillPercentage: 63,
    status: 'OPERATIONAL',
    latitude: 33.3650,
    longitude: 44.3700,
    mgrs: '38SMB4520068000',
    locationDescription: 'Fuel Supply Point, FOB WARRIOR main gate',
    lastResupplyDate: dateStr(-2),
    nextResupplyEta: dateStr(1),
    equipmentId: null,
    createdAt: isoStr(-60),
    updatedAt: isoStr(0, -4),
  },
  {
    id: 3,
    unitId: 4,
    name: 'TFDS-1',
    facilityType: 'TANK_FARM',
    fuelType: 'DF2',
    capacityGallons: 25000,
    currentGallons: 4200,
    fillPercentage: 16.8,
    status: 'DEGRADED',
    latitude: 33.3800,
    longitude: 44.3900,
    mgrs: '38SMB4545068350',
    locationDescription: 'Tactical Fuel Distribution System, BSA north',
    lastResupplyDate: dateStr(-5),
    nextResupplyEta: dateStr(0),
    equipmentId: null,
    createdAt: isoStr(-45),
    updatedAt: isoStr(0, -1),
  },
  {
    id: 4,
    unitId: 4,
    name: 'Bladder-South',
    facilityType: 'BLADDER_FARM',
    fuelType: 'JP8',
    capacityGallons: 20000,
    currentGallons: 1800,
    fillPercentage: 9,
    status: 'DEGRADED',
    latitude: 33.3400,
    longitude: 44.3500,
    mgrs: '38SMB4490067700',
    locationDescription: 'Bladder farm, PB DELTA perimeter',
    lastResupplyDate: dateStr(-7),
    nextResupplyEta: dateStr(1),
    equipmentId: null,
    createdAt: isoStr(-20),
    updatedAt: isoStr(0, -3),
  },
];

// ---------------------------------------------------------------------------
// Mock Transactions (8 records)
// ---------------------------------------------------------------------------

const MOCK_TRANSACTIONS: FuelTransaction[] = [
  {
    id: 1,
    storagePointId: 2,
    storagePointName: 'FSP-Main',
    transactionType: 'RECEIPT',
    fuelType: 'JP8',
    quantityGallons: 15000,
    receivingUnitId: null,
    vehicleBumperNumber: null,
    vehicleType: 'HEMTT M978',
    documentNumber: 'FSP-R-2026-0041',
    meterReadingBefore: 16500,
    meterReadingAfter: 31500,
    notes: 'Bulk resupply from CSSB fuel platoon',
    performedByName: 'SSgt Martinez',
    transactionDate: isoStr(-2, 6),
    createdAt: isoStr(-2, 6),
  },
  {
    id: 2,
    storagePointId: 1,
    storagePointName: 'FARP-Alpha',
    transactionType: 'ISSUE',
    fuelType: 'JP8',
    quantityGallons: 800,
    receivingUnitId: 4,
    vehicleBumperNumber: 'HQ-12',
    vehicleType: 'CH-53E',
    documentNumber: 'FARP-I-2026-0128',
    meterReadingBefore: 8000,
    meterReadingAfter: 7200,
    notes: 'Hot refuel — CH-53E CASEVAC mission',
    performedByName: 'Cpl Davis',
    transactionDate: isoStr(0, -2),
    createdAt: isoStr(0, -2),
  },
  {
    id: 3,
    storagePointId: 2,
    storagePointName: 'FSP-Main',
    transactionType: 'ISSUE',
    fuelType: 'JP8',
    quantityGallons: 2400,
    receivingUnitId: 4,
    vehicleBumperNumber: null,
    vehicleType: null,
    documentNumber: 'FSP-I-2026-0312',
    meterReadingBefore: 33900,
    meterReadingAfter: 31500,
    notes: 'Bulk issue to 1st PLT vehicle section (8x JLTV)',
    performedByName: 'Sgt Johnson',
    transactionDate: isoStr(-1, 8),
    createdAt: isoStr(-1, 8),
  },
  {
    id: 4,
    storagePointId: 3,
    storagePointName: 'TFDS-1',
    transactionType: 'TRANSFER',
    fuelType: 'DF2',
    quantityGallons: 5000,
    receivingUnitId: null,
    vehicleBumperNumber: null,
    vehicleType: 'M969 Tanker',
    documentNumber: 'TFDS-T-2026-0015',
    meterReadingBefore: 9200,
    meterReadingAfter: 4200,
    notes: 'Transfer to FARP-Bravo (adjacent unit)',
    performedByName: 'SSgt Williams',
    transactionDate: isoStr(-1, 4),
    createdAt: isoStr(-1, 4),
  },
  {
    id: 5,
    storagePointId: 4,
    storagePointName: 'Bladder-South',
    transactionType: 'LOSS',
    fuelType: 'JP8',
    quantityGallons: 200,
    receivingUnitId: null,
    vehicleBumperNumber: null,
    vehicleType: null,
    documentNumber: 'BLD-L-2026-0003',
    meterReadingBefore: 2000,
    meterReadingAfter: 1800,
    notes: 'Bladder seam leak — repaired. Loss documented per ATP 4-43.',
    performedByName: 'Sgt Thompson',
    transactionDate: isoStr(-3, 10),
    createdAt: isoStr(-3, 10),
  },
  {
    id: 6,
    storagePointId: 1,
    storagePointName: 'FARP-Alpha',
    transactionType: 'RECEIPT',
    fuelType: 'JP8',
    quantityGallons: 5000,
    receivingUnitId: null,
    vehicleBumperNumber: null,
    vehicleType: 'HEMTT M978',
    documentNumber: 'FARP-R-2026-0089',
    meterReadingBefore: 3000,
    meterReadingAfter: 8000,
    notes: 'Scheduled resupply from FSP-Main',
    performedByName: 'Cpl Davis',
    transactionDate: isoStr(-1, 6),
    createdAt: isoStr(-1, 6),
  },
  {
    id: 7,
    storagePointId: 2,
    storagePointName: 'FSP-Main',
    transactionType: 'SAMPLE',
    fuelType: 'JP8',
    quantityGallons: 1,
    receivingUnitId: null,
    vehicleBumperNumber: null,
    vehicleType: null,
    documentNumber: 'FSP-S-2026-0044',
    meterReadingBefore: null,
    meterReadingAfter: null,
    notes: 'Routine fuel quality sample — sent to lab',
    performedByName: 'LCpl Brown',
    transactionDate: isoStr(-1, 9),
    createdAt: isoStr(-1, 9),
  },
  {
    id: 8,
    storagePointId: 4,
    storagePointName: 'Bladder-South',
    transactionType: 'ISSUE',
    fuelType: 'JP8',
    quantityGallons: 1200,
    receivingUnitId: 4,
    vehicleBumperNumber: 'W-21',
    vehicleType: 'MTVR',
    documentNumber: 'BLD-I-2026-0078',
    meterReadingBefore: 3000,
    meterReadingAfter: 1800,
    notes: 'Issue to MTVR convoy — 4 vehicles',
    performedByName: 'Sgt Thompson',
    transactionDate: isoStr(0, -6),
    createdAt: isoStr(0, -6),
  },
];

// ---------------------------------------------------------------------------
// Mock Consumption Rates (6 equipment types)
// ---------------------------------------------------------------------------

const MOCK_CONSUMPTION_RATES: FuelConsumptionRate[] = [
  {
    id: 1,
    equipmentCatalogItemId: 101,
    equipmentName: 'JLTV (M1280)',
    fuelType: 'JP8',
    gallonsPerHourIdle: 1.2,
    gallonsPerHourTactical: 5.8,
    gallonsPerMile: 0.21,
    gallonsPerFlightHour: null,
    source: 'TM_REFERENCE',
    notes: 'TM 9-2320-412-10',
    updatedAt: isoStr(-10),
  },
  {
    id: 2,
    equipmentCatalogItemId: 102,
    equipmentName: 'HMMWV (M1151)',
    fuelType: 'DF2',
    gallonsPerHourIdle: 0.8,
    gallonsPerHourTactical: 3.5,
    gallonsPerMile: 0.14,
    gallonsPerFlightHour: null,
    source: 'TM_REFERENCE',
    notes: 'TM 9-2320-387-10',
    updatedAt: isoStr(-15),
  },
  {
    id: 3,
    equipmentCatalogItemId: 103,
    equipmentName: 'MTVR (MK23)',
    fuelType: 'JP8',
    gallonsPerHourIdle: 1.5,
    gallonsPerHourTactical: 7.2,
    gallonsPerMile: 0.28,
    gallonsPerFlightHour: null,
    source: 'TM_REFERENCE',
    notes: 'TM 9-2320-406-10',
    updatedAt: isoStr(-12),
  },
  {
    id: 4,
    equipmentCatalogItemId: 104,
    equipmentName: 'LAV-25',
    fuelType: 'DF2',
    gallonsPerHourIdle: 2.0,
    gallonsPerHourTactical: 9.5,
    gallonsPerMile: 0.35,
    gallonsPerFlightHour: null,
    source: 'CALCULATED',
    notes: 'Based on unit historical data',
    updatedAt: isoStr(-8),
  },
  {
    id: 5,
    equipmentCatalogItemId: 105,
    equipmentName: 'CH-53E Super Stallion',
    fuelType: 'JP8',
    gallonsPerHourIdle: 0,
    gallonsPerHourTactical: 0,
    gallonsPerMile: null,
    gallonsPerFlightHour: 463,
    source: 'TM_REFERENCE',
    notes: 'NAVAIR 01-230HLH-1',
    updatedAt: isoStr(-20),
  },
  {
    id: 6,
    equipmentCatalogItemId: 106,
    equipmentName: 'UH-1Y Venom',
    fuelType: 'JP8',
    gallonsPerHourIdle: 0,
    gallonsPerHourTactical: 0,
    gallonsPerMile: null,
    gallonsPerFlightHour: 178,
    source: 'TM_REFERENCE',
    notes: 'NAVAIR 01-110HCE-1',
    updatedAt: isoStr(-18),
  },
];

// ---------------------------------------------------------------------------
// Mock Dashboard
// ---------------------------------------------------------------------------

const MOCK_DASHBOARD: FuelDashboard = {
  unitId: 4,
  storagePoints: MOCK_STORAGE_POINTS,
  totalCapacityGallons: 105000,
  totalOnHandGallons: 44700,
  fillPercentage: 42.6,
  daysOfSupply: 2.8,
  limitingFuelType: 'DF2',
  alert: true,
  forecast: {
    operationalTempo: 'HIGH',
    projectedDailyConsumption: 15800,
    daysOfSupply: 2.8,
    resupplyRequiredBy: dateStr(2),
  },
};

// ---------------------------------------------------------------------------
// Mock Forecast
// ---------------------------------------------------------------------------

const MOCK_FORECAST: FuelForecast = {
  unitId: 4,
  forecastDate: dateStr(0),
  operationalTempo: 'HIGH',
  projectedDailyConsumptionGallons: 15800,
  currentOnHandGallons: 44700,
  daysOfSupply: 2.8,
  resupplyRequiredByDate: dateStr(2),
  alert: true,
};

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getFuelDashboard(unitId: number): Promise<FuelDashboard> {
  if (isDemoMode) {
    await mockDelay();
    return { ...MOCK_DASHBOARD, unitId: unitId };
  }
  const response = await apiClient.get<{ data: Record<string, unknown> | null }>(`/fuel/dashboard/${unitId}`);
  const raw = (response.data.data ?? {}) as Record<string, unknown>;
  const onHand = (raw.totalOnHandGallons as number) ?? 0;
  const fc = (raw.forecast as Record<string, unknown> | null) ?? null;
  const dailyConsumption = (fc?.projectedDailyConsumption as number) ?? 0;
  const daysOfSupply = (raw.daysOfSupply as number | undefined) ?? (dailyConsumption > 0 ? onHand / dailyConsumption : 30);
  return {
    unitId: (raw.unitId as number) ?? unitId,
    totalCapacityGallons: (raw.totalCapacityGallons as number) ?? 0,
    totalOnHandGallons: onHand,
    fillPercentage: (raw.fillPercentage as number | undefined) ?? (raw.overallFillPct as number | undefined) ?? 0,
    daysOfSupply,
    limitingFuelType: (raw.limitingFuelType as string | null) ?? null,
    storagePoints: Array.isArray(raw.storagePoints) ? (raw.storagePoints as FuelStoragePoint[]) : [],
    alert: (raw.alert as boolean | undefined) ?? (daysOfSupply <= 3),
    forecast: {
      operationalTempo: ((fc?.operationalTempo as string) ?? 'GARRISON') as FuelDashboard['forecast']['operationalTempo'],
      projectedDailyConsumption: dailyConsumption,
      daysOfSupply,
      resupplyRequiredBy: (fc?.resupplyRequiredBy as string) ?? new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    },
  };
}

export async function getFuelStoragePoints(unitId: number): Promise<FuelStoragePoint[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_STORAGE_POINTS.filter((sp) => sp.unitId === unitId || unitId === 4);
  }
  const response = await apiClient.get<{ data: FuelStoragePoint[] }>('/fuel/storage-points', {
    params: { unitId: unitId },
  });
  return response.data.data;
}

export async function getFuelStoragePointDetail(
  id: number,
): Promise<FuelStoragePoint & { recent_transactions: FuelTransaction[] }> {
  if (isDemoMode) {
    await mockDelay();
    const sp = MOCK_STORAGE_POINTS.find((s) => s.id === id) ?? MOCK_STORAGE_POINTS[0];
    const txns = MOCK_TRANSACTIONS.filter((t) => t.storagePointId === id);
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
      unitId: (data.unitId as number) ?? 4,
      name: (data.name as string) ?? 'New Point',
      facilityType: data.facilityType ?? 'FSP',
      fuelType: data.fuelType ?? 'JP8',
      capacityGallons: data.capacityGallons ?? 10000,
      currentGallons: data.currentGallons ?? 0,
      fillPercentage: 0,
      status: 'OPERATIONAL',
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      mgrs: data.mgrs ?? null,
      locationDescription: data.locationDescription ?? null,
      lastResupplyDate: null,
      nextResupplyEta: null,
      equipmentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    return { ...existing, ...data, id, updatedAt: new Date().toISOString() };
  }
  const response = await apiClient.patch<{ data: FuelStoragePoint }>(
    `/fuel/storage-points/${id}`,
    data,
  );
  return response.data.data;
}

export async function recordFuelTransaction(
  data: Partial<FuelTransaction>,
): Promise<{ transactionId: number; newInventory: number; fillPercentage: number }> {
  if (isDemoMode) {
    await mockDelay();
    return {
      transactionId: 100 + Math.floor(Math.random() * 900),
      newInventory: 5000,
      fillPercentage: 50,
    };
  }
  const response = await apiClient.post<{
    data: { transactionId: number; newInventory: number; fillPercentage: number };
  }>('/fuel/transactions', data);
  return response.data.data;
}

export async function getFuelTransactions(params: {
  unitId?: number;
  storagePointId?: number;
  transactionType?: string;
  periodDays?: number;
}): Promise<FuelTransaction[]> {
  if (isDemoMode) {
    await mockDelay();
    let results = [...MOCK_TRANSACTIONS];
    if (params.storagePointId) {
      results = results.filter((t) => t.storagePointId === params.storagePointId);
    }
    if (params.transactionType) {
      results = results.filter((t) => t.transactionType === params.transactionType);
    }
    return results.sort(
      (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
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
    return { ...existing, ...data, id, updatedAt: new Date().toISOString() };
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
        unitId: unitId,
        operationalTempo: tempo as FuelForecast['operationalTempo'],
        projectedDailyConsumptionGallons: Math.round(dailyBurn),
        daysOfSupply: Math.round(dos * 10) / 10,
        resupplyRequiredByDate: dateStr(Math.floor(dos)),
        alert: dos <= 3,
      };
    }
    return { ...MOCK_FORECAST, unitId: unitId };
  }
  const response = await apiClient.get<{ data: FuelForecast }>(`/fuel/forecast/${unitId}`, {
    params: tempo ? { tempo } : undefined,
  });
  return response.data.data;
}

export async function generateFuelForecast(
  unitId: number,
  data: { operationalTempo: string; planning_days?: number },
): Promise<FuelForecast> {
  if (isDemoMode) {
    await mockDelay();
    return getFuelForecast(unitId, data.operationalTempo);
  }
  const response = await apiClient.post<{ data: FuelForecast }>(
    `/fuel/forecast/${unitId}`,
    data,
  );
  return response.data.data;
}

export async function calculateBulkRequirement(data: {
  equipmentCounts: Array<{ equipmentCatalogItemId: number; count: number }>;
  operationalTempo: string;
  durationDays: number;
}): Promise<{
  totalGallons: number;
  byFuelType: Array<{ fuelType: string; gallons: number }>;
  byEquipment: Array<{ equipmentName: string; gallons: number }>;
}> {
  if (isDemoMode) {
    await mockDelay();
    return {
      totalGallons: 48500,
      byFuelType: [
        { fuelType: 'JP8', gallons: 35200 },
        { fuelType: 'DF2', gallons: 13300 },
      ],
      byEquipment: [
        { equipmentName: 'JLTV (M1280)', gallons: 12600 },
        { equipmentName: 'HMMWV (M1151)', gallons: 4800 },
        { equipmentName: 'MTVR (MK23)', gallons: 9800 },
        { equipmentName: 'LAV-25', gallons: 8200 },
        { equipmentName: 'CH-53E Super Stallion', gallons: 9260 },
        { equipmentName: 'UH-1Y Venom', gallons: 3840 },
      ],
    };
  }
  const response = await apiClient.post<{
    data: {
      totalGallons: number;
      byFuelType: Array<{ fuelType: string; gallons: number }>;
      byEquipment: Array<{ equipmentName: string; gallons: number }>;
    };
  }>('/fuel/bulk-requirement', data);
  return response.data.data;
}
