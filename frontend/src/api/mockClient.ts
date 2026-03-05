// =============================================================================
// KEYSTONE Demo Mode — Mock API Client
// Intercepts all API calls and returns realistic demo data when VITE_DEMO_MODE
// is enabled or when no backend URL is configured.
// =============================================================================

import { jsPDF } from 'jspdf';

import type {
  LoginResponse,
  User,
  Unit,
  DashboardSummary,
  SupplyClassSummary,
  ReadinessSummary,
  SustainabilityProjection,
  SupplyRecord,
  EquipmentRecord,
  EquipmentItem,
  MaintenanceWorkOrder,
  MaintenancePart,
  MaintenanceLabor,
  EquipmentFault,
  EquipmentDriverAssignment,
  Movement,
  Alert,
  AlertRule,
  AlertSummary,
  Report,
  ReportContent,
  RawData,
  ParsedRecord,
  ConsumptionDataPoint,
  PaginatedResponse,
  SupplyFilters,
  EquipmentFilters,
  IndividualEquipmentFilters,
  WorkOrderFilters,
  ReportFilters,
  GenerateReportParams,
  ReportStatus,
  MovementStatus,
  CargoItem,
  Personnel,
  PersonnelSummary,
  ConvoyManifest,
  ConvoyRole,
  ExportDestination,
  ExportDestinationCreate,
  ExportDestinationUpdate,
  ApiExportResponse,
  ReportTemplate,
  ReportSchedule,
} from '@/lib/types';

import {
  ReportType,
  ScheduleFrequency,
  WorkOrderStatus,
  SupplyStatus,
} from '@/lib/types';

import {
  DEMO_USERS,
  DEMO_UNITS,
  DEMO_SUPPLY_RECORDS,
  DEMO_EQUIPMENT,
  DEMO_MOVEMENTS,
  DEMO_ALERTS,
  DEMO_DASHBOARD_SUMMARY,
  DEMO_SUSTAINABILITY,
  DEMO_CONSUMPTION_TRENDS,
  DEMO_READINESS_TRENDS,
  DEMO_INGESTION_HISTORY,
  DEMO_REVIEW_QUEUE,
  DEMO_REPORTS,
  DEMO_PERSONNEL,
  DEMO_INDIVIDUAL_EQUIPMENT,
  DEMO_WORK_ORDERS,
  DEMO_EQUIPMENT_FAULTS,
  DEMO_DRIVER_ASSIGNMENTS,
} from './mockData';

// ---------------------------------------------------------------------------
// Demo mode detection
// ---------------------------------------------------------------------------

export const isDemoMode: boolean =
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  (typeof window !== 'undefined' && !import.meta.env.VITE_API_BASE_URL);

// ---------------------------------------------------------------------------
// Simulate network latency
// ---------------------------------------------------------------------------

const mockDelay = (ms = 200 + Math.random() * 200): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// In-memory mutable state for demo interactions
// ---------------------------------------------------------------------------

let demoAlerts = [...DEMO_ALERTS];
let demoReviewQueue = [...DEMO_REVIEW_QUEUE];
let demoUnits = [...DEMO_UNITS];
let demoReports = [...DEMO_REPORTS];
let demoMovements = [...DEMO_MOVEMENTS];
let demoPersonnel = [...DEMO_PERSONNEL];

let demoExportDestinations: ExportDestination[] = [
  {
    id: 1,
    name: 'GCSS-MC API',
    url: 'https://gcss-mc.example.mil/api/v2/reports/ingest',
    auth_type: 'bearer',
    auth_value: 'demo-token-gcss',
    headers: null,
    is_active: true,
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 2,
    name: 'Higher HQ',
    url: 'https://higher-hq.example.mil/logistics/reports',
    auth_type: 'api_key',
    auth_value: 'demo-api-key-hq',
    headers: { 'X-Unit-ID': 'IMEF' },
    is_active: true,
    created_at: '2026-02-01T12:00:00Z',
  },
  {
    id: 3,
    name: 'Archive Server',
    url: 'https://archive.example.mil/reports/store',
    auth_type: 'none',
    auth_value: null,
    headers: null,
    is_active: false,
    created_at: '2026-02-10T09:30:00Z',
  },
];
let demoWorkOrders = [...DEMO_WORK_ORDERS];
let demoIndividualEquipment = [...DEMO_INDIVIDUAL_EQUIPMENT];
let demoFaults = [...DEMO_EQUIPMENT_FAULTS];
let demoDriverAssignments = [...DEMO_DRIVER_ASSIGNMENTS];

let demoTemplates: ReportTemplate[] = [
  { id: 1, name: 'Default LOGSTAT', report_type: 'LOGSTAT', description: 'Standard logistics status template', template_body: '...', sections: ['HEADER', 'LOGISTICS_SUMMARY', 'SUPPLY_CLASS_I', 'SUPPLY_CLASS_III', 'EQUIPMENT_STATUS', 'FOOTER'], classification_default: 'CUI', is_default: true, created_by: 1, created_at: '2026-01-15T00:00:00Z' },
  { id: 2, name: 'Daily SITREP', report_type: 'SITREP', description: 'Daily situation report template', template_body: '...', sections: ['HEADER', 'SITUATION', 'PERSONNEL_STRENGTH', 'LOGISTICS_SUMMARY', 'EQUIPMENT_STATUS', 'MAINTENANCE_STATUS', 'COMMANDER_ASSESSMENT', 'FOOTER'], classification_default: 'CUI', is_default: true, created_by: 1, created_at: '2026-01-15T00:00:00Z' },
  { id: 3, name: 'Weekly PERSTAT', report_type: 'PERSTAT', description: 'Weekly personnel status template', template_body: '...', sections: ['HEADER', 'PERSONNEL_STRENGTH', 'FOOTER'], classification_default: 'CUI', is_default: false, created_by: 1, created_at: '2026-01-20T00:00:00Z' },
];

let demoSchedules: ReportSchedule[] = [
  { id: 1, template_id: 1, unit_id: 3, frequency: ScheduleFrequency.DAILY, time_of_day: '06:00', is_active: true, auto_distribute: true, last_generated: '2026-03-04T06:00:00Z', next_generation: '2026-03-05T06:00:00Z', created_at: '2026-02-01T00:00:00Z' },
  { id: 2, template_id: 2, unit_id: 3, frequency: ScheduleFrequency.DAILY, time_of_day: '18:00', is_active: true, auto_distribute: false, last_generated: '2026-03-04T18:00:00Z', next_generation: '2026-03-05T18:00:00Z', created_at: '2026-02-01T00:00:00Z' },
  { id: 3, template_id: 3, unit_id: 3, frequency: ScheduleFrequency.WEEKLY, time_of_day: '08:00', day_of_week: 0, is_active: true, auto_distribute: true, created_at: '2026-02-15T00:00:00Z' },
];

// ---------------------------------------------------------------------------
// Mock alert rules
// ---------------------------------------------------------------------------

const MOCK_ALERT_RULES: AlertRule[] = [
  { id: 1, name: 'Supply DOS < 3 Days (Critical)', description: 'Alert when supply DOS drops below 3 days', alert_type: 'LOW_DOS', severity: 'CRITICAL', metric: 'supply_dos', operator: 'LT', threshold_value: 3, is_scope_all: true, cooldown_minutes: 60, is_active: true, created_by: 1, created_at: '2026-01-15T00:00:00Z' },
  { id: 2, name: 'Supply DOS < 5 Days (Warning)', description: 'Alert when supply DOS drops below 5 days', alert_type: 'LOW_DOS', severity: 'WARNING', metric: 'supply_dos', operator: 'LT', threshold_value: 5, is_scope_all: true, cooldown_minutes: 120, is_active: true, created_by: 1, created_at: '2026-01-15T00:00:00Z' },
  { id: 3, name: 'Equipment Readiness < 70% (Critical)', description: 'Alert when equipment readiness drops below 70%', alert_type: 'LOW_READINESS', severity: 'CRITICAL', metric: 'equipment_readiness_pct', operator: 'LT', threshold_value: 70, is_scope_all: true, cooldown_minutes: 60, is_active: true, created_by: 1, created_at: '2026-01-15T00:00:00Z' },
  { id: 4, name: 'Equipment Readiness < 85% (Warning)', alert_type: 'LOW_READINESS', severity: 'WARNING', metric: 'equipment_readiness_pct', operator: 'LT', threshold_value: 85, is_scope_all: true, cooldown_minutes: 120, is_active: true, created_by: 1, created_at: '2026-01-15T00:00:00Z' },
  { id: 5, name: 'PM Overdue > 7 Days (Warning)', description: 'PM overdue by more than 7 days', alert_type: 'PM_OVERDUE', severity: 'WARNING', metric: 'pm_overdue_days', operator: 'GT', threshold_value: 7, is_scope_all: true, cooldown_minutes: 180, is_active: true, created_by: 1, created_at: '2026-01-15T00:00:00Z' },
  { id: 6, name: 'Personnel Fill < 80% (Warning)', description: 'Unit fill below 80%', alert_type: 'STRENGTH_BELOW_THRESHOLD', severity: 'WARNING', metric: 'personnel_strength_pct', operator: 'LT', threshold_value: 80, is_scope_all: true, cooldown_minutes: 240, is_active: true, created_by: 1, created_at: '2026-01-15T00:00:00Z' },
];

// Exported mock functions for alerts
export function mockGetAlertSummary(_unitId?: string): AlertSummary {
  return { total_active: 5, by_severity: { CRITICAL: 2, WARNING: 2, INFO: 1 }, by_type: { LOW_DOS: 1, LOW_READINESS: 1, CONVOY_DELAYED: 1, PM_OVERDUE: 1, EQUIPMENT_DEADLINED: 1 } };
}

export function mockResolveAlert(id: string): void {
  demoAlerts = demoAlerts.map((a) =>
    a.id === id ? { ...a, resolved: true, resolvedBy: 'Demo User', resolvedAt: new Date().toISOString() } : a,
  );
}

export function mockGetAlertRules(): AlertRule[] { return [...MOCK_ALERT_RULES]; }

export function mockCreateAlertRule(data: Partial<AlertRule>): AlertRule {
  const rule = { id: MOCK_ALERT_RULES.length + 1, ...data, created_by: 1, created_at: new Date().toISOString() } as AlertRule;
  MOCK_ALERT_RULES.push(rule);
  return rule;
}

export function mockUpdateAlertRule(id: number, data: Partial<AlertRule>): AlertRule {
  const idx = MOCK_ALERT_RULES.findIndex(r => r.id === id);
  if (idx >= 0) Object.assign(MOCK_ALERT_RULES[idx], data);
  return MOCK_ALERT_RULES[idx];
}

// ---------------------------------------------------------------------------
// Helper: hierarchical unit filtering — walks the unit tree to find
// all descendants of a given unit ID so that selecting a parent unit
// (e.g. "I MEF") also shows data for all child/grandchild units.
// ---------------------------------------------------------------------------

function getDescendantUnitIds(unitId: string): string[] {
  const ids = new Set<string>([unitId]);
  let added = true;
  while (added) {
    added = false;
    for (const u of DEMO_UNITS) {
      if (u.parentId && ids.has(u.parentId) && !ids.has(u.id)) {
        ids.add(u.id);
        added = true;
      }
    }
  }
  return Array.from(ids);
}

function matchesUnitFilter(recordUnitId: string | undefined, filterUnitId?: string): boolean {
  if (!filterUnitId) return true;
  if (!recordUnitId) return false;
  const validIds = getDescendantUnitIds(filterUnitId);
  return validIds.includes(recordUnitId);
}

// ---------------------------------------------------------------------------
// Helper: convert time range string to number of days
// ---------------------------------------------------------------------------

function timeRangeToDays(range?: string): number {
  switch (range) {
    case '24h': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 7;
  }
}

// ---------------------------------------------------------------------------
// Mock API — mirrors the real API surface
// ---------------------------------------------------------------------------

