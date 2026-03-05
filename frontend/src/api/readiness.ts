// =============================================================================
// KEYSTONE Readiness & Reporting — API functions
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';
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

const UNIT_CONFIGS: UnitReadinessConfig[] = [
  {
    unitId: 1, unitName: 'I MEF',
    cRating: 'C-2', sRating: 'S-2', rRating: 'R-2', pRating: 'P-2', tRating: 'T-2',
    overallPct: 82, equipmentPct: 84, supplyPct: 78, personnelPct: 85, trainingPct: 80,
    limitingFactor: 'Supply Class IX shortfalls across subordinate units',
  },
  {
    unitId: 2, unitName: '1st MarDiv',
    cRating: 'C-2', sRating: 'S-2', rRating: 'R-2', pRating: 'P-2', tRating: 'T-2',
    overallPct: 79, equipmentPct: 81, supplyPct: 74, personnelPct: 82, trainingPct: 78,
    limitingFactor: 'Equipment readiness below threshold for 2/1',
  },
  {
    unitId: 3, unitName: '1st Marines',
    cRating: 'C-2', sRating: 'S-2', rRating: 'R-2', pRating: 'P-2', tRating: 'T-2',
    overallPct: 81, equipmentPct: 83, supplyPct: 76, personnelPct: 84, trainingPct: 79,
    limitingFactor: 'CL IX repair parts awaiting FEDLOG',
  },
  {
    unitId: 4, unitName: '1/1',
    cRating: 'C-1', sRating: 'S-1', rRating: 'R-1', pRating: 'P-1', tRating: 'T-1',
    overallPct: 91, equipmentPct: 93, supplyPct: 89, personnelPct: 94, trainingPct: 90,
    limitingFactor: null,
  },
  {
    unitId: 5, unitName: '2/1',
    cRating: 'C-3', sRating: 'S-3', rRating: 'R-2', pRating: 'P-2', tRating: 'T-3',
    overallPct: 68, equipmentPct: 72, supplyPct: 60, personnelPct: 75, trainingPct: 64,
    limitingFactor: 'CL III bulk fuel and CL IX parts critically low; 4x HMMWV deadlined',
  },
];

function getConfig(unitId: number): UnitReadinessConfig {
  return UNIT_CONFIGS.find((c) => c.unitId === unitId) ?? UNIT_CONFIGS[0];
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

    function ratingFromPct(pct: number, prefix: string): string {
      if (pct >= 90) return `${prefix}-1`;
      if (pct >= 75) return `${prefix}-2`;
      if (pct >= 60) return `${prefix}-3`;
      return `${prefix}-4`;
    }

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
  // Realistic USMC battalion-level numbers
  const isLargeUnit = unitId <= 2;
  const authOfficers = isLargeUnit ? 180 : 42;
  const authEnlisted = isLargeUnit ? 3200 : 820;
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
    ua: unitId === 5 ? 2 : 0,
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
    // Unit 1 (I MEF) rolls up 2,3,4,5
    // Unit 2 (1st MarDiv) rolls up 3,4,5
    // Unit 3 (1st Marines) rolls up 4,5
    // Otherwise just return self
    const childConfigs: UnitReadinessConfig[] = [];
    if (unitId === 1) {
      childConfigs.push(...UNIT_CONFIGS.filter((c) => c.unitId >= 2));
    } else if (unitId === 2) {
      childConfigs.push(...UNIT_CONFIGS.filter((c) => c.unitId >= 3));
    } else if (unitId === 3) {
      childConfigs.push(...UNIT_CONFIGS.filter((c) => c.unitId >= 4 && c.unitId <= 5));
    } else {
      childConfigs.push(getConfig(unitId));
    }

    const subs = childConfigs.map((c) => ({
      unitId: c.unitId,
      unitName: c.unitName,
      cRating: c.cRating,
      overallReadinessPct: c.overallPct,
      limitingFactor: c.limitingFactor,
    }));

    const avg = (arr: number[]) =>
      arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

    return {
      unitId,
      numSubordinates: subs.length,
      avgOverallReadinessPct: avg(childConfigs.map((c) => c.overallPct)),
      avgEquipmentReadinessPct: avg(childConfigs.map((c) => c.equipmentPct)),
      avgSupplyReadinessPct: avg(childConfigs.map((c) => c.supplyPct)),
      avgPersonnelFillPct: avg(childConfigs.map((c) => c.personnelPct)),
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
    return {
      units: UNIT_CONFIGS.map((c) => ({
        unitId: c.unitId,
        unitName: c.unitName,
        cRating: c.cRating,
        overallReadinessPct: c.overallPct,
        limitingFactor: c.limitingFactor,
      })),
    };
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
