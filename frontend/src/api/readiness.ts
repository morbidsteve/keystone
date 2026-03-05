// =============================================================================
// KEYSTONE Readiness & Reporting — API functions
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';
import { DEMO_UNITS } from './mockData';
import type {
  ReadinessSnapshot,
  UnitStrengthReport,
  ReadinessRollup,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Helper: date string N days ago (ISO short form)
// ---------------------------------------------------------------------------

function dateStr(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split('T')[0];
}

function isoStr(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Unit readiness configurations (demo mode)
// ---------------------------------------------------------------------------

interface UnitReadinessConfig {
  unitId: number;
  unitName: string;
  cRating: string;
  sRating: string;
  rRating: string;
  pRating: string;
  tRating: string;
  overallPct: number;
  equipmentPct: number;
  supplyPct: number;
  personnelPct: number;
  trainingPct: number;
  limitingFactor: string | null;
}

// ---------------------------------------------------------------------------
// Build parent→children map and unit lookup from DEMO_UNITS (module-level)
// ---------------------------------------------------------------------------

const childMap = new Map<string, typeof DEMO_UNITS>();
const unitById = new Map<string, (typeof DEMO_UNITS)[0]>();
for (const u of DEMO_UNITS) {
  unitById.set(u.id, u);
  if (u.parentId) {
    const siblings = childMap.get(u.parentId) ?? [];
    siblings.push(u);
    childMap.set(u.parentId, siblings);
  }
}

// ---------------------------------------------------------------------------
// Dynamic config generation (seeded random, deterministic per unitId)
// ---------------------------------------------------------------------------

function ratingFromPct(pct: number, prefix: string): string {
  if (pct >= 90) return `${prefix}-1`;
  if (pct >= 75) return `${prefix}-2`;
  if (pct >= 60) return `${prefix}-3`;
  return `${prefix}-4`;
}

const limitingFactors = [
  'CL IX repair parts awaiting FEDLOG',
  'Supply Class III bulk fuel below threshold',
  'Equipment readiness below DRRS standard',
  'Personnel fill rate below 80%',
  'CL V ammunition stocks critically low',
  'Multiple vehicles deadlined awaiting parts',
  'Training qualification currency expired for key billets',
];

function generateGenericConfig(unitId: number, unitName: string, echelon: string): UnitReadinessConfig {
  // Echelon-based readiness ranges (higher echelons trend toward average, lower can vary more)
  const ranges: Record<string, [number, number]> = {
    'MEF':       [75, 88],
    'DIVISION':  [72, 86],
    'REGIMENT':  [70, 88],
    'BATTALION': [60, 95],
    'COMPANY':   [55, 98],
    'PLATOON':   [50, 100],
  };
  const [lo, hi] = ranges[echelon] ?? [60, 95];

  const pct = (fieldOffset: number) => {
    // Deterministic pseudo-random per unitId + field
    let s = unitId * 1337 + fieldOffset * 7919;
    s = (s * 16807 + 12345) % 2147483647;
    const r = (s % 1000) / 1000;
    return Math.round((lo + r * (hi - lo)) * 10) / 10;
  };

  const overallPct = pct(0);
  const equipmentPct = pct(1);
  const supplyPct = pct(2);
  const personnelPct = pct(3);
  const trainingPct = pct(4);

  let limitingFactor: string | null = null;
  if (overallPct < 80) {
    const idx = unitId % limitingFactors.length;
    limitingFactor = limitingFactors[idx];
  }

  return {
    unitId,
    unitName,
    cRating: ratingFromPct(overallPct, 'C'),
    sRating: ratingFromPct(supplyPct, 'S'),
    rRating: ratingFromPct(equipmentPct, 'R'),
    pRating: ratingFromPct(personnelPct, 'P'),
    tRating: ratingFromPct(trainingPct, 'T'),
    overallPct,
    equipmentPct,
    supplyPct,
    personnelPct,
    trainingPct,
    limitingFactor,
  };
}

function generateConfigForUnit(unitId: number): UnitReadinessConfig {
  const unit = unitById.get(String(unitId));
  if (!unit) {
    // Unknown unit — return a generic config
    return generateGenericConfig(unitId, `Unit ${unitId}`, 'BATTALION');
  }
  return generateGenericConfig(unitId, unit.abbreviation || unit.name, unit.echelon);
}

// ---------------------------------------------------------------------------
// Config cache — ensures consistent data across calls
// ---------------------------------------------------------------------------

const configCache = new Map<number, UnitReadinessConfig>();

function getConfig(unitId: number): UnitReadinessConfig {
  let cfg = configCache.get(unitId);
  if (!cfg) {
    cfg = generateConfigForUnit(unitId);
    configCache.set(unitId, cfg);
  }
  return cfg;
}

// ---------------------------------------------------------------------------
// Generate trend data with realistic fluctuation
// ---------------------------------------------------------------------------

function generateTrend(cfg: UnitReadinessConfig, days: number): ReadinessSnapshot[] {
  const snapshots: ReadinessSnapshot[] = [];
  // Seed a deterministic-ish random from unitId
  let seed = cfg.unitId * 1337;
  function seededRandom(): number {
    seed = (seed * 16807 + 12345) % 2147483647;
    return (seed % 1000) / 1000;
  }

  for (let i = days - 1; i >= 0; i--) {
    const jitter = () => (seededRandom() - 0.5) * 6; // +/- 3%
    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));
    const overall = clamp(cfg.overallPct + jitter());
    const equipment = clamp(cfg.equipmentPct + jitter());
    const supply = clamp(cfg.supplyPct + jitter());
    const personnel = clamp(cfg.personnelPct + jitter());
    const training = clamp(cfg.trainingPct + jitter());

    snapshots.push({
      id: cfg.unitId * 10000 + i,
      unitId: cfg.unitId,
      snapshotDate: dateStr(i),
      overallReadinessPct: overall,
      equipmentReadinessPct: equipment,
      supplyReadinessPct: supply,
      personnelFillPct: personnel,
      trainingReadinessPct: training,
      cRating: ratingFromPct(overall, 'C'),
      sRating: ratingFromPct(supply, 'S'),
      rRating: ratingFromPct(equipment, 'R'),
      pRating: ratingFromPct(personnel, 'P'),
      tRating: ratingFromPct(training, 'T'),
      limitingFactor: cfg.limitingFactor,
      notes: null,
      isOfficial: i === 0,
      createdAt: isoStr(i),
    });
  }

  return snapshots;
}