export const mockApi = {
  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------

  async login(username: string, _password: string): Promise<LoginResponse> {
    await mockDelay();
    const user =
      DEMO_USERS.find((u) => u.username === username.toLowerCase()) ||
      DEMO_USERS[0];
    return {
      token: 'demo-jwt-token-' + Date.now(),
      user,
    };
  },

  async getCurrentUser(): Promise<User> {
    await mockDelay();
    const stored = localStorage.getItem('keystone_user');
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        // fall through
      }
    }
    return DEMO_USERS[0];
  },

  async getUsers(): Promise<User[]> {
    await mockDelay();
    return DEMO_USERS;
  },

  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------

  async getDashboardSummary(unitId?: string, _timeRange?: string): Promise<DashboardSummary> {
    await mockDelay();
    if (!unitId) return DEMO_DASHBOARD_SUMMARY;

    // Recompute summary from underlying records for the selected unit hierarchy
    const supplyRecords = DEMO_SUPPLY_RECORDS.filter((r) => matchesUnitFilter(r.unitId, unitId));
    const equipmentRecords = DEMO_EQUIPMENT.filter((r) => matchesUnitFilter(r.unitId, unitId));
    const alerts = demoAlerts.filter((a) => matchesUnitFilter(a.unitId, unitId));
    const movements = demoMovements.filter((m) => {
      // Match movements where origin or destination unit name contains a matching unit name
      const validIds = getDescendantUnitIds(unitId);
      const unitNames = DEMO_UNITS.filter((u) => validIds.includes(u.id)).map((u) => u.abbreviation);
      return unitNames.some((n) => m.originUnit.includes(n) || m.destinationUnit.includes(n));
    });

    // Compute supply status by class
    const supplyByClass = new Map<string, { onHand: number; authorized: number }>();
    for (const r of supplyRecords) {
      const existing = supplyByClass.get(r.supplyClass) || { onHand: 0, authorized: 0 };
      existing.onHand += r.onHand;
      existing.authorized += r.authorized;
      supplyByClass.set(r.supplyClass, existing);
    }
    const supplyStatus = DEMO_DASHBOARD_SUMMARY.supplyStatus
      .map((s) => {
        const data = supplyByClass.get(s.supplyClass);
        if (!data) return null;
        const pct = Math.round((data.onHand / data.authorized) * 100);
        const status: SupplyStatus = pct >= 80 ? SupplyStatus.GREEN : pct >= 60 ? SupplyStatus.AMBER : SupplyStatus.RED;
        return { ...s, percentage: pct, onHand: data.onHand, authorized: data.authorized, status } as SupplyClassSummary;
      })
      .filter((s): s is SupplyClassSummary => s !== null);

    // Compute equipment readiness
    const totalAuth = equipmentRecords.reduce((s, e) => s + e.authorized, 0);
    const totalMC = equipmentRecords.reduce((s, e) => s + e.missionCapable, 0);
    const overallReadiness = totalAuth > 0 ? Math.round((totalMC / totalAuth) * 1000) / 10 : 0;

    const unitInfo = DEMO_UNITS.find((u) => u.id === unitId);

    return {
      ...DEMO_DASHBOARD_SUMMARY,
      unitId: unitId,
      unitName: unitInfo?.abbreviation || DEMO_DASHBOARD_SUMMARY.unitName,
      overallReadiness,
      supplyStatus: supplyStatus.length > 0 ? supplyStatus : DEMO_DASHBOARD_SUMMARY.supplyStatus,
      equipmentReadiness: {
        ...DEMO_DASHBOARD_SUMMARY.equipmentReadiness,
        overall: overallReadiness,
      },
      activeMovements: movements.length,
      criticalAlerts: alerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledged).length,
      warningAlerts: alerts.filter((a) => a.severity === 'WARNING' && !a.acknowledged).length,
    };
  },

  async getSupplyOverview(unitId?: string, _timeRange?: string): Promise<SupplyClassSummary[]> {
    await mockDelay();
    if (!unitId) return DEMO_DASHBOARD_SUMMARY.supplyStatus;

    const supplyRecords = DEMO_SUPPLY_RECORDS.filter((r) => matchesUnitFilter(r.unitId, unitId));
    const supplyByClass = new Map<string, { onHand: number; authorized: number }>();
    for (const r of supplyRecords) {
      const existing = supplyByClass.get(r.supplyClass) || { onHand: 0, authorized: 0 };
      existing.onHand += r.onHand;
      existing.authorized += r.authorized;
      supplyByClass.set(r.supplyClass, existing);
    }
    return DEMO_DASHBOARD_SUMMARY.supplyStatus
      .map((s) => {
        const data = supplyByClass.get(s.supplyClass);
        if (!data) return null;
        const pct = Math.round((data.onHand / data.authorized) * 100);
        const status: SupplyStatus = pct >= 80 ? SupplyStatus.GREEN : pct >= 60 ? SupplyStatus.AMBER : SupplyStatus.RED;
        return { ...s, percentage: pct, onHand: data.onHand, authorized: data.authorized, status } as SupplyClassSummary;
      })
      .filter((s): s is SupplyClassSummary => s !== null);
  },

  async getReadinessOverview(unitId?: string, _timeRange?: string): Promise<ReadinessSummary> {
    await mockDelay();
    if (!unitId) return DEMO_DASHBOARD_SUMMARY.equipmentReadiness;

    const equipmentRecords = DEMO_EQUIPMENT.filter((r) => matchesUnitFilter(r.unitId, unitId));
    const totalAuth = equipmentRecords.reduce((s, e) => s + e.authorized, 0);
    const totalMC = equipmentRecords.reduce((s, e) => s + e.missionCapable, 0);
    const overall = totalAuth > 0 ? Math.round((totalMC / totalAuth) * 1000) / 10 : 0;

    // Group by type
    const byTypeMap = new Map<string, { authorized: number; mc: number }>();
    for (const e of equipmentRecords) {
      const existing = byTypeMap.get(e.type) || { authorized: 0, mc: 0 };
      existing.authorized += e.authorized;
      existing.mc += e.missionCapable;
      byTypeMap.set(e.type, existing);
    }
    const byType = Array.from(byTypeMap.entries()).map(([type, data]) => {
      const pct = Math.round((data.mc / data.authorized) * 1000) / 10;
      const status: SupplyStatus = pct >= 90 ? SupplyStatus.GREEN : pct >= 75 ? SupplyStatus.AMBER : SupplyStatus.RED;
      return { type, authorized: data.authorized, missionCapable: data.mc, readinessPercent: pct, status };
    });

    const overallStatus: SupplyStatus = overall >= 90 ? SupplyStatus.GREEN : overall >= 75 ? SupplyStatus.AMBER : SupplyStatus.RED;
    return {
      overall,
      byType,
      status: overallStatus,
      trend: DEMO_DASHBOARD_SUMMARY.equipmentReadiness.trend,
    };
  },

  async getSustainability(
    unitId?: string,
    _timeRange?: string,
  ): Promise<SustainabilityProjection[]> {
    await mockDelay();
    if (!unitId) return DEMO_SUSTAINABILITY;

    // Recompute sustainability from supply records for the filtered unit
    const supplyRecords = DEMO_SUPPLY_RECORDS.filter((r) => matchesUnitFilter(r.unitId, unitId));
    if (supplyRecords.length === 0) return [];

    const supplyByClass = new Map<string, { onHand: number; authorized: number; rate: number }>();
    for (const r of supplyRecords) {
      const existing = supplyByClass.get(r.supplyClass) || { onHand: 0, authorized: 0, rate: 0 };
      existing.onHand += r.onHand;
      existing.authorized += r.authorized;
      existing.rate += r.consumptionRate;
      supplyByClass.set(r.supplyClass, existing);
    }

    return DEMO_SUSTAINABILITY
      .map((s) => {
        const data = supplyByClass.get(s.supplyClass);
        if (!data || data.rate === 0) return null;
        const currentDOS = Math.round((data.onHand / data.rate) * 10) / 10;
        const projectedDOS = Math.round(currentDOS * 0.7 * 10) / 10;
        const status: SupplyStatus = currentDOS >= s.criticalThreshold * 2 ? SupplyStatus.GREEN : currentDOS >= s.criticalThreshold ? SupplyStatus.AMBER : SupplyStatus.RED;
        return { ...s, currentDOS, projectedDOS, status } as SustainabilityProjection;
      })
      .filter((s): s is SustainabilityProjection => s !== null);
  },

  async getDashboardAlerts(unitId?: string, _timeRange?: string): Promise<Alert[]> {
    await mockDelay();
    const days = timeRangeToDays(_timeRange);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let alerts = demoAlerts.filter((a) => !a.acknowledged && new Date(a.createdAt) >= cutoff);
    if (unitId) {
      alerts = alerts.filter((a) => matchesUnitFilter(a.unitId, unitId));
    }
    return alerts.slice(0, 5);
  },

  // -------------------------------------------------------------------------
  // Supply
  // -------------------------------------------------------------------------

  async getSupplyRecords(
    filters?: SupplyFilters,
  ): Promise<PaginatedResponse<SupplyRecord>> {
    await mockDelay();
    let records = [...DEMO_SUPPLY_RECORDS];

    if (filters?.unitId) {
      records = records.filter((r) => matchesUnitFilter(r.unitId, filters.unitId));
    }
    if (filters?.supplyClass) {
      records = records.filter((r) => r.supplyClass === filters.supplyClass);
    }
    if (filters?.status) {
      records = records.filter((r) => r.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      records = records.filter(
        (r) =>
          r.item.toLowerCase().includes(q) ||
          r.unitName.toLowerCase().includes(q) ||
          (r.niin && r.niin.includes(q)),
      );
    }

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    const start = (page - 1) * pageSize;

    return {
      data: records.slice(start, start + pageSize),
      total: records.length,
      page,
      pageSize,
    };
  },

  async getSupplyById(id: string): Promise<SupplyRecord> {
    await mockDelay();
    return (
      DEMO_SUPPLY_RECORDS.find((r) => r.id === id) || DEMO_SUPPLY_RECORDS[0]
    );
  },

  async createSupply(data: Partial<SupplyRecord>): Promise<SupplyRecord> {
    await mockDelay();
    return { ...DEMO_SUPPLY_RECORDS[0], ...data, id: 'sup-new-' + Date.now() } as SupplyRecord;
  },

  async updateSupply(
    id: string,
    data: Partial<SupplyRecord>,
  ): Promise<SupplyRecord> {
    await mockDelay();
    const existing = DEMO_SUPPLY_RECORDS.find((r) => r.id === id) || DEMO_SUPPLY_RECORDS[0];
    return { ...existing, ...data };
  },

  async getConsumptionRates(
    _unitId: string,
    timeRange?: string,
  ): Promise<ConsumptionDataPoint[]> {
    await mockDelay();
    const days = timeRangeToDays(timeRange);
    const trends = DEMO_CONSUMPTION_TRENDS['I'] || [];
    return trends.slice(-days);
  },

  async getSupplyTrends(_unitId: string, timeRange?: string): Promise<ConsumptionDataPoint[]> {
    await mockDelay();
    const days = timeRangeToDays(timeRange);
    const trends = DEMO_CONSUMPTION_TRENDS['III'] || [];
    return trends.slice(-days);
  },

  // -------------------------------------------------------------------------
  // Equipment
  // -------------------------------------------------------------------------

  async getEquipmentRecords(
    filters?: EquipmentFilters,
  ): Promise<PaginatedResponse<EquipmentRecord>> {
    await mockDelay();
    let records = [...DEMO_EQUIPMENT];

    if (filters?.unitId) {
      records = records.filter((r) => matchesUnitFilter(r.unitId, filters.unitId));
    }
    if (filters?.type) {
      records = records.filter((r) =>
        r.type.toLowerCase().includes(filters.type!.toLowerCase()),
      );
    }
    if (filters?.status) {
      records = records.filter((r) => r.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      records = records.filter(
        (r) =>
          r.type.toLowerCase().includes(q) ||
          r.unitName.toLowerCase().includes(q) ||
          r.tamcn.toLowerCase().includes(q),
      );
    }

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    const start = (page - 1) * pageSize;

    return {
      data: records.slice(start, start + pageSize),
      total: records.length,
      page,
      pageSize,
    };
  },

  async getEquipmentById(id: string): Promise<EquipmentRecord> {
    await mockDelay();
    return DEMO_EQUIPMENT.find((r) => r.id === id) || DEMO_EQUIPMENT[0];
  },

  async createEquipment(
    data: Partial<EquipmentRecord>,
  ): Promise<EquipmentRecord> {
    await mockDelay();
    return { ...DEMO_EQUIPMENT[0], ...data, id: 'eq-new-' + Date.now() } as EquipmentRecord;
  },

  async updateEquipment(
    id: string,
    data: Partial<EquipmentRecord>,
  ): Promise<EquipmentRecord> {
    await mockDelay();
    const existing = DEMO_EQUIPMENT.find((r) => r.id === id) || DEMO_EQUIPMENT[0];
    return { ...existing, ...data };
  },

  async getReadinessTrends(
    _unitId: string,
    timeRange?: string,
  ): Promise<ConsumptionDataPoint[]> {
    await mockDelay();
    const days = timeRangeToDays(timeRange);
    return DEMO_READINESS_TRENDS.slice(-days);
  },

  // -------------------------------------------------------------------------
  // Transportation / Movements
  // -------------------------------------------------------------------------

  async getMovements(
    filters?: { unitId?: string },
  ): Promise<Movement[]> {
    await mockDelay();
    if (!filters?.unitId) return demoMovements;
    const validIds = getDescendantUnitIds(filters.unitId);
    const unitNames = DEMO_UNITS.filter((u) => validIds.includes(u.id)).map((u) => u.abbreviation);
    return demoMovements.filter((m) =>
      unitNames.some((n) => m.originUnit.includes(n) || m.destinationUnit.includes(n)),
    );
  },

  async createMovement(data: Partial<Movement>): Promise<Movement> {
    await mockDelay();
    // Auto-generate cargo summary from manifest if not provided
    let cargoSummary = data.cargo || '';
    if (!cargoSummary && data.manifest?.cargo.length) {
      cargoSummary = data.manifest.cargo
        .map((c: CargoItem) => `CL ${c.supplyClass}: ${c.quantity} ${c.unit}`)
        .join(', ');
    }
    const newMovement: Movement = {
      id: 'mov-' + Date.now(),
      name: data.name || 'NEW CONVOY',
      originUnit: data.originUnit || 'TBD',
      destinationUnit: data.destinationUnit || 'TBD',
      status: data.status || ('PLANNED' as unknown as MovementStatus),
      cargo: cargoSummary,
      priority: data.priority || 'ROUTINE',
      departureTime: data.departureTime,
      eta: data.eta,
      vehicles: data.manifest?.totalVehicles ?? data.vehicles ?? 0,
      personnel: data.manifest?.totalPersonnel ?? data.personnel ?? 0,
      notes: data.notes,
      lastUpdated: new Date().toISOString(),
      routeWaypoints: data.routeWaypoints,
      manifest: data.manifest,
      originCoords: data.originCoords,
      destinationCoords: data.destinationCoords,
    };
    demoMovements = [...demoMovements, newMovement];
    return newMovement;
  },

  async getUnitEquipment(unitId: string): Promise<EquipmentRecord[]> {
    await mockDelay();
    return DEMO_EQUIPMENT.filter((r) => matchesUnitFilter(r.unitId, unitId));
  },

  async getUnitSupply(unitId: string): Promise<SupplyRecord[]> {
    await mockDelay();
    return DEMO_SUPPLY_RECORDS.filter((r) => matchesUnitFilter(r.unitId, unitId));
  },

  // -------------------------------------------------------------------------
  // Alerts
  // -------------------------------------------------------------------------

  async getAlerts(params?: {
    unitId?: string;
    severity?: string;
    acknowledged?: boolean;
  }): Promise<Alert[]> {
    await mockDelay();
    let alerts = [...demoAlerts];

    if (params?.unitId) {
      alerts = alerts.filter((a) => matchesUnitFilter(a.unitId, params.unitId));
    }
    if (params?.severity) {
      alerts = alerts.filter((a) => a.severity === params.severity);
    }
    if (params?.acknowledged !== undefined) {
      alerts = alerts.filter((a) => a.acknowledged === params.acknowledged);
    }

    return alerts;
  },

  async acknowledgeAlert(id: string): Promise<Alert> {
    await mockDelay();
    demoAlerts = demoAlerts.map((a) =>
      a.id === id
        ? {
            ...a,
            acknowledged: true,
            acknowledgedBy: 'Demo User',
            acknowledgedAt: new Date().toISOString(),
          }
        : a,
    );
    return demoAlerts.find((a) => a.id === id) || demoAlerts[0];
  },

  async getAlertCount(): Promise<number> {
    await mockDelay();
    return demoAlerts.filter((a) => !a.acknowledged).length;
  },

  // -------------------------------------------------------------------------
  // Reports
  // -------------------------------------------------------------------------

  async getReports(
    filters?: ReportFilters,
  ): Promise<PaginatedResponse<Report>> {
    await mockDelay();
    let reports = [...demoReports];

    if (filters?.unitId) {
      reports = reports.filter((r) => matchesUnitFilter(r.unitId, filters.unitId));
    }
    if (filters?.type) {
      reports = reports.filter((r) => r.type === filters.type);
    }
    if (filters?.status) {
      reports = reports.filter((r) => r.status === filters.status);
    }

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    const start = (page - 1) * pageSize;

    return {
      data: reports.slice(start, start + pageSize),
      total: reports.length,
      page,
      pageSize,
    };
  },

  async generateReport(params: GenerateReportParams): Promise<Report> {
    await mockDelay(800);
    const unitName =
      DEMO_UNITS.find((u) => u.id === params.unitId)?.abbreviation ||
      'Unknown';
    const content = generateMockReportContent(params.type, params.unitId, unitName);
    const report: Report = {
      id: 'rpt-new-' + Date.now(),
      type: params.type,
      title: params.title || `${params.type} Report`,
      unitId: params.unitId,
      unitName,
      dateRange: params.dateRange,
      status: 'READY' as ReportStatus,
      content: JSON.stringify(content),
      parsedContent: content,
      generatedBy: 'Demo User',
      generatedAt: new Date().toISOString(),
    };
    demoReports = [report, ...demoReports];
    return report;
  },

  async getReport(id: string): Promise<Report> {
    await mockDelay();
    return DEMO_REPORTS.find((r) => r.id === id) || DEMO_REPORTS[0];
  },

  async finalizeReport(id: string): Promise<Report> {
    await mockDelay();
    demoReports = demoReports.map((r) =>
      r.id === id
        ? { ...r, status: 'FINALIZED' as ReportStatus, finalizedAt: new Date().toISOString(), finalizedBy: 'Demo User' }
        : r,
    );
    return demoReports.find((r) => r.id === id) || demoReports[0];
  },

  // -------------------------------------------------------------------------
  // Report Export (PDF, API destinations)
  // -------------------------------------------------------------------------

  async exportReportPdf(reportId: string): Promise<Blob> {
    await mockDelay(400);
    const report = demoReports.find((r) => r.id === reportId) || demoReports[0];
    return buildReportPdf(report);
  },

  async getExportDestinations(): Promise<ExportDestination[]> {
    await mockDelay();
    return [...demoExportDestinations];
  },

  async createExportDestination(data: ExportDestinationCreate): Promise<ExportDestination> {
    await mockDelay();
    const dest: ExportDestination = {
      id: Date.now(),
      name: data.name,
      url: data.url,
      auth_type: data.auth_type,
      auth_value: data.auth_value ?? null,
      headers: data.headers ?? null,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    demoExportDestinations.push(dest);
    return dest;
  },

  async updateExportDestination(id: number, data: ExportDestinationUpdate): Promise<ExportDestination> {
    await mockDelay();
    demoExportDestinations = demoExportDestinations.map((d) =>
      d.id === id ? { ...d, ...data } as ExportDestination : d,
    );
    return demoExportDestinations.find((d) => d.id === id) || demoExportDestinations[0];
  },

  async deleteExportDestination(id: number): Promise<void> {
    await mockDelay();
    demoExportDestinations = demoExportDestinations.filter((d) => d.id !== id);
  },

  async exportReportToApi(reportId: string, destinationIds: number[]): Promise<ApiExportResponse> {
    await mockDelay(600);
    return {
      report_id: parseInt(reportId) || 0,
      results: destinationIds.map((destId) => {
        const dest = demoExportDestinations.find((d) => d.id === destId);
        return {
          destination_id: destId,
          destination_name: dest?.name || 'Unknown',
          success: true,
          status_code: 200,
          error: null,
        };
      }),
    };
  },

  // -------------------------------------------------------------------------
  // SITREP / PERSTAT / SPOTREP Quick Generation
  // -------------------------------------------------------------------------

  async generateSitrep(unitId: number, periodHours?: number): Promise<Report> {
    await mockDelay(800);
    const unit = DEMO_UNITS.find((u) => u.id === String(unitId));
    const unitName = unit?.abbreviation || 'Unknown';
    const now = new Date();
    const period = periodHours || 24;
    const periodStart = new Date(now.getTime() - period * 3600000);
    const content = [
      `SITREP`,
      `DTG: ${now.toISOString()}`,
      `FROM: ${unitName}`,
      `PERIOD: ${periodStart.toISOString()} TO ${now.toISOString()}`,
      ``,
      `1. SITUATION: Unit continues operations in AO. No significant enemy activity.`,
      ``,
      `2. PERSONNEL STRENGTH:`,
      `   AUTHORIZED: 847  ASSIGNED: 812  PRESENT: 789`,
      `   CASUALTIES LAST ${period}H: 0`,
      ``,
      `3. LOGISTICS SUMMARY:`,
      `   CLASS I: GREEN (7 DOS)`,
      `   CLASS III: AMBER (4 DOS)`,
      `   CLASS V: GREEN (8 DOS)`,
      `   CLASS IX: AMBER (3 DOS)`,
      ``,
      `4. EQUIPMENT STATUS:`,
      `   TOTAL POSSESSED: 156  MC: 136  NMC: 20`,
      `   READINESS: 87%`,
      ``,
      `5. MAINTENANCE:`,
      `   OPEN WORK ORDERS: 12  DEADLINED: 3`,
      ``,
      `6. COMMANDER'S ASSESSMENT:`,
      `   Unit maintains combat readiness. Class III resupply requested.`,
      `   No significant issues to report.`,
    ].join('\n');

    const report: Report = {
      id: 'rpt-sitrep-' + Date.now(),
      type: ReportType.SITREP,
      title: `SITREP - ${unitName} - ${now.toLocaleDateString()}`,
      unitId: String(unitId),
      unitName,
      dateRange: { start: periodStart.toISOString(), end: now.toISOString() },
      status: 'READY' as ReportStatus,
      content,
      generatedBy: 'Demo User',
      generatedAt: now.toISOString(),
    };
    demoReports = [report, ...demoReports];
    return report;
  },

  async generatePerstat(unitId: number): Promise<Report> {
    await mockDelay(800);
    const unit = DEMO_UNITS.find((u) => u.id === String(unitId));
    const unitName = unit?.abbreviation || 'Unknown';
    const now = new Date();
    const content = [
      `PERSTAT`,
      `DTG: ${now.toISOString()}`,
      `FROM: ${unitName}`,
      ``,
      `1. STRENGTH:`,
      `   AUTHORIZED OFFICERS: 42   ASSIGNED: 39`,
      `   AUTHORIZED ENLISTED: 805  ASSIGNED: 773`,
      `   TOTAL AUTHORIZED: 847     TOTAL ASSIGNED: 812`,
      `   FILL RATE: 95.9%`,
      ``,
      `2. DUTY STATUS:`,
      `   PRESENT FOR DUTY: 789`,
      `   LEAVE: 8`,
      `   TDY/TAD: 6`,
      `   MEDICAL (LIMDU): 5`,
      `   UA: 0`,
      `   ATTACHED: 4`,
      `   DETACHED: 0`,
      ``,
      `3. MOS SHORTFALLS:`,
      `   0311 (RIFLEMAN): AUTH 180, ASGD 172, SHORT 8`,
      `   0352 (ANTI-TANK): AUTH 24, ASGD 20, SHORT 4`,
      `   0621 (RADIO OPER): AUTH 36, ASGD 33, SHORT 3`,
      ``,
      `4. REMARKS:`,
      `   No significant personnel issues.`,
    ].join('\n');

    const report: Report = {
      id: 'rpt-perstat-' + Date.now(),
      type: ReportType.PERSTAT,
      title: `PERSTAT - ${unitName} - ${now.toLocaleDateString()}`,
      unitId: String(unitId),
      unitName,
      dateRange: { start: now.toISOString(), end: now.toISOString() },
      status: 'READY' as ReportStatus,
      content,
      generatedBy: 'Demo User',
      generatedAt: now.toISOString(),
    };
    demoReports = [report, ...demoReports];
    return report;
  },

  async generateSpotrep(unitId: number, data: { title: string; situation_text: string; classification?: string }): Promise<Report> {
    await mockDelay(800);
    const unit = DEMO_UNITS.find((u) => u.id === String(unitId));
    const unitName = unit?.abbreviation || 'Unknown';
    const now = new Date();
    const classification = data.classification || 'CUI';
    const content = [
      `CLASSIFICATION: ${classification}`,
      `SPOTREP`,
      `DTG: ${now.toISOString()}`,
      `FROM: ${unitName}`,
      ``,
      `LINE 1 - DATE/TIME: ${now.toISOString()}`,
      `LINE 2 - UNIT: ${unitName}`,
      `LINE 3 - SIZE/ACTIVITY: SEE BELOW`,
      `LINE 4 - LOCATION: AO ${unitName}`,
      `LINE 5 - EQUIPMENT: N/A`,
      `LINE 6 - NARRATIVE:`,
      `   ${data.situation_text}`,
      ``,
      `TITLE: ${data.title}`,
      ``,
      `ASSESSMENT: Situation under observation. No immediate action required.`,
    ].join('\n');

    const report: Report = {
      id: 'rpt-spotrep-' + Date.now(),
      type: ReportType.SPOTREP,
      title: data.title || `SPOTREP - ${unitName} - ${now.toLocaleDateString()}`,
      unitId: String(unitId),
      unitName,
      dateRange: { start: now.toISOString(), end: now.toISOString() },
      status: 'READY' as ReportStatus,
      content,
      generatedBy: 'Demo User',
      generatedAt: now.toISOString(),
    };
    demoReports = [report, ...demoReports];
    return report;
  },

  async generateRollup(unitId: number, reportType?: string): Promise<Report> {
    await mockDelay(1000);
    const unit = DEMO_UNITS.find((u) => u.id === String(unitId));
    const unitName = unit?.abbreviation || 'Unknown';
    const now = new Date();
    const rType = reportType || 'SITREP';
    const content = [
      `${rType} ROLLUP`,
      `DTG: ${now.toISOString()}`,
      `FROM: ${unitName} (ROLLUP OF SUBORDINATE UNITS)`,
      ``,
      `1. SUBORDINATE REPORTS AGGREGATED: 3`,
      `   - 1/1 BN: SUBMITTED`,
      `   - 2/1 BN: SUBMITTED`,
      `   - 3/1 BN: SUBMITTED`,
      ``,
      `2. COMBINED STRENGTH: 2,431 / 2,541 (95.7%)`,
      ``,
      `3. COMBINED LOGISTICS:`,
      `   CLASS I: GREEN  CLASS III: AMBER  CLASS V: GREEN  CLASS IX: AMBER`,
      ``,
      `4. COMBINED EQUIPMENT: 468 POSS / 407 MC (87.0%)`,
      ``,
      `5. COMMANDER'S ASSESSMENT:`,
      `   Regiment maintains combat readiness across all battalions.`,
      `   Class III resupply priority for 1/1 and 3/1 BN.`,
    ].join('\n');

    const report: Report = {
      id: 'rpt-rollup-' + Date.now(),
      type: rType as ReportType,
      title: `${rType} ROLLUP - ${unitName} - ${now.toLocaleDateString()}`,
      unitId: String(unitId),
      unitName,
      dateRange: { start: now.toISOString(), end: now.toISOString() },
      status: 'READY' as ReportStatus,
      content,
      generatedBy: 'Demo User',
      generatedAt: now.toISOString(),
    };
    demoReports = [report, ...demoReports];
    return report;
  },

  // -------------------------------------------------------------------------
  // Templates
  // -------------------------------------------------------------------------

  async getTemplates(): Promise<ReportTemplate[]> {
    await mockDelay();
    return [...demoTemplates];
  },

  async createTemplate(data: Omit<ReportTemplate, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<ReportTemplate> {
    await mockDelay();
    const template: ReportTemplate = {
      ...data,
      id: Date.now(),
      created_by: 1,
      created_at: new Date().toISOString(),
    };
    demoTemplates.push(template);
    return template;
  },

  async updateTemplate(id: number, data: Partial<ReportTemplate>): Promise<ReportTemplate> {
    await mockDelay();
    demoTemplates = demoTemplates.map((t) =>
      t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } as ReportTemplate : t,
    );
    return demoTemplates.find((t) => t.id === id) || demoTemplates[0];
  },

  async deleteTemplate(id: number): Promise<void> {
    await mockDelay();
    demoTemplates = demoTemplates.filter((t) => t.id !== id);
  },

  // -------------------------------------------------------------------------
  // Schedules
  // -------------------------------------------------------------------------

  async getSchedules(_unitId?: number): Promise<ReportSchedule[]> {
    await mockDelay();
    let schedules = [...demoSchedules];
    if (_unitId) {
      schedules = schedules.filter((s) => s.unit_id === _unitId);
    }
    return schedules;
  },

  async createSchedule(data: Omit<ReportSchedule, 'id' | 'last_generated' | 'next_generation' | 'created_at' | 'updated_at'>): Promise<ReportSchedule> {
    await mockDelay();
    const schedule: ReportSchedule = {
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    demoSchedules.push(schedule);
    return schedule;
  },

  async deleteSchedule(id: number): Promise<void> {
    await mockDelay();
    demoSchedules = demoSchedules.filter((s) => s.id !== id);
  },

  // -------------------------------------------------------------------------
  // Ingestion
  // -------------------------------------------------------------------------

  async uploadFile(_file: File): Promise<RawData> {
    await mockDelay(600);
    return {
      id: 'ing-new-' + Date.now(),
      source: 'Manual Upload',
      filename: _file.name,
      rawContent: 'Uploaded file content (demo)',
      parsedRecords: 0,
      confidence: 0,
      status: 'PENDING',
      uploadedBy: 'Demo User',
      uploadedAt: new Date().toISOString(),
    };
  },

  async getIngestionHistory(): Promise<PaginatedResponse<RawData>> {
    await mockDelay();
    return {
      data: DEMO_INGESTION_HISTORY,
      total: DEMO_INGESTION_HISTORY.length,
      page: 1,
      pageSize: 25,
    };
  },

  async getReviewQueue(): Promise<ParsedRecord[]> {
    await mockDelay();
    return demoReviewQueue.filter((r) => r.status === 'PENDING');
  },

  async approveRecord(id: string): Promise<ParsedRecord> {
    await mockDelay();
    demoReviewQueue = demoReviewQueue.map((r) =>
      r.id === id ? { ...r, status: 'APPROVED' as const } : r,
    );
    return demoReviewQueue.find((r) => r.id === id) || demoReviewQueue[0];
  },

  async rejectRecord(id: string): Promise<ParsedRecord> {
    await mockDelay();
    demoReviewQueue = demoReviewQueue.map((r) =>
      r.id === id ? { ...r, status: 'REJECTED' as const } : r,
    );
    return demoReviewQueue.find((r) => r.id === id) || demoReviewQueue[0];
  },

  async editRecord(
    id: string,
    fields: Record<string, unknown>,
  ): Promise<ParsedRecord> {
    await mockDelay();
    demoReviewQueue = demoReviewQueue.map((r) =>
      r.id === id
        ? { ...r, editedFields: fields, status: 'EDITED' as const }
        : r,
    );
    return demoReviewQueue.find((r) => r.id === id) || demoReviewQueue[0];
  },

  // -------------------------------------------------------------------------
  // Units
  // -------------------------------------------------------------------------

  async getUnits(): Promise<Unit[]> {
    await mockDelay();
    return demoUnits as unknown as Unit[];
  },

  async createUnit(data: Partial<Unit>): Promise<Unit> {
    await mockDelay();
    const newUnit: Unit = {
      id: 'unit-' + Date.now(),
      name: data.name || 'New Unit',
      echelon: data.echelon || ('COMPANY' as never),
      uic: data.uic || 'U' + Date.now().toString().slice(-5),
      parentId: data.parentId,
      abbreviation: data.abbreviation,
      customEchelonName: data.customEchelonName,
    };
    demoUnits = [...demoUnits, newUnit as unknown as typeof demoUnits[0]];
    return newUnit;
  },

  async updateUnit(id: string, data: Partial<Unit>): Promise<Unit> {
    await mockDelay();
    demoUnits = demoUnits.map((u) =>
      u.id === id ? { ...u, ...data } : u,
    );
    return (demoUnits.find((u) => u.id === id) || demoUnits[0]) as unknown as Unit;
  },

  async deleteUnit(id: string): Promise<void> {
    await mockDelay();
    const hasChildren = demoUnits.some((u) => u.parentId === id);
    if (hasChildren) {
      throw new Error('Cannot delete unit with children');
    }
    demoUnits = demoUnits.filter((u) => u.id !== id);
  },

  // -------------------------------------------------------------------------
  // Personnel
  // -------------------------------------------------------------------------

  async getPersonnel(filters?: { unitId?: string; status?: string; search?: string }): Promise<Personnel[]> {
    await mockDelay(200);
    let results = [...demoPersonnel];
    if (filters?.unitId) {
      const uid = filters.unitId;
      results = results.filter(p => matchesUnitFilter(p.unitId, uid));
    }
    if (filters?.status) results = results.filter(p => p.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(p =>
        p.edipi.includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q)
      );
    }
    return results;
  },

  async searchPersonnel(query: string): Promise<PersonnelSummary[]> {
    await mockDelay(150);
    const q = query.toLowerCase();
    return demoPersonnel
      .filter(p =>
        p.edipi.includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q)
      )
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        edipi: p.edipi,
        firstName: p.firstName,
        lastName: p.lastName,
        rank: p.rank,
        mos: p.mos,
        status: p.status,
      }));
  },

  async getPersonnelById(id: string): Promise<Personnel | null> {
    await mockDelay(150);
    return demoPersonnel.find(p => p.id === id) || null;
  },

  async getConvoyManifest(movementId: string): Promise<ConvoyManifest> {
    await mockDelay(200);
    // Return empty manifest by default
    return {
      movementId,
      vehicles: [],
      unassignedPersonnel: [],
      totalVehicles: 0,
      totalPersonnel: 0,
    };
  },

  async saveConvoyManifest(movementId: string, _manifest: ConvoyManifest): Promise<ConvoyManifest> {
    await mockDelay(300);
    // In demo mode just echo back
    return { ..._manifest, movementId };
  },

  // -------------------------------------------------------------------------
  // Individual Equipment
  // -------------------------------------------------------------------------

  async getIndividualEquipment(
    filters?: IndividualEquipmentFilters,
  ): Promise<PaginatedResponse<EquipmentItem>> {
    await mockDelay();
    let items = [...demoIndividualEquipment];
    if (filters?.unitId) items = items.filter((i) => matchesUnitFilter(i.unitId, filters.unitId));
    if (filters?.equipmentType) {
      const t = filters.equipmentType.toLowerCase();
      items = items.filter((i) => i.equipmentType.toLowerCase().includes(t));
    }
    if (filters?.status) items = items.filter((i) => i.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.equipmentType.toLowerCase().includes(q) ||
          i.bumperNumber.toLowerCase().includes(q) ||
          i.serialNumber.toLowerCase().includes(q) ||
          i.nomenclature.toLowerCase().includes(q),
      );
    }
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    const start = (page - 1) * pageSize;
    return { data: items.slice(start, start + pageSize), total: items.length, page, pageSize };
  },

  async getIndividualEquipmentById(id: string): Promise<EquipmentItem> {
    await mockDelay();
    return demoIndividualEquipment.find((i) => i.id === id) || demoIndividualEquipment[0];
  },

  async createIndividualEquipment(data: Partial<EquipmentItem>): Promise<EquipmentItem> {
    await mockDelay();
    const item = {
      ...demoIndividualEquipment[0],
      ...data,
      id: 'ie-new-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as EquipmentItem;
    demoIndividualEquipment = [...demoIndividualEquipment, item];
    return item;
  },

  async updateIndividualEquipment(id: string, data: Partial<EquipmentItem>): Promise<EquipmentItem> {
    await mockDelay();
    demoIndividualEquipment = demoIndividualEquipment.map((i) =>
      i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i,
    );
    return demoIndividualEquipment.find((i) => i.id === id) || demoIndividualEquipment[0];
  },

  async getEquipmentHistory(id: string): Promise<MaintenanceWorkOrder[]> {
    await mockDelay();
    return demoWorkOrders.filter((wo) => wo.individualEquipmentId === id);
  },

  async reportFault(equipmentId: string, data: Partial<EquipmentFault>): Promise<EquipmentFault> {
    await mockDelay();
    const fault: EquipmentFault = {
      id: 'ef-new-' + Date.now(),
      equipmentId,
      faultDescription: data.faultDescription || '',
      severity: data.severity || ('MINOR' as never),
      reportedBy: data.reportedBy || 'Demo User',
      reportedAt: new Date().toISOString(),
      ...data,
    };
    demoFaults = [...demoFaults, fault];
    return fault;
  },

  async updateFault(_equipmentId: string, faultId: string, data: Partial<EquipmentFault>): Promise<EquipmentFault> {
    await mockDelay();
    demoFaults = demoFaults.map((f) => (f.id === faultId ? { ...f, ...data } : f));
    return demoFaults.find((f) => f.id === faultId) || demoFaults[0];
  },

  async assignDriver(equipmentId: string, data: Partial<EquipmentDriverAssignment>): Promise<EquipmentDriverAssignment> {
    await mockDelay();
    const assignment: EquipmentDriverAssignment = {
      id: 'da-new-' + Date.now(),
      equipmentId,
      personnelId: data.personnelId || '',
      personnelName: data.personnelName,
      assignedAt: new Date().toISOString(),
      isPrimary: data.isPrimary ?? false,
      ...data,
    };
    demoDriverAssignments = [...demoDriverAssignments, assignment];
    return assignment;
  },

  async updateDriverAssignment(
    _equipmentId: string,
    assignmentId: string,
    data: Partial<EquipmentDriverAssignment>,
  ): Promise<EquipmentDriverAssignment> {
    await mockDelay();
    demoDriverAssignments = demoDriverAssignments.map((a) =>
      a.id === assignmentId ? { ...a, ...data } : a,
    );
    return demoDriverAssignments.find((a) => a.id === assignmentId) || demoDriverAssignments[0];
  },

  async getEquipmentFaults(equipmentId: string): Promise<EquipmentFault[]> {
    await mockDelay();
    return demoFaults.filter((f) => f.equipmentId === equipmentId);
  },

  async getEquipmentDrivers(equipmentId: string): Promise<EquipmentDriverAssignment[]> {
    await mockDelay();
    return demoDriverAssignments.filter((d) => d.equipmentId === equipmentId);
  },

  // -------------------------------------------------------------------------
  // Maintenance Work Orders
  // -------------------------------------------------------------------------

  async getWorkOrders(
    filters?: WorkOrderFilters,
  ): Promise<PaginatedResponse<MaintenanceWorkOrder>> {
    await mockDelay();
    let orders = [...demoWorkOrders];
    if (filters?.unitId) orders = orders.filter((o) => matchesUnitFilter(o.unitId, filters.unitId));
    if (filters?.equipmentId) orders = orders.filter((o) => o.individualEquipmentId === filters.equipmentId);
    if (filters?.status) orders = orders.filter((o) => o.status === filters.status);
    if (filters?.priority) orders = orders.filter((o) => o.priority === filters.priority);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.workOrderNumber.toLowerCase().includes(q) ||
          (o.description || '').toLowerCase().includes(q),
      );
    }
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 25;
    const start = (page - 1) * pageSize;
    return { data: orders.slice(start, start + pageSize), total: orders.length, page, pageSize };
  },

  async getWorkOrderById(id: string): Promise<MaintenanceWorkOrder> {
    await mockDelay();
    return demoWorkOrders.find((o) => o.id === id) || demoWorkOrders[0];
  },

  async createWorkOrder(data: Partial<MaintenanceWorkOrder>): Promise<MaintenanceWorkOrder> {
    await mockDelay();
    const wo: MaintenanceWorkOrder = {
      id: 'wo-new-' + Date.now(),
      unitId: data.unitId || '',
      workOrderNumber: 'WO-' + Date.now().toString().slice(-6),
      status: WorkOrderStatus.OPEN,
      priority: 3,
      createdAt: new Date().toISOString(),
      parts: [],
      laborEntries: [],
      ...data,
    } as MaintenanceWorkOrder;
    demoWorkOrders = [...demoWorkOrders, wo];
    return wo;
  },

  async updateWorkOrder(id: string, data: Partial<MaintenanceWorkOrder>): Promise<MaintenanceWorkOrder> {
    await mockDelay();
    demoWorkOrders = demoWorkOrders.map((o) => (o.id === id ? { ...o, ...data } : o));
    return demoWorkOrders.find((o) => o.id === id) || demoWorkOrders[0];
  },

  async deleteWorkOrder(id: string): Promise<void> {
    await mockDelay();
    demoWorkOrders = demoWorkOrders.filter((o) => o.id !== id);
  },

  async addPart(workOrderId: string, data: Partial<MaintenancePart>): Promise<MaintenancePart> {
    await mockDelay();
    const part: MaintenancePart = {
      id: 'pt-new-' + Date.now(),
      workOrderId,
      partNumber: data.partNumber || '',
      nomenclature: data.nomenclature || '',
      quantity: data.quantity || 1,
      source: data.source || ('ON_HAND' as never),
      status: data.status || ('NEEDED' as never),
      ...data,
    } as MaintenancePart;
    demoWorkOrders = demoWorkOrders.map((o) =>
      o.id === workOrderId ? { ...o, parts: [...o.parts, part] } : o,
    );
    return part;
  },

  async updatePart(workOrderId: string, partId: string, data: Partial<MaintenancePart>): Promise<MaintenancePart> {
    await mockDelay();
    let updated: MaintenancePart | undefined;
    demoWorkOrders = demoWorkOrders.map((o) => {
      if (o.id !== workOrderId) return o;
      return {
        ...o,
        parts: o.parts.map((p) => {
          if (p.id !== partId) return p;
          updated = { ...p, ...data };
          return updated;
        }),
      };
    });
    return updated || demoWorkOrders[0].parts[0];
  },

  async deletePart(workOrderId: string, partId: string): Promise<void> {
    await mockDelay();
    demoWorkOrders = demoWorkOrders.map((o) =>
      o.id === workOrderId ? { ...o, parts: o.parts.filter((p) => p.id !== partId) } : o,
    );
  },

  async addLabor(workOrderId: string, data: Partial<MaintenanceLabor>): Promise<MaintenanceLabor> {
    await mockDelay();
    const labor: MaintenanceLabor = {
      id: 'lb-new-' + Date.now(),
      workOrderId,
      personnelId: data.personnelId || '',
      laborType: data.laborType || ('REPAIR' as never),
      hours: data.hours || 0,
      date: data.date || new Date().toISOString().split('T')[0],
      ...data,
    } as MaintenanceLabor;
    demoWorkOrders = demoWorkOrders.map((o) =>
      o.id === workOrderId ? { ...o, laborEntries: [...o.laborEntries, labor] } : o,
    );
    return labor;
  },

  async updateLabor(workOrderId: string, laborId: string, data: Partial<MaintenanceLabor>): Promise<MaintenanceLabor> {
    await mockDelay();
    let updated: MaintenanceLabor | undefined;
    demoWorkOrders = demoWorkOrders.map((o) => {
      if (o.id !== workOrderId) return o;
      return {
        ...o,
        laborEntries: o.laborEntries.map((l) => {
          if (l.id !== laborId) return l;
          updated = { ...l, ...data };
          return updated;
        }),
      };
    });
    return updated || demoWorkOrders[0].laborEntries[0];
  },

  async deleteLabor(workOrderId: string, laborId: string): Promise<void> {
    await mockDelay();
    demoWorkOrders = demoWorkOrders.map((o) =>
      o.id === workOrderId
        ? { ...o, laborEntries: o.laborEntries.filter((l) => l.id !== laborId) }
        : o,
    );
  },
};

