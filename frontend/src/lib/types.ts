// Enums

export enum Role {
  ADMIN = 'ADMIN',
  COMMANDER = 'COMMANDER',
  S4 = 'S4',
  S3 = 'S3',
  S1 = 'S1',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER',
}

export enum Echelon {
  MEF = 'MEF',
  DIVISION = 'DIVISION',
  REGIMENT = 'REGIMENT',
  BATTALION = 'BATTALION',
  COMPANY = 'COMPANY',
  PLATOON = 'PLATOON',
  SQUAD = 'SQUAD',
  FIRE_TEAM = 'FIRE_TEAM',
  INDIVIDUAL = 'INDIVIDUAL',
  CUSTOM = 'CUSTOM',
}

export enum SupplyClass {
  I = 'I',
  II = 'II',
  III = 'III',
  IIIA = 'IIIA',
  IV = 'IV',
  V = 'V',
  VI = 'VI',
  VII = 'VII',
  VIII = 'VIII',
  IX = 'IX',
  X = 'X',
}

export enum SupplyStatus {
  GREEN = 'GREEN',
  AMBER = 'AMBER',
  RED = 'RED',
  BLACK = 'BLACK',
}

export enum MovementStatus {
  PLANNED = 'PLANNED',
  EN_ROUTE = 'EN_ROUTE',
  DELAYED = 'DELAYED',
  ARRIVED = 'ARRIVED',
  CANCELLED = 'CANCELLED',
}

export enum AlertType {
  SUPPLY_LOW = 'SUPPLY_LOW',
  SUPPLY_CRITICAL = 'SUPPLY_CRITICAL',
  EQUIPMENT_DOWN = 'EQUIPMENT_DOWN',
  READINESS_DROP = 'READINESS_DROP',
  MOVEMENT_DELAYED = 'MOVEMENT_DELAYED',
  INGESTION_ERROR = 'INGESTION_ERROR',
  SYSTEM = 'SYSTEM',
}

export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export enum ReportType {
  LOGSTAT = 'LOGSTAT',
  READINESS = 'READINESS',
  SUPPLY_STATUS = 'SUPPLY_STATUS',
  EQUIPMENT_STATUS = 'EQUIPMENT_STATUS',
  MAINTENANCE_SUMMARY = 'MAINTENANCE_SUMMARY',
  MOVEMENT_SUMMARY = 'MOVEMENT_SUMMARY',
  PERSONNEL_STRENGTH = 'PERSONNEL_STRENGTH',
  CUSTOM = 'CUSTOM',
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  READY = 'READY',
  FINALIZED = 'FINALIZED',
  ERROR = 'ERROR',
}

// Interfaces

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: Role | string;
  unit_id: number | null;
  email: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface Unit {
  id: string;
  name: string;
  echelon: Echelon;
  parentId?: string;
  uic: string;
  abbreviation?: string;
  customEchelonName?: string;
  children?: Unit[];
}

export interface SupplyRecord {
  id: string;
  unitId: string;
  unitName: string;
  supplyClass: SupplyClass;
  item: string;
  niin?: string;
  onHand: number;
  authorized: number;
  required: number;
  dueIn: number;
  consumptionRate: number;
  dos: number;
  status: SupplyStatus;
  lastUpdated: string;
}

export interface EquipmentRecord {
  id: string;
  unitId: string;
  unitName: string;
  type: string;
  tamcn: string;
  authorized: number;
  onHand: number;
  missionCapable: number;
  notMissionCapable: number;
  readinessPercent: number;
  status: SupplyStatus;
  lastUpdated: string;
}

export interface CargoItem {
  supplyClass: SupplyClass;
  description: string;
  quantity: number;
  unit: string; // 'T', 'GAL', 'EA', 'CASES'
}

export interface VehicleAllocation {
  type: string;       // e.g. 'HMMWV M1151'
  tamcn: string;
  quantity: number;
  available: number;  // MC count at origin — for reference
}

export interface MovementManifest {
  cargo: CargoItem[];
  vehicles: VehicleAllocation[];
  personnelByRole: { role: string; count: number }[];
  totalWeightTons: number;
  totalVehicles: number;
  totalPersonnel: number;
  convoyManifest?: ConvoyManifest;
}