// ---------------------------------------------------------------------------
// Generate strength data
// ---------------------------------------------------------------------------

function generateStrength(unitId: number): UnitStrengthReport {
  const cfg = getConfig(unitId);
  const unit = unitById.get(String(unitId));
  const echelon = unit?.echelon ?? 'BATTALION';

  // Scale authorized strength by echelon
  const strengthByEchelon: Record<string, { officers: number; enlisted: number }> = {
    'MEF':       { officers: 450, enlisted: 8500 },
    'DIVISION':  { officers: 180, enlisted: 3200 },
    'REGIMENT':  { officers: 85, enlisted: 1800 },
    'BATTALION': { officers: 42, enlisted: 820 },
    'COMPANY':   { officers: 6, enlisted: 180 },
    'PLATOON':   { officers: 2, enlisted: 43 },
  };

  const { officers: authOfficers, enlisted: authEnlisted } = strengthByEchelon[echelon] ?? strengthByEchelon['BATTALION'];
  const fillRatio = cfg.personnelPct / 100;

  const assignedOfficers = Math.round(authOfficers * (fillRatio + 0.02));
  const assignedEnlisted = Math.round(authEnlisted * (fillRatio - 0.01));
  const totalAuth = authOfficers + authEnlisted;
  const totalAssigned = assignedOfficers + assignedEnlisted;

  const shortfalls: UnitStrengthReport['mosShortfalls'] =
    cfg.overallPct < 85
      ? [
          { mos: '0311', mosTitle: 'Rifleman', authorized: 180, assigned: 162, shortfall: 18 },
          { mos: '0331', mosTitle: 'Machine Gunner', authorized: 36, assigned: 28, shortfall: 8 },
          { mos: '0352', mosTitle: 'Anti-tank Missileman', authorized: 24, assigned: 18, shortfall: 6 },
          { mos: '0621', mosTitle: 'Radio Operator', authorized: 18, assigned: 14, shortfall: 4 },
          { mos: '3521', mosTitle: 'Automotive Mechanic', authorized: 12, assigned: 8, shortfall: 4 },
        ]
      : [
          { mos: '3521', mosTitle: 'Automotive Mechanic', authorized: 12, assigned: 10, shortfall: 2 },
          { mos: '0621', mosTitle: 'Radio Operator', authorized: 18, assigned: 16, shortfall: 2 },
        ];

  return {
    id: unitId * 100,
    unitId,
    reportedAt: isoStr(0),
    authorizedOfficers: authOfficers,
    assignedOfficers,
    authorizedEnlisted: authEnlisted,
    assignedEnlisted,
    attached: Math.round(totalAssigned * 0.02),
    detached: Math.round(totalAssigned * 0.015),
    tad: Math.round(totalAssigned * 0.03),
    leave: Math.round(totalAssigned * 0.05),
    medical: Math.round(totalAssigned * 0.02),
    ua: cfg.overallPct < 70 ? 2 : 0,
    totalAuthorized: totalAuth,
    totalAssigned,
    fillPct: Math.round((totalAssigned / totalAuth) * 1000) / 10,
    mosShortfalls: shortfalls,
    notes: cfg.limitingFactor ? `Limiting factor: ${cfg.limitingFactor}` : null,
  };
}