// ---------------------------------------------------------------------------
// PDF generation helper — produces a real PDF document from report data
// ---------------------------------------------------------------------------

/** Colors used throughout the PDF */
const PDF_COLORS = {
  classificationRed: [180, 30, 30] as const,
  navyBlue: [0, 42, 92] as const,
  darkText: [30, 30, 30] as const,
  grayText: [100, 100, 100] as const,
  tableHeader: [0, 42, 92] as const,
  tableHeaderText: [255, 255, 255] as const,
  tableRowAlt: [240, 244, 248] as const,
  statusRed: [180, 30, 30] as const,
  statusAmber: [180, 120, 0] as const,
  statusGreen: [0, 120, 60] as const,
  black: [0, 0, 0] as const,
  white: [255, 255, 255] as const,
};

type RGBColor = readonly [number, number, number];

function setColor(doc: jsPDF, color: RGBColor): void {
  doc.setTextColor(color[0], color[1], color[2]);
}

function setFillColor(doc: jsPDF, color: RGBColor): void {
  doc.setFillColor(color[0], color[1], color[2]);
}

function setDrawColor(doc: jsPDF, color: RGBColor): void {
  doc.setDrawColor(color[0], color[1], color[2]);
}

function statusColor(status: string): RGBColor {
  const s = status.toUpperCase();
  if (s === 'RED' || s === 'CRITICAL' || s === 'DEADLINED' || s === 'NMC_M' || s === 'NMC_S') return PDF_COLORS.statusRed;
  if (s === 'AMBER' || s === 'WARNING') return PDF_COLORS.statusAmber;
  if (s === 'GREEN' || s === 'FMC') return PDF_COLORS.statusGreen;
  return PDF_COLORS.darkText;
}

