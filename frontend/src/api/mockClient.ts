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
  EquipmentItem,
  MaintenanceWorkOrder,
  MaintenancePart,
  MaintenanceLabor,
  EquipmentFault,
  EquipmentDriverAssignment,
  Movement,
  Alert,
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
} from '@/lib/types';

import {
  ReportType,
  WorkOrderStatus,
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
let demoWorkOrders = [...DEMO_WORK_ORDERS];
let demoIndividualEquipment = [...DEMO_INDIVIDUAL_EQUIPMENT];
let demoFaults = [...DEMO_EQUIPMENT_FAULTS];
let demoDriverAssignments = [...DEMO_DRIVER_ASSIGNMENTS];

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
    if (filters?.unitId) results = results.filter(p => p.unitId === filters.unitId);
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
    if (filters?.unitId) items = items.filter((i) => i.unitId === filters.unitId);
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
    if (filters?.unitId) orders = orders.filter((o) => o.unitId === filters.unitId);
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