// ---------------------------------------------------------------------------
// Mock delay
// ---------------------------------------------------------------------------

const mockDelay = (ms = 150 + Math.random() * 150): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getReadinessSnapshot(
  unitId: number,
): Promise<ReadinessSnapshot> {
  if (isDemoMode) {
    await mockDelay();
    const trend = generateTrend(getConfig(unitId), 1);
    return trend[0];
  }
  const response = await apiClient.get<{ data: ReadinessSnapshot }>(
    `/readiness/${unitId}/snapshot`,
  );
  return response.data.data;
}

export async function getReadinessHistory(
  unitId: number,
  days = 30,
): Promise<ReadinessSnapshot[]> {
  if (isDemoMode) {
    await mockDelay();
    return generateTrend(getConfig(unitId), days);
  }
  const response = await apiClient.get<{ data: ReadinessSnapshot[] }>(
    `/readiness/${unitId}/history`,
    { params: { days } },
  );
  return response.data.data;
}

export async function getReadinessRollup(
  unitId: number,
): Promise<ReadinessRollup> {
  if (isDemoMode) {
    await mockDelay();

    // Dynamic child lookup from DEMO_UNITS hierarchy
    const children = childMap.get(String(unitId)) ?? [];
    const childConfigs = children
      .map((c) => {
        const numId = parseInt(c.id, 10);
        if (isNaN(numId)) return null;
        return { config: getConfig(numId), echelon: c.echelon };
      })
      .filter(Boolean) as { config: UnitReadinessConfig; echelon: string }[];

    const subs = childConfigs.map(({ config: c, echelon }) => ({
      unitId: c.unitId,
      unitName: c.unitName,
      cRating: c.cRating,
      overallReadinessPct: c.overallPct,
      limitingFactor: c.limitingFactor,
      echelonLabel: echelon,
    }));

    const avg = (arr: number[]) =>
      arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

    return {
      unitId,
      numSubordinates: subs.length,
      avgOverallReadinessPct: avg(childConfigs.map(({ config: c }) => c.overallPct)),
      avgEquipmentReadinessPct: avg(childConfigs.map(({ config: c }) => c.equipmentPct)),
      avgSupplyReadinessPct: avg(childConfigs.map(({ config: c }) => c.supplyPct)),
      avgPersonnelFillPct: avg(childConfigs.map(({ config: c }) => c.personnelPct)),
      subordinates: subs,
    };
  }
  const response = await apiClient.get<{ data: ReadinessRollup }>(
    `/readiness/${unitId}/rollup`,
  );
  return response.data.data;
}

export async function getReadinessDashboard(): Promise<{
  units: Array<{
    unitId: number;
    unitName: string;
    cRating: string;
    overallReadinessPct: number;
    limitingFactor: string | null;
  }>;
}> {
  if (isDemoMode) {
    await mockDelay();
    const topUnits = DEMO_UNITS
      .filter((u) => {
        const numId = parseInt(u.id, 10);
        return !isNaN(numId);
      })
      .map((u) => {
        const numId = parseInt(u.id, 10);
        const cfg = getConfig(numId);
        return {
          unitId: cfg.unitId,
          unitName: cfg.unitName,
          cRating: cfg.cRating,
          overallReadinessPct: cfg.overallPct,
          limitingFactor: cfg.limitingFactor,
        };
      });
    return { units: topUnits };
  }
  const response = await apiClient.get<{
    data: {
      units: Array<{
        unitId: number;
        unitName: string;
        cRating: string;
        overallReadinessPct: number;
        limitingFactor: string | null;
      }>;
    };
  }>('/readiness/dashboard');
  return response.data.data;
}