/** Check if we need a new page, return updated y position */
function checkPage(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 25) {
    doc.addPage();
    return addClassificationBanner(doc, 10);
  }
  return y;
}

/** Draw the UNCLASSIFIED banner at top of page */
function addClassificationBanner(doc: jsPDF, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  setFillColor(doc, PDF_COLORS.classificationRed);
  doc.rect(0, y - 6, pageWidth, 10, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  setColor(doc, PDF_COLORS.white);
  doc.text('UNCLASSIFIED // DEMO MODE', pageWidth / 2, y + 1, { align: 'center' });
  setColor(doc, PDF_COLORS.darkText);
  return y + 12;
}

/** Draw the KEYSTONE footer with page number */
function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    setColor(doc, PDF_COLORS.grayText);
    doc.text(`KEYSTONE — Logistics Common Operating Picture`, 15, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    // Bottom classification banner
    setFillColor(doc, PDF_COLORS.classificationRed);
    doc.rect(0, pageHeight - 6, pageWidth, 6, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    setColor(doc, PDF_COLORS.white);
    doc.text('UNCLASSIFIED // DEMO MODE', pageWidth / 2, pageHeight - 2, { align: 'center' });
  }
}

/** Draw a section header */
function addSectionHeader(doc: jsPDF, y: number, title: string): number {
  y = checkPage(doc, y, 16);
  const pageWidth = doc.internal.pageSize.getWidth();
  setFillColor(doc, PDF_COLORS.navyBlue);
  doc.rect(15, y - 4, pageWidth - 30, 8, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  setColor(doc, PDF_COLORS.white);
  doc.text(title, 18, y + 1.5);
  setColor(doc, PDF_COLORS.darkText);
  return y + 12;
}

/** Draw a key-value pair line */
function addKeyValue(doc: jsPDF, y: number, key: string, value: string, statusVal?: string): number {
  y = checkPage(doc, y, 8);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  setColor(doc, PDF_COLORS.darkText);
  doc.text(`${key}:`, 18, y);
  doc.setFont('Helvetica', 'normal');
  if (statusVal) {
    setColor(doc, statusColor(statusVal));
  } else {
    setColor(doc, PDF_COLORS.darkText);
  }
  doc.text(value, 70, y);
  setColor(doc, PDF_COLORS.darkText);
  return y + 6;
}

/** Draw a simple table with headers and rows */
function addTable(
  doc: jsPDF,
  y: number,
  headers: string[],
  rows: string[][],
  colWidths: number[],
): number {
  const startX = 18;
  const rowHeight = 7;

  // Calculate total needed height and check if we need a new page for at least header + 1 row
  y = checkPage(doc, y, rowHeight * 2 + 4);

  // Header
  setFillColor(doc, PDF_COLORS.tableHeader);
  const totalWidth = colWidths.reduce((s, w) => s + w, 0);
  doc.rect(startX - 1, y - 4.5, totalWidth + 2, rowHeight, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  setColor(doc, PDF_COLORS.tableHeaderText);

  let xPos = startX;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], xPos, y);
    xPos += colWidths[i];
  }
  y += rowHeight;

  // Data rows
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  setDrawColor(doc, [200, 200, 200]);

  for (let r = 0; r < rows.length; r++) {
    y = checkPage(doc, y, rowHeight + 2);

    // Alternating row background
    if (r % 2 === 1) {
      setFillColor(doc, PDF_COLORS.tableRowAlt);
      doc.rect(startX - 1, y - 4.5, totalWidth + 2, rowHeight, 'F');
    }

    xPos = startX;
    for (let c = 0; c < rows[r].length; c++) {
      // Color status columns
      const cellVal = rows[r][c];
      if (['RED', 'AMBER', 'GREEN', 'CRITICAL', 'DEADLINED'].includes(cellVal.toUpperCase())) {
        setColor(doc, statusColor(cellVal));
      } else {
        setColor(doc, PDF_COLORS.darkText);
      }
      doc.text(cellVal, xPos, y);
      xPos += colWidths[c];
    }
    y += rowHeight;
  }

  setColor(doc, PDF_COLORS.darkText);
  return y + 4;
}

