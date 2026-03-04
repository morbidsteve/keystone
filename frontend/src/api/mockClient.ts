// =============================================================================
// KEYSTONE Demo Mode — Mock API Client
// Intercepts all API calls and returns realistic demo data when VITE_DEMO_MODE
// is enabled or when no backend URL is configured.
// =============================================================================

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
  Movement,
  Alert,
  Report,
  RawData,
  ParsedRecord,
  ConsumptionDataPoint,
  PaginatedResponse,
  SupplyFilters,
  EquipmentFilters,
  ReportFilters,
  GenerateReportParams,
  ReportStatus,
  ReportType,
  MovementStatus,
  CargoItem,
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

  async getDashboardSummary(_unitId?: string, _timeRange?: string): Promise<DashboardSummary> {
    await mockDelay();
    return DEMO_DASHBOARD_SUMMARY;
  },

  async getSupplyOverview(_unitId?: string, _timeRange?: string): Promise<SupplyClassSummary[]> {
    await mockDelay();
    return DEMO_DASHBOARD_SUMMARY.supplyStatus;
  },

  async getReadinessOverview(_unitId?: string, _timeRange?: string): Promise<ReadinessSummary> {
    await mockDelay();
    return DEMO_DASHBOARD_SUMMARY.equipmentReadiness;
  },

  async getSustainability(
    _unitId?: string,
    _timeRange?: string,
  ): Promise<SustainabilityProjection[]> {
    await mockDelay();
    return DEMO_SUSTAINABILITY;
  },

  async getDashboardAlerts(_unitId?: string, _timeRange?: string): Promise<Alert[]> {
    await mockDelay();
    const days = timeRangeToDays(_timeRange);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return demoAlerts.filter((a) => !a.acknowledged && new Date(a.createdAt) >= cutoff).slice(0, 5);
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
      records = records.filter((r) => r.unitId === filters.unitId);
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
      records = records.filter((r) => r.unitId === filters.unitId);
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
    _filters?: Record<string, unknown>,
  ): Promise<Movement[]> {
    await mockDelay();
    return demoMovements;
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
    return DEMO_EQUIPMENT.filter((r) => r.unitId === unitId);
  },

  async getUnitSupply(unitId: string): Promise<SupplyRecord[]> {
    await mockDelay();
    return DEMO_SUPPLY_RECORDS.filter((r) => r.unitId === unitId);
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
      alerts = alerts.filter((a) => a.unitId === params.unitId);
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
      reports = reports.filter((r) => r.unitId === filters.unitId);
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
    return {
      id: 'rpt-new-' + Date.now(),
      type: params.type,
      title: params.title || `${params.type} Report`,
      unitId: params.unitId,
      unitName:
        DEMO_UNITS.find((u) => u.id === params.unitId)?.abbreviation ||
        'Unknown',
      dateRange: params.dateRange,
      status: 'GENERATING' as ReportStatus,
      generatedBy: 'Demo User',
      generatedAt: new Date().toISOString(),
    };
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
};