export async function createReadinessSnapshot(
  unitId: number,
  notes?: string,
  isOfficial?: boolean,
): Promise<ReadinessSnapshot> {
  if (isDemoMode) {
    await mockDelay();
    const cfg = getConfig(unitId);
    const trend = generateTrend(cfg, 1);
    return { ...trend[0], notes: notes ?? null, isOfficial: isOfficial ?? false };
  }
  const response = await apiClient.post<{ data: ReadinessSnapshot }>(
    `/readiness/${unitId}/snapshot`,
    { notes, is_official: isOfficial },
  );
  return response.data.data;
}

export async function getUnitStrength(
  unitId: number,
): Promise<UnitStrengthReport> {
  if (isDemoMode) {
    await mockDelay();
    return generateStrength(unitId);
  }
  const response = await apiClient.get<{ data: UnitStrengthReport }>(
    `/readiness/${unitId}/strength`,
  );
  return response.data.data;
}

export async function updateUnitStrength(
  unitId: number,
  data: Partial<UnitStrengthReport>,
): Promise<UnitStrengthReport> {
  if (isDemoMode) {
    await mockDelay();
    const current = generateStrength(unitId);
    return { ...current, ...data } as UnitStrengthReport;
  }
  const response = await apiClient.put<{ data: UnitStrengthReport }>(
    `/readiness/${unitId}/strength`,
    data,
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Drill-down detail API functions
// ---------------------------------------------------------------------------

import type {
  EquipmentDetailResponse,
  SupplyDetailResponse,
  PersonnelDetailResponse,
  TrainingDetailResponse,
} from '@/lib/types';

export async function getEquipmentDetail(unitId: number): Promise<EquipmentDetailResponse> {
  if (isDemoMode) {
    await mockDelay();
    const cfg = getConfig(unitId);
    return {
      unitId,
      snapshotDate: dateStr(0),
      overallReadinessPct: cfg.equipmentPct,
      rRating: cfg.rRating,
      equipmentItems: [
        { tamcn: 'E0846', nomenclature: 'HMMWV M1151', totalPossessed: 24, missionCapable: 21, nmcM: 2, nmcS: 1, readinessPct: 87.5 },
        { tamcn: 'E0854', nomenclature: 'MTVR MK23', totalPossessed: 18, missionCapable: 15, nmcM: 2, nmcS: 1, readinessPct: 83.3 },
        { tamcn: 'E0889', nomenclature: 'LAV-25', totalPossessed: 14, missionCapable: 11, nmcM: 2, nmcS: 1, readinessPct: 78.6 },
        { tamcn: 'E1090', nomenclature: 'M777A2 Howitzer', totalPossessed: 6, missionCapable: 5, nmcM: 1, nmcS: 0, readinessPct: 83.3 },
        { tamcn: 'E2010', nomenclature: 'AN/PRC-117G Radio', totalPossessed: 48, missionCapable: 46, nmcM: 1, nmcS: 1, readinessPct: 95.8 },
        { tamcn: 'E0910', nomenclature: 'JLTV M-ATV', totalPossessed: 12, missionCapable: 11, nmcM: 0, nmcS: 1, readinessPct: 91.7 },
        { tamcn: 'E0866', nomenclature: 'LVS MK48', totalPossessed: 8, missionCapable: 7, nmcM: 1, nmcS: 0, readinessPct: 87.5 },
        { tamcn: 'E1350', nomenclature: 'MEP-813A Generator', totalPossessed: 6, missionCapable: 6, nmcM: 0, nmcS: 0, readinessPct: 100 },
      ].sort((a, b) => a.readinessPct - b.readinessPct),
      summaryByCategory: { 'Vehicles': 85, 'Weapons': 83, 'Comms': 96, 'Engineering': 100 },
    };
  }
  const response = await apiClient.get<{ data: EquipmentDetailResponse }>(`/readiness/${unitId}/equipment-detail`);
  return response.data.data;
}

export async function getSupplyDetail(unitId: number): Promise<SupplyDetailResponse> {
  if (isDemoMode) {
    await mockDelay();
    const cfg = getConfig(unitId);
    return {
      unitId,
      snapshotDate: dateStr(0),
      overallReadinessPct: cfg.supplyPct,
      sRating: cfg.sRating,
      supplyItems: [
        { supplyClass: 'CL III', description: 'Bulk Fuel (JP-8)', onHand: 8500, required: 15000, dos: 2.7, status: 'RED' },
        { supplyClass: 'CL III', description: 'MOGAS', onHand: 1200, required: 3000, dos: 2.0, status: 'RED' },
        { supplyClass: 'CL IX', description: 'Repair Parts (Ground)', onHand: 36, required: 64, dos: 4.2, status: 'RED' },
        { supplyClass: 'CL I', description: 'MRE Cases', onHand: 9800, required: 13500, dos: 4.5, status: 'RED' },
        { supplyClass: 'CL V', description: '5.56mm Ball', onHand: 850, required: 1100, dos: 6.2, status: 'AMBER' },
        { supplyClass: 'CL VIII', description: 'Medical Consumables', onHand: 878, required: 1140, dos: 18.5, status: 'GREEN' },
        { supplyClass: 'CL II', description: 'Clothing & Equipment', onHand: 2730, required: 3100, dos: 45, status: 'GREEN' },
        { supplyClass: 'CL VII', description: 'Major End Items', onHand: 100, required: 112, dos: 350, status: 'GREEN' },
      ].sort((a, b) => a.dos - b.dos),
      dosByClass: { 'CL I': 4.5, 'CL II': 45, 'CL III': 2.4, 'CL V': 6.2, 'CL VII': 350, 'CL VIII': 18.5, 'CL IX': 4.2 },
    };
  }
  const response = await apiClient.get<{ data: SupplyDetailResponse }>(`/readiness/${unitId}/supply-detail`);
  return response.data.data;
}

export async function getPersonnelDetail(unitId: number): Promise<PersonnelDetailResponse> {
  if (isDemoMode) {
    await mockDelay();
    const cfg = getConfig(unitId);
    const unit = unitById.get(String(unitId));
    const echelon = unit?.echelon ?? 'BATTALION';

    const strengthByEchelon: Record<string, number> = {
      'MEF':       8950,
      'DIVISION':  3380,
      'REGIMENT':  1885,
      'BATTALION': 862,
      'COMPANY':   186,
      'PLATOON':   45,
    };

    const authTotal = strengthByEchelon[echelon] ?? 862;
    const fillRatio = cfg.personnelPct / 100;
    const assignedTotal = Math.round(authTotal * fillRatio);
    return {
      unitId,
      snapshotDate: dateStr(0),
      overallReadinessPct: cfg.personnelPct,
      pRating: cfg.pRating,
      authorizedTotal: authTotal,
      assignedTotal,
      fillRatePct: Math.round(fillRatio * 1000) / 10,
      mosShortfalls: cfg.overallPct < 85
        ? [
            { mos: '0311', mosTitle: 'Rifleman', authorized: 180, assigned: 162, shortfall: 18 },
            { mos: '0331', mosTitle: 'Machine Gunner', authorized: 36, assigned: 28, shortfall: 8 },
            { mos: '0352', mosTitle: 'Anti-tank Missileman', authorized: 24, assigned: 18, shortfall: 6 },
            { mos: '0621', mosTitle: 'Radio Operator', authorized: 18, assigned: 14, shortfall: 4 },
            { mos: '3521', mosTitle: 'Automotive Mechanic', authorized: 12, assigned: 8, shortfall: 4 },
          ]
        : [
            { mos: '3521', mosTitle: 'Automotive Mechanic', authorized: 12, assigned: 10, shortfall: 2 },
            { mos: '0621', mosTitle: 'Radio Operator', authorized: 18, assigned: 16, shortfall: 2 },
          ],
      keyBilletVacancies: null,
    };
  }
  const response = await apiClient.get<{ data: PersonnelDetailResponse }>(`/readiness/${unitId}/personnel-detail`);
  return response.data.data;
}

export async function getTrainingDetail(unitId: number): Promise<TrainingDetailResponse> {
  if (isDemoMode) {
    await mockDelay();
    const cfg = getConfig(unitId);
    return {
      unitId,
      snapshotDate: dateStr(0),
      overallReadinessPct: cfg.trainingPct,
      tRating: cfg.tRating,
      qualificationCurrencyRates: {
        'Annual Rifle Qual': 94.2,
        'PFT': 92.5,
        'CFT': 88.0,
        'CBRN Awareness': 85.3,
        'Swim Qual': 91.0,
        'First Aid/CLS': 78.5,
      },
      upcomingExpirations: [
        { qualification: 'Annual Rifle Qual', count: 12, dueWithin: '30 days' },
        { qualification: 'CBRN Awareness', count: 8, dueWithin: '30 days' },
        { qualification: 'First Aid/CLS', count: 15, dueWithin: '60 days' },
      ],
      combatReadinessStats: {
        'Range Qualification': 95,
        'PFT Pass Rate': 92,
        'CFT Pass Rate': 88,
        'MCMAP Belt Currency': 82,
      },
    };
  }
  const response = await apiClient.get<{ data: TrainingDetailResponse }>(`/readiness/${unitId}/training-detail`);
  return response.data.data;
}