/** Draw a Record<string, number> as a two-column table */
function addBreakdownTable(doc: jsPDF, y: number, title: string, data: Record<string, number>): number {
  y = addSectionHeader(doc, y, title);
  const entries = Object.entries(data);
  if (entries.length === 0) {
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('No data available', 18, y);
    return y + 8;
  }
  const headers = ['Category', 'Count'];
  const rows = entries.map(([k, v]) => [k, String(v)]);
  return addTable(doc, y, headers, rows, [80, 40]);
}

/** Render plain text content (for legacy reports without parsedContent) */
function addPlainTextContent(doc: jsPDF, y: number, content: string): number {
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  setColor(doc, PDF_COLORS.darkText);

  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - 36;

  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim() === '') {
      y += 4;
      continue;
    }
    // Check if line looks like a header (all caps or starts with section marker)
    if (line === line.toUpperCase() && line.trim().length > 3 && !line.startsWith(' ')) {
      y = checkPage(doc, y, 14);
      y += 2;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      setColor(doc, PDF_COLORS.navyBlue);
      doc.text(line, 18, y);
      setColor(doc, PDF_COLORS.darkText);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      y += 7;
    } else if (line.startsWith('CRITICAL:') || line.startsWith('RECOMMENDATION:')) {
      y = checkPage(doc, y, 10);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      const prefix = line.startsWith('CRITICAL:') ? 'CRITICAL:' : 'RECOMMENDATION:';
      setColor(doc, line.startsWith('CRITICAL:') ? PDF_COLORS.statusRed : PDF_COLORS.navyBlue);
      doc.text(prefix, 18, y);
      doc.setFont('Helvetica', 'normal');
      setColor(doc, PDF_COLORS.darkText);
      const rest = line.slice(prefix.length).trim();
      const wrapped = doc.splitTextToSize(rest, maxWidth - 30);
      doc.text(wrapped, 18 + doc.getTextWidth(prefix + ' '), y);
      y += wrapped.length * 5 + 3;
    } else {
      y = checkPage(doc, y, 8);
      const wrapped = doc.splitTextToSize(line, maxWidth);
      doc.text(wrapped, 18, y);
      y += wrapped.length * 5 + 1;
    }
  }
  return y;
}

