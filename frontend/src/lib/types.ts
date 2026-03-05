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
  LOW_DOS = 'LOW_DOS',
  LOW_READINESS = 'LOW_READINESS',
  CONVOY_DELAYED = 'CONVOY_DELAYED',
  ANOMALY = 'ANOMALY',
  SUPPLY_LOW = 'SUPPLY_LOW',
  SUPPLY_CRITICAL = 'SUPPLY_CRITICAL',
  EQUIPMENT_DOWN = 'EQUIPMENT_DOWN',
  READINESS_DROP = 'READINESS_DROP',
  MOVEMENT_DELAYED = 'MOVEMENT_DELAYED',
  INGESTION_ERROR = 'INGESTION_ERROR',
  SYSTEM = 'SYSTEM',
  EQUIPMENT_DEADLINED = 'EQUIPMENT_DEADLINED',
  PM_OVERDUE = 'PM_OVERDUE',
  PARTS_BACKORDERED = 'PARTS_BACKORDERED',
  CASUALTY_REPORTED = 'CASUALTY_REPORTED',
  BLOOD_PRODUCT_EXPIRING = 'BLOOD_PRODUCT_EXPIRING',
  REQUISITION_PENDING_APPROVAL = 'REQUISITION_PENDING_APPROVAL',
  REPORT_DUE = 'REPORT_DUE',
  STRENGTH_BELOW_THRESHOLD = 'STRENGTH_BELOW_THRESHOLD',
  EAS_APPROACHING = 'EAS_APPROACHING',
  SECURITY_CLEARANCE_EXPIRING = 'SECURITY_CLEARANCE_EXPIRING',
  FUEL_CRITICAL = 'FUEL_CRITICAL',
  AMMO_BELOW_RSR = 'AMMO_BELOW_RSR',
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
  SITREP = 'SITREP',
  SPOTREP = 'SPOTREP',
  PERSTAT = 'PERSTAT',
  INTSUM = 'INTSUM',
  COMMAND_BRIEF = 'COMMAND_BRIEF',
  AAR = 'AAR',
  CUSTOM = 'CUSTOM',
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  READY = 'READY',
  FINALIZED = 'FINALIZED',
  ERROR = 'ERROR',
  ARCHIVED = 'ARCHIVED',
}

export enum ReportFormat {
  TEXT = 'TEXT',
  HTML = 'HTML',
  PDF = 'PDF',
  JSON = 'JSON',
}

export enum ReportClassification {
  UNCLASS = 'UNCLASS',
  CUI = 'CUI',
  SECRET = 'SECRET',
  TS = 'TS',
  TS_SCI = 'TS_SCI',
}

export enum ScheduleFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

// Interfaces

export interface Permission {
  id: number;
  code: string;
  display_name: string;
  category: string;
  description?: string;
}