export interface Movement {
  id: string;
  name: string;
  originUnit: string;
  destinationUnit: string;
  status: MovementStatus;
  cargo: string;
  priority: string;
  departureTime?: string;
  arrivalTime?: string;
  eta?: string;
  vehicles: number;
  personnel: number;
  notes?: string;
  routeWaypoints?: Array<{ lat: number; lon: number; label?: string }>;
  lastUpdated: string;
  manifest?: MovementManifest;
  originCoords?: { lat: number; lon: number };
  destinationCoords?: { lat: number; lon: number };
}

export interface DashboardSummary {
  unitId: string;
  unitName: string;
  overallReadiness: number;
  overallStatus: SupplyStatus;
  supplyStatus: SupplyClassSummary[];
  equipmentReadiness: ReadinessSummary;
  activeMovements: number;
  pendingRequisitions: number;
  criticalAlerts: number;
  warningAlerts: number;
  sustainabilityDays: number;
  lastUpdated: string;
}

export interface SupplyClassSummary {
  supplyClass: SupplyClass;
  name: string;
  percentage: number;
  dos: number;
  status: SupplyStatus;
  trend: 'UP' | 'DOWN' | 'STABLE';
  onHand: number;
  authorized: number;
}

export interface ReadinessSummary {
  overall: number;
  byType: EquipmentTypeSummary[];
  status: SupplyStatus;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface EquipmentTypeSummary {
  type: string;
  authorized: number;
  missionCapable: number;
  readinessPercent: number;
  status: SupplyStatus;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  unitId: string;
  unitName: string;
  title: string;
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  unitId: string;
  unitName: string;
  dateRange: { start: string; end: string };
  status: ReportStatus;
  content?: string;
  /** Parsed JSON content from report generation */
  parsedContent?: ReportContent;
  generatedBy: string;
  generatedAt: string;
  finalizedAt?: string;
  finalizedBy?: string;
}

/** Structured content sections returned by the report generator */
export interface ReportContent {
  report_type: string;
  unit?: { id: number; name: string; abbreviation: string; uic?: string };
  generated_at?: string;
  dtg?: string;
  as_of?: string;
  period_start?: string | null;
  period_end?: string | null;
  // LOGSTAT fields
  supply_status?: ReportSupplySection[];
  equipment_readiness?: {
    total_possessed: number;
    total_mission_capable: number;
    readiness_pct: number;
    status: string;
  };
  open_work_orders?: number;
  active_movements?: number;
  personnel_strength?: number;
  total_supply_items?: number;
  // READINESS fields
  overall_readiness_pct?: number;
  overall_status?: string;
  total_possessed?: number;
  total_mission_capable?: number;
  total_nmc?: number;
  equipment_types?: ReportEquipmentType[];
  equipment_type_count?: number;
  individual_status_breakdown?: Record<string, number>;
  deadlined_items?: ReportDeadlinedItem[];
  // SUPPLY_STATUS fields
  overall_health?: string;
  total_classes_tracked?: number;
  red_classes?: number;
  amber_classes?: number;
  class_summaries?: ReportClassSummary[];
  // EQUIPMENT_STATUS fields
  fleet_readiness?: {
    total_possessed: number;
    total_mission_capable: number;
    total_nmc_maintenance: number;
    total_nmc_supply: number;
    readiness_pct: number;
    status: string;
  };
  fleet_by_type?: ReportEquipmentType[];
  individual_total?: number;
  top_deadlined_items?: ReportDeadlinedItem[];
  // MAINTENANCE_SUMMARY fields
  work_order_counts?: Record<string, number>;
  total_work_orders?: number;
  avg_completion_time_hours?: number;
  total_labor_hours?: number;
  parts_on_order?: number;
  top_issues?: { equipment_type: string; open_work_orders: number }[];
  // MOVEMENT_SUMMARY fields
  status_counts?: Record<string, number>;
  total_movements?: number;
  total_vehicles_in_transit?: number;
  total_personnel_in_transit?: number;
  recent_completions?: {
    convoy_id: string | null;
    origin: string;
    destination: string;
    vehicle_count: number;
    arrival: string | null;
  }[];
  // PERSONNEL_STRENGTH fields
  total_assigned?: number;
  total_active?: number;
  status_breakdown?: Record<string, number>;
  rank_breakdown?: Record<string, number>;
  mos_breakdown?: Record<string, number>;
}

export interface ReportSupplySection {
  class: string;
  class_name: string;
  items: {
    item: string;
    on_hand: number;
    required: number;
    dos: number;
    consumption_rate: number;
    status: string;
  }[];
  overall_status?: string;
}

export interface ReportEquipmentType {
  tamcn: string;
  nomenclature: string;
  total_possessed: number;
  mission_capable: number;
  nmc_maintenance?: number;
  nmc_supply?: number;
  readiness_pct: number;
  status: string;
}

export interface ReportDeadlinedItem {
  bumper_number: string;
  nomenclature: string;
  tamcn: string;
  equipment_type: string;
  fault?: string;
  fault_severity?: string;
}

export interface ReportClassSummary {
  supply_class: string;
  class_name: string;
  total_on_hand: number;
  total_required: number;
  fill_rate_pct: number;
  avg_dos: number;
  avg_consumption_rate: number;
  item_count: number;
  red_items: number;
  amber_items: number;
  status: string;
  critical_items: {
    item: string;
    on_hand: number;
    required: number;
    dos: number;
  }[];
}

export interface RawData {
  id: string;
  source: string;
  filename: string;
  rawContent: string;
  parsedRecords: number;
  confidence: number;
  status: 'PENDING' | 'PARSED' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
  uploadedBy: string;
  uploadedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  errors?: string[];
}

export interface ParsedRecord {
  id: string;
  rawDataId: string;
  originalText: string;
  parsedFields: Record<string, unknown>;
  confidence: number;
  status: 'PENDING' | 'APPROVED' | 'EDITED' | 'REJECTED';
  editedFields?: Record<string, unknown>;
}

export interface ConsumptionDataPoint {
  date: string;
  rate: number;
  projected?: number;
}

export interface SustainabilityProjection {
  supplyClass: SupplyClass;
  name: string;
  currentDOS: number;
  projectedDOS: number;
  criticalThreshold: number;
  status: SupplyStatus;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SupplyFilters {
  unitId?: string;
  supplyClass?: SupplyClass;
  status?: SupplyStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface EquipmentFilters {
  unitId?: string;
  type?: string;
  status?: SupplyStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ReportFilters {
  unitId?: string;
  type?: ReportType;
  status?: ReportStatus;
  page?: number;
  pageSize?: number;
}

export interface GenerateReportParams {
  type: ReportType;
  unitId: string;
  dateRange: { start: string; end: string };
  title?: string;
}

// Export Destinations

export interface ExportDestination {
  id: number;
  name: string;
  url: string;
  auth_type: 'none' | 'bearer' | 'api_key' | 'basic';
  auth_value?: string | null;
  headers?: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
}

export interface ExportDestinationCreate {
  name: string;
  url: string;
  auth_type: 'none' | 'bearer' | 'api_key' | 'basic';
  auth_value?: string;
  headers?: Record<string, string>;
  is_active?: boolean;
}

export interface ExportDestinationUpdate {
  name?: string;
  url?: string;
  auth_type?: 'none' | 'bearer' | 'api_key' | 'basic';
  auth_value?: string;
  headers?: Record<string, string>;
  is_active?: boolean;
}

export interface ApiExportResultItem {
  destination_id: number;
  destination_name: string;
  success: boolean;
  status_code?: number | null;
  error?: string | null;
}

export interface ApiExportResponse {
  report_id: number;
  results: ApiExportResultItem[];
}

// Personnel tracking enums

export enum PersonnelStatus {
  ACTIVE = 'ACTIVE',
  DEPLOYED = 'DEPLOYED',
  TDY = 'TDY',
  LEAVE = 'LEAVE',
  MEDICAL = 'MEDICAL',
  INACTIVE = 'INACTIVE',
}

export enum ConvoyRole {
  DRIVER = 'DRIVER',
  A_DRIVER = 'A_DRIVER',
  GUNNER = 'GUNNER',
  TC = 'TC',
  VC = 'VC',
  MEDIC = 'MEDIC',
  PAX = 'PAX',
}

// Personnel tracking interfaces

export interface Weapon {
  id: string;
  personnelId: string;
  weaponType: string;
  serialNumber: string;
  optic?: string;
  accessories?: string[];
}

export interface AmmoLoad {
  id: string;
  personnelId: string;
  caliber: string;
  magazineCount: number;
  roundsPerMagazine: number;
  totalRounds: number;
}

export interface Personnel {
  id: string;
  edipi: string;
  firstName: string;
  lastName: string;
  rank?: string;
  unitId?: string;
  mos?: string;
  bloodType?: string;
  status: PersonnelStatus;
  weapons: Weapon[];
  ammoLoads: AmmoLoad[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PersonnelSummary {
  id: string;
  edipi: string;
  firstName: string;
  lastName: string;
  rank?: string;
  mos?: string;
  status: PersonnelStatus;
}

export interface ConvoyVehicle {
  id: string;
  movementId: string;
  vehicleType: string;
  tamcn?: string;
  bumperNumber?: string;
  callSign?: string;
  sequenceNumber?: number;
  assignedPersonnel: ConvoyPersonnelAssignment[];
}

export interface ConvoyPersonnelAssignment {
  id: string;
  movementId: string;
  personnelId: string;
  convoyVehicleId?: string;
  role: ConvoyRole;
  personnel: PersonnelSummary;
}

export interface ConvoyManifest {
  movementId: string;
  vehicles: ConvoyVehicle[];
  unassignedPersonnel: ConvoyPersonnelAssignment[];
  totalVehicles: number;
  totalPersonnel: number;
}

// Equipment & Maintenance enums

export enum EquipmentItemStatus {
  FMC = 'FMC',
  NMC_M = 'NMC_M',
  NMC_S = 'NMC_S',
  ADMIN = 'ADMIN',
  DEADLINED = 'DEADLINED',
}

export enum WorkOrderStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_PARTS = 'AWAITING_PARTS',
  COMPLETE = 'COMPLETE',
}

export enum WorkOrderPriority {
  URGENT = 1,
  PRIORITY = 2,
  ROUTINE = 3,
}

export enum WorkOrderCategory {
  CORRECTIVE = 'CORRECTIVE',
  PREVENTIVE = 'PREVENTIVE',
  MODIFICATION = 'MODIFICATION',
  INSPECTION = 'INSPECTION',
}

export enum FaultSeverity {
  SAFETY = 'SAFETY',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  COSMETIC = 'COSMETIC',
}

export enum PartSource {
  ON_HAND = 'ON_HAND',
  ON_ORDER = 'ON_ORDER',
  CANNIBALIZED = 'CANNIBALIZED',
  LOCAL_PURCHASE = 'LOCAL_PURCHASE',
}

export enum PartStatus {
  NEEDED = 'NEEDED',
  ON_ORDER = 'ON_ORDER',
  RECEIVED = 'RECEIVED',
  INSTALLED = 'INSTALLED',
}

export enum LaborType {
  INSPECT = 'INSPECT',
  DIAGNOSE = 'DIAGNOSE',
  REPAIR = 'REPAIR',
  REPLACE = 'REPLACE',
  TEST = 'TEST',
}

// Equipment & Maintenance interfaces

export interface EquipmentItem {
  id: string;
  unitId: string;
  unitName: string;
  equipmentType: string;
  tamcn: string;
  nomenclature: string;
  bumperNumber: string;
  serialNumber: string;
  usmcId: string;
  status: EquipmentItemStatus;
  odometerMiles?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceWorkOrder {
  id: string;
  unitId: string;
  equipmentId?: string;
  individualEquipmentId?: string;
  workOrderNumber: string;
  description?: string;
  status: WorkOrderStatus;
  category?: WorkOrderCategory;
  priority: number;
  partsRequired?: string;
  createdAt: string;
  completedAt?: string;
  estimatedCompletion?: string;
  actualHours?: number;
  location?: string;
  assignedTo?: string;
  parts: MaintenancePart[];
  laborEntries: MaintenanceLabor[];
}

export interface MaintenancePart {
  id: string;
  workOrderId: string;
  nsn?: string;
  partNumber: string;
  nomenclature: string;
  quantity: number;
  unitCost?: number;
  source: PartSource;
  status: PartStatus;
}

export interface MaintenanceLabor {
  id: string;
  workOrderId: string;
  personnelId: string;
  laborType: LaborType;
  hours: number;
  date: string;
  notes?: string;
}

export interface EquipmentFault {
  id: string;
  equipmentId: string;
  faultDescription: string;
  severity: FaultSeverity;
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  workOrderId?: string;
}

export interface EquipmentDriverAssignment {
  id: string;
  equipmentId: string;
  personnelId: string;
  personnelName?: string;
  assignedAt: string;
  releasedAt?: string;
  isPrimary: boolean;
}

export interface IndividualEquipmentFilters {
  unitId?: string;
  equipmentType?: string;
  status?: EquipmentItemStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface WorkOrderFilters {
  unitId?: string;
  equipmentId?: string;
  status?: WorkOrderStatus;
  priority?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

// Catalog types — equipment, supply, and ammunition master data

export interface EquipmentCatalogItem {
  id: number;
  tamcn: string | null;
  niin: string | null;
  nsn: string | null;
  nomenclature: string;
  commonName: string | null;
  category: string;
  subcategory: string | null;
  supplyClass: string;
  manufacturer: string | null;
  weightLbs: number | null;
  crewSize: number | null;
  paxCapacity: number | null;
  isSerialized: boolean;
  echelonTypical: string | null;
  notes: string | null;
}

export interface SupplyCatalogItem {
  id: number;
  nsn: string | null;
  niin: string | null;
  lin: string | null;
  dodic: string | null;
  nomenclature: string;
  commonName: string | null;
  supplyClass: string;
  supplySubclass: string | null;
  unitOfIssue: string;
  unitOfIssueDesc: string | null;
  category: string | null;
  subcategory: string | null;
  isControlled: boolean;
  isHazmat: boolean;
  shelfLifeDays: number | null;
  notes: string | null;
}

export interface AmmunitionCatalogItem {
  id: number;
  dodic: string;
  nsn: string | null;
  nomenclature: string;
  commonName: string | null;
  caliber: string | null;
  weaponSystem: string | null;
  unitOfIssue: string;
  roundsPerUnit: number | null;
  weightPerRoundLbs: number | null;
  isControlled: boolean;
  hazardClass: string | null;
  notes: string | null;
}

// Readiness types

export interface ReadinessSnapshot {
  id: number;
  unitId: number;
  snapshotDate: string;
  overallReadinessPct: number;
  equipmentReadinessPct: number | null;
  supplyReadinessPct: number | null;
  personnelFillPct: number | null;
  trainingReadinessPct: number | null;
  cRating: string;
  sRating: string;
  rRating: string;
  pRating: string;
  tRating: string;
  limitingFactor: string | null;
  notes: string | null;
  isOfficial: boolean;
  createdAt: string;
}

export interface UnitStrengthReport {
  id: number;
  unitId: number;
  reportedAt: string;
  authorizedOfficers: number;
  assignedOfficers: number;
  authorizedEnlisted: number;
  assignedEnlisted: number;
  attached: number;
  detached: number;
  tad: number;
  leave: number;
  medical: number;
  ua: number;
  totalAuthorized: number;
  totalAssigned: number;
  fillPct: number;
  mosShortfalls: Array<{
    mos: string;
    mosTitle: string;
    authorized: number;
    assigned: number;
    shortfall: number;
  }> | null;
  notes: string | null;
}

export interface ReadinessRollup {
  unitId: number;
  numSubordinates: number;
  avgOverallReadinessPct: number;
  avgEquipmentReadinessPct: number;
  avgSupplyReadinessPct: number;
  avgPersonnelFillPct: number;
  subordinates: Array<{
    unitId: number;
    unitName: string;
    cRating: string;
    overallReadinessPct: number;
    limitingFactor: string | null;
  }>;
}

// Maintenance expansion types

export type DeadlineReason = 'AWAITING_PARTS' | 'AWAITING_REPAIR' | 'UNSCHEDULED_MAINTENANCE' | 'SAFETY_ISSUE' | 'MODIFICATION_IN_PROGRESS' | 'PENDING_INSPECTION' | 'DEPOT_OVERHAUL';
export type PMType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'MILEAGE';
export type EROStatus = 'SUBMITTED' | 'RECEIVED_BY_IMA' | 'IN_REPAIR' | 'AWAITING_RETURN_SHIPMENT' | 'RETURNED' | 'REJECTED';
export type EchelonOfMaintenance = '1ST' | '2ND' | '3RD' | '4TH' | '5TH';
export type MaintenanceLevelType = 'ORGANIZATIONAL' | 'INTERMEDIATE' | 'DEPOT';

export interface MaintenanceDeadline {
  id: number;
  unitId: number;
  equipmentId: number;
  deadlineDate: string;
  reason: DeadlineReason;
  workOrderId: number | null;
  liftedDate: string | null;
  liftedBy: string | null;
  notes: string | null;
  // Display helpers from join
  bumperNumber?: string;
  nomenclature?: string;
  daysDeadlined?: number;
}

export interface PMScheduleItem {
  id: number;
  unitId: number;
  equipmentId: number;
  pmType: PMType;
  intervalValue: number;
  lastPerformed: string | null;
  nextDue: string | null;
  isOverdue: boolean;
  // Display helpers
  bumperNumber?: string;
  nomenclature?: string;
  daysOverdue?: number;
}

export interface EquipmentRepairOrder {
  id: number;
  unitId: number;
  equipmentId: number;
  eroNumber: string;
  submittedDate: string;
  status: EROStatus;
  intermediateMaintenanceActivity: string;
  estimatedReturnDate: string | null;
  actualReturnDate: string | null;
  workOrderId: number | null;
  repairDescription: string | null;
  daysInRepair: number;
  isReturned: boolean;
}

export interface MaintenanceAnalytics {
  deadlineRate: number;
  mttr: number;
  partsFillRate: number;
  cannibalizationRate: number;
  manHoursLast30d: number;
  overduePms: PMScheduleItem[];
  deadlineEquipment: MaintenanceDeadline[];
  topFaults: Array<{ faultDescription: string; equipmentType: string; count: number }>;
  weeklyTrend: Array<{ weekStart: string; totalHours: number; workOrderCount: number }>;
}

// --- Requisition & Supply Chain ---

export type RequisitionStatus =
  | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DENIED'
  | 'SOURCING' | 'BACKORDERED' | 'SHIPPED' | 'RECEIVED' | 'CANCELED';

export type RequisitionPriority = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12' | '13' | '14' | '15';

export type ApprovalAction = 'APPROVE' | 'DENY' | 'RETURN';

export type TransactionType = 'RECEIPT' | 'ISSUE' | 'TURN_IN' | 'ADJUSTMENT' | 'TRANSFER' | 'LOSS';

export interface RequisitionApprovalRecord {
  id: number;
  approver_id: number;
  approver_name?: string;
  action: ApprovalAction;
  comments: string | null;
  action_date: string;
}

export interface RequisitionStatusHistoryRecord {
  id: number;
  old_status: RequisitionStatus | null;
  new_status: RequisitionStatus;
  changed_by_id: number;
  changed_by_name?: string;
  changed_at: string;
  notes: string | null;
}

export interface Requisition {
  id: number;
  requisition_number: string;
  unit_id: number;
  requested_by_id: number;
  requested_by_name?: string;
  approved_by_id: number | null;
  supply_catalog_item_id: number | null;
  ammo_catalog_item_id: number | null;
  equipment_catalog_item_id: number | null;
  nsn: string | null;
  dodic: string | null;
  nomenclature: string;
  quantity_requested: number;
  quantity_approved: number | null;
  quantity_issued: number | null;
  unit_of_issue: string;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  justification: string | null;
  denial_reason: string | null;
  document_number: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  shipped_at: string | null;
  received_at: string | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  approvals?: RequisitionApprovalRecord[];
  status_history?: RequisitionStatusHistoryRecord[];
}

export interface InventoryRecord {
  id: number;
  unit_id: number;
  location: string;
  nsn: string | null;
  nomenclature: string;
  unit_of_issue: string;
  quantity_on_hand: number;
  quantity_on_order: number;
  quantity_due_out: number;
  reorder_point: number | null;
  reorder_quantity: number | null;
  lot_number: string | null;
  expiration_date: string | null;
  condition_code: string;
  last_inventory_date: string;
}

export interface InventoryTransaction {
  id: number;
  inventory_record_id: number;
  transaction_type: TransactionType;
  quantity: number;
  requisition_id: number | null;
  performed_by_id: number;
  transaction_date: string;
  document_number: string | null;
  notes: string | null;
}

export interface LowStockAlert {
  inventory_record_id: number;
  unit_id: number;
  location: string;
  nomenclature: string;
  quantity_on_hand: number;
  reorder_point: number;
  quantity_below: number;
  last_inventory_date: string;
}