/** Render structured LOGSTAT content */
function renderLogstat(doc: jsPDF, y: number, c: ReportContent): number {
  // Equipment Readiness
  if (c.equipment_readiness) {
    y = addSectionHeader(doc, y, 'EQUIPMENT READINESS');
    y = addKeyValue(doc, y, 'Total Possessed', String(c.equipment_readiness.total_possessed));
    y = addKeyValue(doc, y, 'Mission Capable', String(c.equipment_readiness.total_mission_capable));
    y = addKeyValue(doc, y, 'Readiness', `${c.equipment_readiness.readiness_pct}%`, c.equipment_readiness.status);
    y = addKeyValue(doc, y, 'Status', c.equipment_readiness.status, c.equipment_readiness.status);
    y += 4;
  }

  // Supply Status
  if (c.supply_status && c.supply_status.length > 0) {
    y = addSectionHeader(doc, y, 'SUPPLY STATUS');
    for (const ss of c.supply_status) {
      y = checkPage(doc, y, 20);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      setColor(doc, PDF_COLORS.navyBlue);
      doc.text(`Class ${ss.class} — ${ss.class_name}`, 18, y);
      if (ss.overall_status) {
        setColor(doc, statusColor(ss.overall_status));
        doc.text(`  [${ss.overall_status}]`, 18 + doc.getTextWidth(`Class ${ss.class} — ${ss.class_name}`), y);
      }
      setColor(doc, PDF_COLORS.darkText);
      y += 8;

      if (ss.items.length > 0) {
        const headers = ['Item', 'On Hand', 'Required', 'DOS', 'Rate', 'Status'];
        const rows = ss.items.map(it => [
          it.item.length > 22 ? it.item.slice(0, 22) + '...' : it.item,
          String(it.on_hand),
          String(it.required),
          it.dos.toFixed(1),
          it.consumption_rate.toFixed(2),
          it.status,
        ]);
        y = addTable(doc, y, headers, rows, [50, 22, 22, 18, 18, 20]);
      }
    }
  }

  // Summary line items
  if (c.open_work_orders !== undefined) {
    y = addSectionHeader(doc, y, 'ADDITIONAL METRICS');
    y = addKeyValue(doc, y, 'Open Work Orders', String(c.open_work_orders));
    if (c.active_movements !== undefined) y = addKeyValue(doc, y, 'Active Movements', String(c.active_movements));
    if (c.personnel_strength !== undefined) y = addKeyValue(doc, y, 'Personnel Strength', String(c.personnel_strength));
    if (c.total_supply_items !== undefined) y = addKeyValue(doc, y, 'Total Supply Items', String(c.total_supply_items));
  }
  return y;
}

/** Render structured READINESS content */
function renderReadiness(doc: jsPDF, y: number, c: ReportContent): number {
  y = addSectionHeader(doc, y, 'OVERALL READINESS');
  if (c.overall_readiness_pct !== undefined) {
    y = addKeyValue(doc, y, 'Readiness', `${c.overall_readiness_pct}%`, c.overall_status);
  }
  if (c.overall_status) y = addKeyValue(doc, y, 'Status', c.overall_status, c.overall_status);
  if (c.total_possessed !== undefined) y = addKeyValue(doc, y, 'Total Possessed', String(c.total_possessed));
  if (c.total_mission_capable !== undefined) y = addKeyValue(doc, y, 'Mission Capable', String(c.total_mission_capable));
  if (c.total_nmc !== undefined) y = addKeyValue(doc, y, 'Not Mission Capable', String(c.total_nmc));
  y += 4;

  if (c.equipment_types && c.equipment_types.length > 0) {
    y = addSectionHeader(doc, y, 'EQUIPMENT BY TYPE');
    const headers = ['TAMCN', 'Nomenclature', 'Poss', 'MC', 'NMC-M', 'NMC-S', 'Rdns %', 'Status'];
    const rows = c.equipment_types.map(et => [
      et.tamcn,
      et.nomenclature.length > 18 ? et.nomenclature.slice(0, 18) + '..' : et.nomenclature,
      String(et.total_possessed),
      String(et.mission_capable),
      String(et.nmc_maintenance ?? '-'),
      String(et.nmc_supply ?? '-'),
      `${et.readiness_pct.toFixed(1)}%`,
      et.status,
    ]);
    y = addTable(doc, y, headers, rows, [22, 38, 16, 16, 18, 18, 20, 18]);
  }

  if (c.individual_status_breakdown) {
    y = addBreakdownTable(doc, y, 'INDIVIDUAL STATUS BREAKDOWN', c.individual_status_breakdown);
  }

  if (c.deadlined_items && c.deadlined_items.length > 0) {
    y = addSectionHeader(doc, y, 'DEADLINED ITEMS');
    const headers = ['Bumper #', 'Nomenclature', 'TAMCN', 'Type'];
    const rows = c.deadlined_items.map(d => [
      d.bumper_number,
      d.nomenclature.length > 20 ? d.nomenclature.slice(0, 20) + '..' : d.nomenclature,
      d.tamcn,
      d.equipment_type.length > 18 ? d.equipment_type.slice(0, 18) + '..' : d.equipment_type,
    ]);
    y = addTable(doc, y, headers, rows, [30, 45, 25, 45]);
  }
  return y;
}

/** Render structured SUPPLY_STATUS content */
function renderSupplyStatus(doc: jsPDF, y: number, c: ReportContent): number {
  y = addSectionHeader(doc, y, 'SUPPLY OVERVIEW');
  if (c.overall_health) y = addKeyValue(doc, y, 'Overall Health', c.overall_health, c.overall_health);
  if (c.total_classes_tracked !== undefined) y = addKeyValue(doc, y, 'Classes Tracked', String(c.total_classes_tracked));
  if (c.red_classes !== undefined) y = addKeyValue(doc, y, 'Classes RED', String(c.red_classes), 'RED');
  if (c.amber_classes !== undefined) y = addKeyValue(doc, y, 'Classes AMBER', String(c.amber_classes), 'AMBER');
  y += 4;

  if (c.class_summaries && c.class_summaries.length > 0) {
    y = addSectionHeader(doc, y, 'CLASS SUMMARIES');
    const headers = ['Class', 'Name', 'Fill %', 'Avg DOS', 'Items', 'RED', 'AMBER', 'Status'];
    const rows = c.class_summaries.map(cs => [
      cs.supply_class,
      cs.class_name.length > 16 ? cs.class_name.slice(0, 16) + '..' : cs.class_name,
      `${cs.fill_rate_pct}%`,
      cs.avg_dos.toFixed(1),
      String(cs.item_count),
      String(cs.red_items),
      String(cs.amber_items),
      cs.status,
    ]);
    y = addTable(doc, y, headers, rows, [16, 32, 18, 20, 18, 16, 18, 18]);

    // Critical items per class
    for (const cs of c.class_summaries) {
      if (cs.critical_items && cs.critical_items.length > 0) {
        y = checkPage(doc, y, 30);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        setColor(doc, PDF_COLORS.statusRed);
        doc.text(`Critical Items — Class ${cs.supply_class}`, 18, y);
        setColor(doc, PDF_COLORS.darkText);
        y += 8;
        const critHeaders = ['Item', 'On Hand', 'Required', 'DOS'];
        const critRows = cs.critical_items.map(ci => [
          ci.item.length > 30 ? ci.item.slice(0, 30) + '..' : ci.item,
          String(ci.on_hand),
          String(ci.required),
          ci.dos.toFixed(1),
        ]);
        y = addTable(doc, y, critHeaders, critRows, [60, 25, 25, 20]);
      }
    }
  }
  return y;
}