export interface CustomRole {
  id: number;
  name: string;
  description?: string;
  is_system: boolean;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: Role | string;
  unit_id: number | null;
  email: string;
  is_active: boolean;
  permissions?: string[];
  custom_role_id?: number;
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
  thresholdValue?: number;
  actualValue?: number;
  entityType?: string;
  entityId?: number;
  linkUrl?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  escalated: boolean;
  escalatedTo?: number;
  escalatedAt?: string;
  autoGenerated: boolean;
  createdAt: string;
  updatedAt?: string;
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

export interface ReportTemplate {
  id: number;
  name: string;
  report_type: string;
  description?: string;
  template_body: string;
  sections: string[];
  classification_default: string;
  is_default: boolean;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface ReportSchedule {
  id: number;
  template_id: number;
  unit_id: number;
  frequency: ScheduleFrequency;
  time_of_day?: string;
  day_of_week?: number;
  day_of_month?: number;
  is_active: boolean;
  last_generated?: string;
  next_generation?: string;
  auto_distribute: boolean;
  distribution_list?: Array<{ user_id: number; role: string }>;
  created_at?: string;
  updated_at?: string;
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
    echelonLabel?: string;
  }>;
}

// Readiness drill-down types

export interface EquipmentDetailItem {
  tamcn: string;
  nomenclature: string;
  totalPossessed: number;
  missionCapable: number;
  nmcM: number;
  nmcS: number;
  readinessPct: number;
}

export interface EquipmentDetailResponse {
  unitId: number;
  snapshotDate: string;
  overallReadinessPct: number;
  rRating: string;
  equipmentItems: EquipmentDetailItem[];
  summaryByCategory: Record<string, number> | null;
}

export interface SupplyDetailItem {
  supplyClass: string;
  description: string;
  onHand: number;
  required: number;
  dos: number;
  status: string;
}

export interface SupplyDetailResponse {
  unitId: number;
  snapshotDate: string;
  overallReadinessPct: number;
  sRating: string;
  supplyItems: SupplyDetailItem[];
  dosByClass: Record<string, number> | null;
}

export interface MOSShortfall {
  mos: string;
  mosTitle: string;
  authorized: number;
  assigned: number;
  shortfall: number;
}

export interface PersonnelDetailResponse {
  unitId: number;
  snapshotDate: string;
  overallReadinessPct: number;
  pRating: string;
  authorizedTotal: number;
  assignedTotal: number;
  fillRatePct: number;
  mosShortfalls: MOSShortfall[];
  keyBilletVacancies: Record<string, any>[] | null;
}

export interface TrainingDetailResponse {
  unitId: number;
  snapshotDate: string;
  overallReadinessPct: number;
  tRating: string;
  qualificationCurrencyRates: Record<string, number> | null;
  upcomingExpirations: Record<string, any>[] | null;
  combatReadinessStats: Record<string, number> | null;
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

// --- Personnel & Manning ---
export type PayGrade = 'E1'|'E2'|'E3'|'E4'|'E5'|'E6'|'E7'|'E8'|'E9'|'W1'|'W2'|'W3'|'W4'|'W5'|'O1'|'O2'|'O3'|'O4'|'O5'|'O6'|'O7'|'O8'|'O9'|'O10';
export type RifleQual = 'EXPERT'|'SHARPSHOOTER'|'MARKSMAN'|'UNQUAL';
export type SwimQual = 'CWS1'|'CWS2'|'CWS3'|'CWS4'|'UNQUAL';
export type SecurityClearanceLevel = 'NONE'|'CONFIDENTIAL'|'SECRET'|'TOP_SECRET'|'TS_SCI';
export type DutyStatusType = 'PRESENT'|'UA'|'DESERTER'|'AWOL'|'CONFINEMENT'|'LIMDU'|'PTAD';

export interface PersonnelRecord {
  id: number; edipi: string; first_name: string; last_name: string;
  rank: string | null; unit_id: number | null; mos: string | null;
  pay_grade: PayGrade | null; billet: string | null;
  date_of_rank: string | null; eaos: string | null; pme_complete: boolean;
  rifle_qual: RifleQual | null; rifle_qual_date: string | null;
  pft_score: number | null; pft_date: string | null;
  cft_score: number | null; cft_date: string | null;
  swim_qual: SwimQual | null; security_clearance: SecurityClearanceLevel | null;
  clearance_expiry: string | null; drivers_license_military: boolean;
  duty_status: DutyStatusType; status: string;
}

export interface BilletRecord {
  id: number; unit_id: number; billet_id_code: string; billet_title: string;
  mos_required: string | null; rank_required: string | null;
  is_key_billet: boolean; is_filled: boolean;
  filled_by_id: number | null; filled_by_name?: string; filled_date: string | null;
}

export interface ManningSnapshotRecord {
  id: number; unit_id: number; snapshot_date: string;
  authorized_total: number; assigned_total: number; present_for_duty: number;
  fill_rate_pct: number; mos_shortfalls: Record<string, number> | null;
  rank_distribution: Record<string, number> | null;
}

export interface QualificationRecord {
  id: number; personnel_id: number; qualification_type: string;
  qualification_name: string; date_achieved: string;
  expiration_date: string | null; is_current: boolean;
}

export interface UnitStrengthData {
  total_authorized: number; total_assigned: number; present_for_duty: number;
  deployed: number; tdy: number; leave: number; medical: number;
  inactive: number; fill_rate_pct: number;
}

export interface MOSFillData { required: number; assigned: number; shortfall: number; }

export interface QualStatusData { total: number; current: number; percent: number; }

export interface PersonnelReadinessData {
  p_rating: string; percent_ready: number;
  fill_rate_pct: number; qualification_pct: number; fitness_pct: number;
}

export interface EASRecord {
  id: number; edipi: string; first_name: string; last_name: string;
  rank: string; mos: string; pay_grade: string | null; billet: string | null;
  eaos: string; days_until_eas: number;
}

// --- Transportation & Movement Expansion ---
export type ConvoyPlanStatus = 'DRAFT' | 'APPROVED' | 'EXECUTING' | 'COMPLETE' | 'CANCELED';
export type RiskAssessmentLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type LiftRequestPriority = 'ROUTINE' | 'PRIORITY' | 'EMERGENCY';
export type LiftRequestStatus = 'REQUESTED' | 'APPROVED' | 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELED';
export type CargoType = 'PERSONNEL' | 'EQUIPMENT' | 'SUPPLY' | 'MIXED';

export interface ConvoySerial {
  id: number;
  convoy_plan_id: number;
  serial_number: string;
  serial_commander_id: number | null;
  serial_commander_name?: string;
  vehicle_count: number;
  pax_count: number;
  march_order: number;
  march_speed_kph: number;
  catch_up_speed_kph: number;
  interval_meters: number;
  created_at: string;
}

export interface ConvoyPlan {
  id: number;
  name: string;
  unit_id: number;
  created_by: number;
  status: ConvoyPlanStatus;
  route_name: string | null;
  route_description: string | null;
  total_distance_km: number | null;
  estimated_duration_hours: number | null;
  route_primary: string | null;
  route_alternate: string | null;
  departure_time_planned: string | null;
  sp_time: string | null;
  rp_time: string | null;
  brief_time: string | null;
  rehearsal_time: string | null;
  movement_credit_number: string | null;
  convoy_commander_id: number | null;
  risk_assessment_level: RiskAssessmentLevel | null;
  comm_plan: string | null;
  recovery_plan: string | null;
  medevac_plan: string | null;
  created_at: string;
  updated_at: string;
  serials: ConvoySerial[];
}

export interface MarchTableData {
  sp_time: string;
  rp_time: string;
  checkpoints: Array<{
    name: string;
    distance_km: number;
    cumulative_distance_km: number;
    time: string;
    speed_kph: number;
  }>;
  total_distance_km: number;
  total_duration_hours: number;
  march_speed_kph: number;
  catch_up_speed_kph: number;
  fuel_estimate?: {
    total_gallons: number;
    total_liters: number;
    per_vehicle_gallons: number;
  };
}

export interface LiftRequest {
  id: number;
  requesting_unit_id: number;
  requesting_unit_name?: string;
  supporting_unit_id: number | null;
  supporting_unit_name?: string;
  cargo_type: CargoType;
  cargo_description: string;
  weight_lbs: number | null;
  cube_ft: number | null;
  pax_count: number;
  hazmat: boolean;
  priority: LiftRequestPriority;
  required_delivery_date: string;
  status: LiftRequestStatus;
  pickup_location: string;
  pickup_lat: number | null;
  pickup_lon: number | null;
  delivery_location: string;
  delivery_lat: number | null;
  delivery_lon: number | null;
  assigned_movement_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface MovementHistoryRecord {
  id: number;
  convoy_id: string | null;
  origin: string;
  destination: string;
  departure_time: string | null;
  eta: string | null;
  actual_arrival: string | null;
  vehicle_count: number;
  cargo_description: string | null;
  status: string;
  on_time: boolean;
  duration_hours: number | null;
  average_speed_kph: number | null;
  convoy_plan_name?: string;
}

// Medical / CASEVAC
export enum CASEVACPrecedence {
  URGENT_SURGICAL = 'URGENT_SURGICAL',
  URGENT = 'URGENT',
  PRIORITY = 'PRIORITY',
  ROUTINE = 'ROUTINE',
  CONVENIENCE = 'CONVENIENCE',
}

export enum TriageCategory {
  IMMEDIATE = 'IMMEDIATE',
  DELAYED = 'DELAYED',
  MINIMAL = 'MINIMAL',
  EXPECTANT = 'EXPECTANT',
}

export enum CasualtyReportStatus {
  REPORTED = 'REPORTED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  DISPATCHED = 'DISPATCHED',
  EVACUATING = 'EVACUATING',
  AT_MTF = 'AT_MTF',
  CLOSED = 'CLOSED',
}

export enum EvacuationStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  AT_FACILITY = 'AT_FACILITY',
  TREATED = 'TREATED',
  RTD = 'RTD',
}

export enum MTFType {
  BAS = 'BAS',
  STP = 'STP',
  FRSS = 'FRSS',
  ROLE2 = 'ROLE2',
  ROLE2E = 'ROLE2E',
  ROLE3 = 'ROLE3',
  ROLE4 = 'ROLE4',
}

export enum MTFStatus {
  OPERATIONAL = 'OPERATIONAL',
  DEGRADED = 'DEGRADED',
  NON_OPERATIONAL = 'NON_OPERATIONAL',
}

export enum BloodProductType {
  WHOLE_BLOOD = 'WHOLE_BLOOD',
  PRBC = 'PRBC',
  FFP = 'FFP',
  PLATELETS = 'PLATELETS',
  CRYO = 'CRYO',
  ALBUMIN = 'ALBUMIN',
}

export enum BloodTypeEnum {
  O_NEG = 'O_NEG',
  O_POS = 'O_POS',
  A_NEG = 'A_NEG',
  A_POS = 'A_POS',
  B_NEG = 'B_NEG',
  B_POS = 'B_POS',
  AB_NEG = 'AB_NEG',
  AB_POS = 'AB_POS',
}

export interface CasualtyReport {
  id: number;
  casualty_id: string;
  unit_id: number;
  personnel_id: number | null;
  incident_datetime: string;
  reported_datetime: string;
  location_lat: number;
  location_lon: number;
  location_mgrs: string | null;
  location_description: string | null;
  precedence: CASEVACPrecedence;
  number_of_patients: number;
  special_equipment_required: string;
  security_at_pickup: string;
  patient_type: string;
  marking_method: string;
  nationality_status: string;
  nbc_contamination: boolean;
  mechanism_of_injury: string | null;
  injuries_description: string | null;
  triage_category: TriageCategory | null;
  tccc_interventions: Record<string, unknown> | null;
  status: CasualtyReportStatus;
  transport_method: string | null;
  evacuation_status: EvacuationStatus | null;
  receiving_facility_id: number | null;
  pickup_time: string | null;
  arrival_at_facility_time: string | null;
  remarks: string | null;
  logs: CasualtyLog[];
  created_at: string;
  updated_at: string;
}

export interface CasualtyLog {
  id: number;
  casualty_report_id: number;
  event_type: string;
  event_time: string;
  notes: string | null;
}

export interface MedicalFacility {
  id: number;
  name: string;
  facility_type: MTFType;
  callsign: string | null;
  unit_id: number | null;
  location_lat: number;
  location_lon: number;
  location_mgrs: string | null;
  capacity: number;
  current_census: number;
  status: MTFStatus;
  surgical_capability: boolean;
  blood_bank: boolean;
  vent_capacity: number;
  contact_freq: string | null;
  physician_staffing: number;
  pa_staffing: number;
  medic_staffing: number;
  surgical_tech_staffing: number;
}

export interface BloodProductRecord {
  id: number;
  facility_id: number;
  product_type: BloodProductType;
  blood_type: BloodTypeEnum;
  units_on_hand: number;
  units_used_24h: number;
  expiration_date: string | null;
  walking_blood_bank_donors: number;
}

export interface MedicalBurnRate {
  id: number;
  unit_id: number;
  supply_catalog_item_id: number;
  supply_name: string;
  period_start: string;
  period_end: string;
  quantity_used: number;
  quantity_on_hand: number;
  days_of_supply: number | null;
  burn_rate_per_day: number;
  projected_exhaustion_date: string | null;
}

export interface PERSTATMedical {
  unit_id: number;
  total_strength: number;
  effective_strength: number;
  medical_holds: number;
  active_casualties: number;
  triage_breakdown: Record<string, number>;
  tccc_cert_rate_pct: number;
  blood_type_distribution: Record<string, number>;
  timestamp: string;
}

// --- Notifications & Alert Rules ---

export type RuleOperator = 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ' | 'NEQ';
export type NotificationChannelType = 'IN_APP' | 'EMAIL' | 'BOTH' | 'NONE';

export interface AlertRule {
  id: number;
  name: string;
  description?: string;
  alert_type: string;
  severity: string;
  metric: string;
  operator: RuleOperator;
  threshold_value: number;
  is_scope_all: boolean;
  scope_unit_id?: number;
  cooldown_minutes: number;
  last_fired_at?: string;
  is_active: boolean;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  // Advanced fields
  scope_type?: string;
  scope_echelon?: string;
  include_subordinates?: boolean;
  metric_type?: string;
  metric_item_filter?: Record<string, any>;
  notify_roles?: string[];
  check_interval_minutes?: number;
  auto_recommend?: boolean;
  recommend_type?: string;
  recommend_source_unit_id?: number;
  recommend_assign_to_role?: string;
}

export interface LogisticsRecommendation {
  id: number;
  recommendation_type: string;
  triggered_by_rule_id?: number;
  triggered_by_metric?: string;
  target_unit_id: number;
  description: string;
  recommended_items?: any[];
  recommended_source?: string;
  recommended_vehicles?: any[];
  recommended_personnel?: any[];
  recommended_route?: string;
  estimated_weight?: number;
  estimated_cost?: number;
  estimated_duration?: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXECUTED' | 'EXPIRED';
  assigned_to_user_id?: number;
  assigned_to_role?: string;
  generated_movement_id?: number;
  generated_requisition_id?: number;
  created_at?: string;
  decided_at?: string;
  decided_by?: number;
  notes?: string;
  expires_at?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  alert_id?: number;
  title: string;
  body: string;
  link_url?: string;
  channel: NotificationChannelType;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationPreference {
  id: number;
  user_id: number;
  alert_type: string;
  channel: NotificationChannelType;
  min_severity: string;
}

export interface AlertSummary {
  total_active: number;
  by_severity: { CRITICAL: number; WARNING: number; INFO: number };
  by_type: Record<string, number>;
}

// --- Fuel / POL Management ---

export type FuelFacilityType = 'FARP' | 'FSP' | 'BSA_FUEL_POINT' | 'MOBILE_REFUELER' | 'BLADDER_FARM' | 'TANK_FARM' | 'DISTRIBUTED_CACHE';
export type FuelType = 'JP8' | 'JP5' | 'DF2' | 'MOGAS' | 'OIL_ENGINE' | 'HYDRAULIC_FLUID' | 'COOLANT' | 'MIXED';
export type FuelStorageStatus = 'OPERATIONAL' | 'DEGRADED' | 'NON_OPERATIONAL' | 'DRY';
export type FuelTransactionType = 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'LOSS' | 'SAMPLE';
export type OperationalTempo = 'LOW' | 'MEDIUM' | 'HIGH' | 'SURGE';
export type ConsumptionSourceType = 'MANUAL' | 'CALCULATED' | 'TM_REFERENCE';

export interface FuelStoragePoint {
  id: number;
  unit_id: number;
  name: string;
  facility_type: FuelFacilityType;
  fuel_type: FuelType;
  capacity_gallons: number;
  current_gallons: number;
  fill_percentage: number;
  status: FuelStorageStatus;
  latitude: number | null;
  longitude: number | null;
  mgrs: string | null;
  location_description: string | null;
  last_resupply_date: string | null;
  next_resupply_eta: string | null;
  equipment_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface FuelTransaction {
  id: number;
  storage_point_id: number;
  storage_point_name?: string;
  transaction_type: FuelTransactionType;
  fuel_type: FuelType;
  quantity_gallons: number;
  receiving_unit_id: number | null;
  vehicle_bumper_number: string | null;
  vehicle_type: string | null;
  document_number: string | null;
  meter_reading_before: number | null;
  meter_reading_after: number | null;
  notes: string | null;
  performed_by_name?: string;
  transaction_date: string;
  created_at: string;
}

export interface FuelConsumptionRate {
  id: number;
  equipment_catalog_item_id: number;
  equipment_name?: string;
  fuel_type: FuelType;
  gallons_per_hour_idle: number;
  gallons_per_hour_tactical: number;
  gallons_per_mile: number | null;
  gallons_per_flight_hour: number | null;
  source: ConsumptionSourceType;
  notes: string | null;
  updated_at: string;
}

export interface FuelForecast {
  unit_id: number;
  forecast_date: string;
  operational_tempo: OperationalTempo;
  projected_daily_consumption_gallons: number;
  current_on_hand_gallons: number;
  days_of_supply: number;
  resupply_required_by_date: string;
  alert: boolean;
}

export interface FuelDashboard {
  unit_id: number;
  storage_points: FuelStoragePoint[];
  total_capacity_gallons: number;
  total_on_hand_gallons: number;
  fill_percentage: number;
  days_of_supply: number;
  limiting_fuel_type: string | null;
  alert: boolean;
  forecast: {
    operational_tempo: OperationalTempo;
    projected_daily_consumption: number;
    days_of_supply: number;
    resupply_required_by: string;
  };
}

// ---------------------------------------------------------------------------
// Custody & Chain of Custody
// ---------------------------------------------------------------------------

export type SensitiveItemType = 'WEAPON' | 'OPTIC' | 'NVG' | 'CRYPTO' | 'RADIO' | 'COMSEC' | 'CLASSIFIED_DOCUMENT' | 'EXPLOSIVE' | 'MISSILE' | 'OTHER';
export type SecurityClassification = 'UNCLASSIFIED' | 'CUI' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'TS_SCI';
export type ItemConditionCode = 'A' | 'B' | 'C' | 'D' | 'F' | 'H';
export type SensitiveItemStatus = 'ON_HAND' | 'ISSUED' | 'IN_TRANSIT' | 'IN_MAINTENANCE' | 'MISSING' | 'LOST' | 'DESTROYED' | 'TRANSFERRED';
export type TransferType = 'ISSUE' | 'TURN_IN' | 'LATERAL_TRANSFER' | 'TEMPORARY_LOAN' | 'MAINTENANCE_TURN_IN' | 'MAINTENANCE_RETURN' | 'INVENTORY_ADJUSTMENT';
export type InventoryEventType = 'CYCLIC' | 'SENSITIVE_ITEM' | 'CHANGE_OF_COMMAND' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'DIRECTED' | 'LOSS_INVESTIGATION';
export type InventoryEventStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type DiscrepancyType = 'NONE' | 'NOT_FOUND' | 'WRONG_LOCATION' | 'WRONG_HOLDER' | 'CONDITION_CHANGED' | 'SERIAL_MISMATCH';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'TRANSFER' | 'STATUS_CHANGE' | 'INVENTORY_START' | 'INVENTORY_COMPLETE' | 'ITEM_VERIFIED' | 'LOGIN' | 'LOGOUT' | 'PERMISSION_CHANGE' | 'EXPORT';
export type AuditEntityType = 'SENSITIVE_ITEM' | 'CUSTODY_TRANSFER' | 'INVENTORY_EVENT' | 'USER' | 'UNIT' | 'PERSONNEL' | 'REPORT' | 'SYSTEM';

export interface SensitiveItem {
  id: number;
  serial_number: string;
  item_type: SensitiveItemType;
  nomenclature: string;
  nsn: string | null;
  tamcn: string | null;
  security_classification: SecurityClassification;
  owning_unit_id: number;
  current_holder_id: number | null;
  current_holder_name: string | null;
  hand_receipt_number: string | null;
  sub_hand_receipt_number: string | null;
  condition_code: ItemConditionCode;
  status: SensitiveItemStatus;
  last_inventory_date: string | null;
  last_transfer_date: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

export interface CustodyTransfer {
  id: number;
  sensitive_item_id: number;
  from_personnel_id: number | null;
  from_personnel_name: string | null;
  to_personnel_id: number | null;
  to_personnel_name: string | null;
  from_unit_id: number | null;
  to_unit_id: number | null;
  transfer_type: TransferType;
  transfer_date: string;
  document_number: string | null;
  authorized_by: number | null;
  witnessed_by: number | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface InventoryEvent {
  id: number;
  unit_id: number;
  inventory_type: InventoryEventType;
  conducted_by: number;
  conducted_by_name: string | null;
  witnessed_by: number | null;
  started_at: string;
  completed_at: string | null;
  total_items_expected: number;
  total_items_verified: number;
  discrepancies: number;
  status: InventoryEventStatus;
  approved_by: number | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface InventoryLineItem {
  id: number;
  inventory_event_id: number;
  sensitive_item_id: number;
  verified: boolean;
  serial_number_verified: boolean;
  condition_code: ItemConditionCode | null;
  discrepancy_type: DiscrepancyType | null;
  notes: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  user_id: number;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: number | null;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface HandReceipt {
  personnel_id: number;
  personnel_name: string;
  rank: string;
  edipi: string;
  unit_name: string;
  total_items: number;
  items: SensitiveItem[];
  generated_at: string;
}

// Transportation manifest types
export interface LocationInventoryItem {
  item_id: string;
  item_type: 'equipment' | 'supply' | 'personnel';
  nomenclature: string;
  tamcn?: string;
  nsn?: string;
  category: string;
  available_qty: number;
  weight_lbs?: number;
  status: string;
}

export interface ManifestEntry {
  item_id: string;
  nomenclature: string;
  category: string;
  quantity: number;
  priority: 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'FLASH';
  special_handling?: string;
  weight_lbs?: number;
  added_at: string;
}
