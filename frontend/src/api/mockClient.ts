// =============================================================================
// KEYSTONE Demo Mode — Mock API Client
// Intercepts all API calls and returns realistic demo data when VITE_DEMO_MODE
// is enabled or when no backend URL is configured.
// =============================================================================

import type {
  LoginResponse,
  User,
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

  async getDashboardSummary(_unitId?: string): Promise<DashboardSummary> {
    await mockDelay();
    return DEMO_DASHBOARD_SUMMARY;
  },

  async getSupplyOverview(_unitId?: string): Promise<SupplyClassSummary[]> {
    await mockDelay();
    return DEMO_DASHBOARD_SUMMARY.supplyStatus;
  },

  async getReadinessOverview(_unitId?: string): Promise<ReadinessSummary> {
    await mockDelay();
    return DEMO_DASHBOARD_SUMMARY.equipmentReadiness;
  },

  async getSustainability(
    _unitId?: string,
  ): Promise<SustainabilityProjection[]> {
    await mockDelay();
    return DEMO_SUSTAINABILITY;
  },

  async getDashboardAlerts(_unitId?: string): Promise<Alert[]> {
    await mockDelay();
    return demoAlerts.filter((a) => !a.acknowledged).slice(0, 5);
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
  ): Promise<ConsumptionDataPoint[]> {
    await mockDelay();
    // Return Class I trends as default
    return DEMO_CONSUMPTION_TRENDS['I'] || [];
  },

  async getSupplyTrends(_unitId: string): Promise<ConsumptionDataPoint[]> {
    await mockDelay();
    return DEMO_CONSUMPTION_TRENDS['III'] || [];
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
  ): Promise<ConsumptionDataPoint[]> {
    await mockDelay();
    return DEMO_READINESS_TRENDS;
  },

  // -------------------------------------------------------------------------
  // Transportation / Movements
  // -------------------------------------------------------------------------

  async getMovements(
    _filters?: Record<string, unknown>,
  ): Promise<Movement[]> {
    await mockDelay();
    return DEMO_MOVEMENTS;
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
    let reports = [...DEMO_REPORTS];

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
    const report = DEMO_REPORTS.find((r) => r.id === id) || DEMO_REPORTS[0];
    return {
      ...report,
      status: 'FINALIZED' as ReportStatus,
      finalizedAt: new Date().toISOString(),
      finalizedBy: 'Demo User',
    };
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

  async getUnits() {
    await mockDelay();
    return DEMO_UNITS;
  },
};