/** Render structured EQUIPMENT_STATUS content */
function renderEquipmentStatus(doc: jsPDF, y: number, c: ReportContent): number {
  if (c.fleet_readiness) {
    y = addSectionHeader(doc, y, 'FLEET READINESS');
    y = addKeyValue(doc, y, 'Total Possessed', String(c.fleet_readiness.total_possessed));
    y = addKeyValue(doc, y, 'Mission Capable', String(c.fleet_readiness.total_mission_capable));
    y = addKeyValue(doc, y, 'NMC (Maintenance)', String(c.fleet_readiness.total_nmc_maintenance));
    y = addKeyValue(doc, y, 'NMC (Supply)', String(c.fleet_readiness.total_nmc_supply));
    y = addKeyValue(doc, y, 'Readiness', `${c.fleet_readiness.readiness_pct}%`, c.fleet_readiness.status);
    y += 4;
  }

  if (c.fleet_by_type && c.fleet_by_type.length > 0) {
    y = addSectionHeader(doc, y, 'FLEET BY TYPE');
    const headers = ['TAMCN', 'Nomenclature', 'Poss', 'MC', 'NMC-M', 'NMC-S', 'Rdns %', 'Status'];
    const rows = c.fleet_by_type.map(ft => [
      ft.tamcn,
      ft.nomenclature.length > 18 ? ft.nomenclature.slice(0, 18) + '..' : ft.nomenclature,
      String(ft.total_possessed),
      String(ft.mission_capable),
      String(ft.nmc_maintenance ?? '-'),
      String(ft.nmc_supply ?? '-'),
      `${ft.readiness_pct.toFixed(1)}%`,
      ft.status,
    ]);
    y = addTable(doc, y, headers, rows, [22, 38, 16, 16, 18, 18, 20, 18]);
  }

  if (c.top_deadlined_items && c.top_deadlined_items.length > 0) {
    y = addSectionHeader(doc, y, 'TOP DEADLINED ITEMS');
    const headers = ['Bumper #', 'Nomenclature', 'TAMCN', 'Fault'];
    const rows = c.top_deadlined_items.map(d => [
      d.bumper_number,
      d.nomenclature.length > 20 ? d.nomenclature.slice(0, 20) + '..' : d.nomenclature,
      d.tamcn,
      (d.fault || 'N/A').length > 25 ? (d.fault || 'N/A').slice(0, 25) + '..' : (d.fault || 'N/A'),
    ]);
    y = addTable(doc, y, headers, rows, [30, 42, 25, 50]);
  }
  return y;
}

/** Render structured MAINTENANCE_SUMMARY content */
function renderMaintenanceSummary(doc: jsPDF, y: number, c: ReportContent): number {
  y = addSectionHeader(doc, y, 'WORK ORDER SUMMARY');
  if (c.total_work_orders !== undefined) y = addKeyValue(doc, y, 'Total Work Orders', String(c.total_work_orders));
  if (c.avg_completion_time_hours !== undefined) y = addKeyValue(doc, y, 'Avg Completion Time', `${c.avg_completion_time_hours} hrs`);
  if (c.total_labor_hours !== undefined) y = addKeyValue(doc, y, 'Total Labor Hours', String(c.total_labor_hours));
  if (c.parts_on_order !== undefined) y = addKeyValue(doc, y, 'Parts On Order', String(c.parts_on_order));
  y += 4;

  if (c.work_order_counts) {
    y = addBreakdownTable(doc, y, 'WORK ORDERS BY STATUS', c.work_order_counts);
  }

  if (c.top_issues && c.top_issues.length > 0) {
    y = addSectionHeader(doc, y, 'TOP MAINTENANCE ISSUES');
    const headers = ['Equipment Type', 'Open Work Orders'];
    const rows = c.top_issues.map(ti => [ti.equipment_type, String(ti.open_work_orders)]);
    y = addTable(doc, y, headers, rows, [80, 40]);
  }
  return y;
}

/** Render structured MOVEMENT_SUMMARY content */
function renderMovementSummary(doc: jsPDF, y: number, c: ReportContent): number {
  y = addSectionHeader(doc, y, 'MOVEMENT OVERVIEW');
  if (c.total_movements !== undefined) y = addKeyValue(doc, y, 'Total Movements', String(c.total_movements));
  if (c.total_vehicles_in_transit !== undefined) y = addKeyValue(doc, y, 'Vehicles In Transit', String(c.total_vehicles_in_transit));
  if (c.total_personnel_in_transit !== undefined) y = addKeyValue(doc, y, 'Personnel In Transit', String(c.total_personnel_in_transit));
  y += 4;

  if (c.status_counts) {
    y = addBreakdownTable(doc, y, 'MOVEMENTS BY STATUS', c.status_counts);
  }

  if (c.recent_completions && c.recent_completions.length > 0) {
    y = addSectionHeader(doc, y, 'RECENT COMPLETIONS');
    const headers = ['Convoy ID', 'Origin', 'Destination', 'Vehicles', 'Arrival'];
    const rows = c.recent_completions.map(rc => [
      rc.convoy_id || '-',
      rc.origin.length > 18 ? rc.origin.slice(0, 18) + '..' : rc.origin,
      rc.destination.length > 18 ? rc.destination.slice(0, 18) + '..' : rc.destination,
      String(rc.vehicle_count),
      rc.arrival ? new Date(rc.arrival).toLocaleDateString() : '-',
    ]);
    y = addTable(doc, y, headers, rows, [28, 36, 36, 22, 28]);
  }
  return y;
}

/** Render structured PERSONNEL_STRENGTH content */
function renderPersonnelStrength(doc: jsPDF, y: number, c: ReportContent): number {
  y = addSectionHeader(doc, y, 'PERSONNEL OVERVIEW');
  if (c.total_assigned !== undefined) y = addKeyValue(doc, y, 'Total Assigned', String(c.total_assigned));
  if (c.total_active !== undefined) y = addKeyValue(doc, y, 'Total Active', String(c.total_active));
  y += 4;

  if (c.status_breakdown) {
    y = addBreakdownTable(doc, y, 'STATUS BREAKDOWN', c.status_breakdown);
  }
  if (c.rank_breakdown) {
    y = addBreakdownTable(doc, y, 'RANK BREAKDOWN', c.rank_breakdown);
  }
  if (c.mos_breakdown) {
    y = addBreakdownTable(doc, y, 'MOS BREAKDOWN', c.mos_breakdown);
  }
  return y;
}

/** Build a complete PDF document for a report */
function buildReportPdf(report: Report): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 10;

  // Classification banner
  y = addClassificationBanner(doc, y);
  y += 4;

  // Report title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  setColor(doc, PDF_COLORS.navyBlue);
  const titleLines = doc.splitTextToSize(report.title, pageWidth - 40);
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
  y += titleLines.length * 7 + 4;

  // Horizontal rule
  setDrawColor(doc, PDF_COLORS.navyBlue);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  // Metadata block
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  setColor(doc, PDF_COLORS.darkText);
  y = addKeyValue(doc, y, 'Unit', report.unitName);
  y = addKeyValue(doc, y, 'Report Type', report.type);
  y = addKeyValue(doc, y, 'Status', report.status, report.status === 'FINALIZED' ? 'GREEN' : report.status === 'DRAFT' ? 'AMBER' : undefined);
  y = addKeyValue(doc, y, 'Generated', new Date(report.generatedAt).toLocaleString());
  y = addKeyValue(doc, y, 'Generated By', report.generatedBy);
  if (report.finalizedBy) {
    y = addKeyValue(doc, y, 'Finalized By', report.finalizedBy);
  }
  if (report.dateRange) {
    const start = new Date(report.dateRange.start).toLocaleDateString();
    const end = new Date(report.dateRange.end).toLocaleDateString();
    y = addKeyValue(doc, y, 'Period', `${start} — ${end}`);
  }
  y += 6;

  // Content
  // Try structured parsedContent first, then fall back to JSON-parsed content string, then plain text
  let structured: ReportContent | null = null;
  if (report.parsedContent) {
    structured = report.parsedContent;
  } else if (report.content) {
    try {
      const parsed = JSON.parse(report.content) as ReportContent;
      if (parsed && typeof parsed === 'object' && parsed.report_type) {
        structured = parsed;
      }
    } catch {
      // Not JSON — use plain text fallback
    }
  }

  if (structured) {
    // Route to the appropriate renderer based on report type
    const rt = (structured.report_type || report.type || '').toUpperCase();
    if (rt === 'LOGSTAT') {
      y = renderLogstat(doc, y, structured);
    } else if (rt === 'READINESS') {
      y = renderReadiness(doc, y, structured);
    } else if (rt === 'SUPPLY_STATUS') {
      y = renderSupplyStatus(doc, y, structured);
    } else if (rt === 'EQUIPMENT_STATUS') {
      y = renderEquipmentStatus(doc, y, structured);
    } else if (rt === 'MAINTENANCE_SUMMARY') {
      y = renderMaintenanceSummary(doc, y, structured);
    } else if (rt === 'MOVEMENT_SUMMARY') {
      y = renderMovementSummary(doc, y, structured);
    } else if (rt === 'PERSONNEL_STRENGTH') {
      y = renderPersonnelStrength(doc, y, structured);
    } else {
      // Generic: render all key-value pairs we can
      y = addSectionHeader(doc, y, 'REPORT DATA');
      for (const [key, value] of Object.entries(structured)) {
        if (key === 'report_type' || key === 'unit' || key === 'generated_at' || key === 'period_start' || key === 'period_end') continue;
        if (typeof value === 'string' || typeof value === 'number') {
          y = addKeyValue(doc, y, key.replace(/_/g, ' ').toUpperCase(), String(value));
        }
      }
    }
  } else if (report.content) {
    // Plain text content (legacy demo reports)
    y = addSectionHeader(doc, y, 'REPORT CONTENT');
    y = addPlainTextContent(doc, y, report.content);
  } else {
    // No content at all
    y = addSectionHeader(doc, y, 'REPORT CONTENT');
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(10);
    setColor(doc, PDF_COLORS.grayText);
    doc.text('Report content is being generated...', 18, y);
    // suppress unused warning
    void y;
  }

  // Footer on all pages
  addFooter(doc);

  return doc.output('blob');
}

// ---------------------------------------------------------------------------
// Mock report content generator — builds realistic structured data
// from existing demo data for each report type.
// ---------------------------------------------------------------------------

function generateMockReportContent(
  reportType: ReportType | string,
  unitId: string,
  unitName: string,
): ReportContent {
  const now = new Date();
  const base: ReportContent = {
    report_type: String(reportType),
    unit: { id: Number(unitId) || 1, name: unitName, abbreviation: unitName },
    generated_at: now.toISOString(),
    period_start: new Date(now.getTime() - 7 * 86400000).toISOString(),
    period_end: now.toISOString(),
  };

  switch (reportType) {
    case ReportType.LOGSTAT:
    case 'LOGSTAT':
      return {
        ...base,
        dtg: now.toISOString(),
        as_of: now.toISOString(),
        supply_status: [
          {
            class: 'I', class_name: 'Subsistence',
            items: DEMO_SUPPLY_RECORDS.filter(r => r.supplyClass === 'I').slice(0, 3).map(r => ({
              item: r.item, on_hand: r.onHand, required: r.required, dos: r.dos,
              consumption_rate: r.consumptionRate, status: r.status,
            })),
            overall_status: 'AMBER',
          },
          {
            class: 'III', class_name: 'POL (Petroleum, Oils, Lubricants)',
            items: DEMO_SUPPLY_RECORDS.filter(r => r.supplyClass === 'III').slice(0, 3).map(r => ({
              item: r.item, on_hand: r.onHand, required: r.required, dos: r.dos,
              consumption_rate: r.consumptionRate, status: r.status,
            })),
            overall_status: 'RED',
          },
          {
            class: 'V', class_name: 'Ammunition',
            items: DEMO_SUPPLY_RECORDS.filter(r => r.supplyClass === 'V').slice(0, 3).map(r => ({
              item: r.item, on_hand: r.onHand, required: r.required, dos: r.dos,
              consumption_rate: r.consumptionRate, status: r.status,
            })),
            overall_status: 'GREEN',
          },
          {
            class: 'IX', class_name: 'Repair Parts',
            items: DEMO_SUPPLY_RECORDS.filter(r => r.supplyClass === 'IX').slice(0, 3).map(r => ({
              item: r.item, on_hand: r.onHand, required: r.required, dos: r.dos,
              consumption_rate: r.consumptionRate, status: r.status,
            })),
            overall_status: 'AMBER',
          },
        ],
        equipment_readiness: {
          total_possessed: DEMO_EQUIPMENT.reduce((s, e) => s + e.onHand, 0),
          total_mission_capable: DEMO_EQUIPMENT.reduce((s, e) => s + e.missionCapable, 0),
          readiness_pct: 87.3,
          status: 'AMBER',
        },
        open_work_orders: demoWorkOrders.filter(wo => wo.status !== WorkOrderStatus.COMPLETE).length,
        active_movements: DEMO_MOVEMENTS.filter(m => m.status === 'EN_ROUTE' || m.status === 'PLANNED').length,
        personnel_strength: demoPersonnel.filter(p => p.status !== 'INACTIVE').length,
        total_supply_items: DEMO_SUPPLY_RECORDS.length,
      };

    case ReportType.READINESS:
    case 'READINESS':
      return {
        ...base,
        overall_readiness_pct: 87.3,
        overall_status: 'AMBER',
        total_possessed: DEMO_EQUIPMENT.reduce((s, e) => s + e.onHand, 0),
        total_mission_capable: DEMO_EQUIPMENT.reduce((s, e) => s + e.missionCapable, 0),
        total_nmc: DEMO_EQUIPMENT.reduce((s, e) => s + e.notMissionCapable, 0),
        equipment_types: DEMO_EQUIPMENT.map(e => ({
          tamcn: e.tamcn,
          nomenclature: e.type,
          total_possessed: e.onHand,
          mission_capable: e.missionCapable,
          nmc_maintenance: Math.floor(e.notMissionCapable * 0.6),
          nmc_supply: Math.ceil(e.notMissionCapable * 0.4),
          readiness_pct: e.readinessPercent,
          status: e.readinessPercent >= 90 ? 'GREEN' : e.readinessPercent >= 75 ? 'AMBER' : 'RED',
        })),
        equipment_type_count: DEMO_EQUIPMENT.length,
        individual_status_breakdown: {
          FMC: demoIndividualEquipment.filter(i => i.status === 'FMC').length,
          NMC_M: demoIndividualEquipment.filter(i => i.status === 'NMC_M').length,
          NMC_S: demoIndividualEquipment.filter(i => i.status === 'NMC_S').length,
          ADMIN: demoIndividualEquipment.filter(i => i.status === 'ADMIN').length,
          DEADLINED: demoIndividualEquipment.filter(i => i.status === 'DEADLINED').length,
        },
        deadlined_items: demoIndividualEquipment
          .filter(i => i.status === 'DEADLINED')
          .slice(0, 5)
          .map(i => ({
            bumper_number: i.bumperNumber,
            nomenclature: i.nomenclature,
            tamcn: i.tamcn,
            equipment_type: i.equipmentType,
          })),
      };

    case ReportType.SUPPLY_STATUS:
    case 'SUPPLY_STATUS': {
      const classes = ['I', 'II', 'III', 'IV', 'V', 'VIII', 'IX'];
      const classSummaries = classes.map(cls => {
        const records = DEMO_SUPPLY_RECORDS.filter(r => r.supplyClass === cls);
        const totalOnHand = records.reduce((s, r) => s + r.onHand, 0);
        const totalRequired = records.reduce((s, r) => s + r.required, 0);
        const avgDos = records.length ? records.reduce((s, r) => s + r.dos, 0) / records.length : 0;
        const redItems = records.filter(r => r.status === 'RED');
        const classNames: Record<string, string> = {
          I: 'Subsistence', II: 'Clothing & Equipment', III: 'POL',
          IV: 'Construction', V: 'Ammunition', VIII: 'Medical', IX: 'Repair Parts',
        };
        return {
          supply_class: cls,
          class_name: classNames[cls] || cls,
          total_on_hand: Math.round(totalOnHand * 10) / 10,
          total_required: Math.round(totalRequired * 10) / 10,
          fill_rate_pct: totalRequired > 0 ? Math.round(totalOnHand / totalRequired * 1000) / 10 : 0,
          avg_dos: Math.round(avgDos * 10) / 10,
          avg_consumption_rate: records.length ? Math.round(records.reduce((s, r) => s + r.consumptionRate, 0) / records.length * 100) / 100 : 0,
          item_count: records.length,
          red_items: redItems.length,
          amber_items: records.filter(r => r.status === 'AMBER').length,
          status: avgDos > 5 ? 'GREEN' : avgDos > 3 ? 'AMBER' : 'RED',
          critical_items: redItems.slice(0, 5).map(r => ({
            item: r.item, on_hand: r.onHand, required: r.required, dos: r.dos,
          })),
        };
      }).filter(c => c.item_count > 0);
      return {
        ...base,
        overall_health: classSummaries.some(c => c.status === 'RED') ? 'RED' : classSummaries.some(c => c.status === 'AMBER') ? 'AMBER' : 'GREEN',
        total_classes_tracked: classSummaries.length,
        red_classes: classSummaries.filter(c => c.status === 'RED').length,
        amber_classes: classSummaries.filter(c => c.status === 'AMBER').length,
        class_summaries: classSummaries,
      };
    }

    case ReportType.EQUIPMENT_STATUS:
    case 'EQUIPMENT_STATUS':
      return {
        ...base,
        fleet_readiness: {
          total_possessed: DEMO_EQUIPMENT.reduce((s, e) => s + e.onHand, 0),
          total_mission_capable: DEMO_EQUIPMENT.reduce((s, e) => s + e.missionCapable, 0),
          total_nmc_maintenance: DEMO_EQUIPMENT.reduce((s, e) => s + Math.floor(e.notMissionCapable * 0.6), 0),
          total_nmc_supply: DEMO_EQUIPMENT.reduce((s, e) => s + Math.ceil(e.notMissionCapable * 0.4), 0),
          readiness_pct: 87.3,
          status: 'AMBER',
        },
        fleet_by_type: DEMO_EQUIPMENT.map(e => ({
          tamcn: e.tamcn,
          nomenclature: e.type,
          total_possessed: e.onHand,
          mission_capable: e.missionCapable,
          nmc_maintenance: Math.floor(e.notMissionCapable * 0.6),
          nmc_supply: Math.ceil(e.notMissionCapable * 0.4),
          readiness_pct: e.readinessPercent,
          status: e.readinessPercent >= 90 ? 'GREEN' : e.readinessPercent >= 75 ? 'AMBER' : 'RED',
        })),
        individual_status_breakdown: {
          FMC: demoIndividualEquipment.filter(i => i.status === 'FMC').length,
          NMC_M: demoIndividualEquipment.filter(i => i.status === 'NMC_M').length,
          NMC_S: demoIndividualEquipment.filter(i => i.status === 'NMC_S').length,
          ADMIN: demoIndividualEquipment.filter(i => i.status === 'ADMIN').length,
          DEADLINED: demoIndividualEquipment.filter(i => i.status === 'DEADLINED').length,
        },
        individual_total: demoIndividualEquipment.length,
        top_deadlined_items: demoIndividualEquipment
          .filter(i => i.status === 'DEADLINED')
          .slice(0, 5)
          .map(i => ({
            bumper_number: i.bumperNumber,
            nomenclature: i.nomenclature,
            tamcn: i.tamcn,
            equipment_type: i.equipmentType,
            fault: demoFaults.find(f => f.equipmentId === i.id)?.faultDescription || 'No active fault',
            fault_severity: demoFaults.find(f => f.equipmentId === i.id)?.severity,
          })),
      };

    case ReportType.MAINTENANCE_SUMMARY:
    case 'MAINTENANCE_SUMMARY': {
      const open = demoWorkOrders.filter(wo => wo.status === WorkOrderStatus.OPEN).length;
      const inProg = demoWorkOrders.filter(wo => wo.status === WorkOrderStatus.IN_PROGRESS).length;
      const awaitParts = demoWorkOrders.filter(wo => wo.status === WorkOrderStatus.AWAITING_PARTS).length;
      const complete = demoWorkOrders.filter(wo => wo.status === WorkOrderStatus.COMPLETE).length;
      const totalLabor = demoWorkOrders.reduce((s, wo) => s + wo.laborEntries.reduce((ls, l) => ls + l.hours, 0), 0);
      const partsOnOrder = demoWorkOrders.reduce((s, wo) => s + wo.parts.filter(p => p.status === 'ON_ORDER').length, 0);
      const issueMap: Record<string, number> = {};
      demoWorkOrders.filter(wo => wo.status !== WorkOrderStatus.COMPLETE).forEach(wo => {
        if (wo.individualEquipmentId) {
          const eq = demoIndividualEquipment.find(e => e.id === wo.individualEquipmentId);
          if (eq) issueMap[eq.equipmentType] = (issueMap[eq.equipmentType] || 0) + 1;
        }
      });
      return {
        ...base,
        work_order_counts: { OPEN: open, IN_PROGRESS: inProg, AWAITING_PARTS: awaitParts, COMPLETE: complete },
        total_work_orders: demoWorkOrders.length,
        avg_completion_time_hours: 36.4,
        total_labor_hours: Math.round(totalLabor * 10) / 10,
        parts_on_order: partsOnOrder,
        top_issues: Object.entries(issueMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([et, cnt]) => ({ equipment_type: et, open_work_orders: cnt })),
      };
    }

    case ReportType.MOVEMENT_SUMMARY:
    case 'MOVEMENT_SUMMARY':
      return {
        ...base,
        status_counts: {
          PLANNED: DEMO_MOVEMENTS.filter(m => m.status === 'PLANNED').length,
          EN_ROUTE: DEMO_MOVEMENTS.filter(m => m.status === 'EN_ROUTE').length,
          DELAYED: DEMO_MOVEMENTS.filter(m => m.status === 'DELAYED').length,
          ARRIVED: DEMO_MOVEMENTS.filter(m => m.status === 'ARRIVED').length,
          CANCELLED: DEMO_MOVEMENTS.filter(m => m.status === 'CANCELLED').length,
        },
        total_movements: DEMO_MOVEMENTS.length,
        total_vehicles_in_transit: DEMO_MOVEMENTS
          .filter(m => m.status === 'EN_ROUTE')
          .reduce((s, m) => s + m.vehicles, 0),
        total_personnel_in_transit: DEMO_MOVEMENTS
          .filter(m => m.status === 'EN_ROUTE')
          .reduce((s, m) => s + m.personnel, 0),
        recent_completions: DEMO_MOVEMENTS
          .filter(m => m.status === 'ARRIVED')
          .slice(0, 5)
          .map(m => ({
            convoy_id: m.id,
            origin: m.originUnit,
            destination: m.destinationUnit,
            vehicle_count: m.vehicles,
            arrival: m.arrivalTime || null,
          })),
      };

    case ReportType.PERSONNEL_STRENGTH:
    case 'PERSONNEL_STRENGTH': {
      const statusBreakdown: Record<string, number> = {
        ACTIVE: 0, DEPLOYED: 0, TDY: 0, LEAVE: 0, MEDICAL: 0, INACTIVE: 0,
      };
      demoPersonnel.forEach(p => { statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1; });
      const rankBreakdown: Record<string, number> = {};
      demoPersonnel.forEach(p => { const r = p.rank || 'Unknown'; rankBreakdown[r] = (rankBreakdown[r] || 0) + 1; });
      const mosBreakdown: Record<string, number> = {};
      demoPersonnel.forEach(p => { const m = p.mos || 'Unknown'; mosBreakdown[m] = (mosBreakdown[m] || 0) + 1; });
      return {
        ...base,
        total_assigned: demoPersonnel.length,
        total_active: demoPersonnel.filter(p => p.status !== 'INACTIVE').length,
        status_breakdown: statusBreakdown,
        rank_breakdown: rankBreakdown,
        mos_breakdown: mosBreakdown,
      };
    }

    default:
      return base;
  }
}
