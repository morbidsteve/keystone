// Enums

export enum Role {
  ADMIN = 'ADMIN',
  COMMANDER = 'COMMANDER',
  S4 = 'S4',
  S3 = 'S3',
  S1 = 'S1',
  OPERATOR = 'OPERATOR',
  ARMORER = 'ARMORER',
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
  displayName: string;
  category: string;
  description?: string;
}

export interface CustomRole {
  id: number;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
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
  demo_profile?: {
    rank: string;
    billet: string;
    edipi: string;
    mos: string;
    description: string;
  };
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
  reportType: string;
  unit?: { id: number; name: string; abbreviation: string; uic?: string };
  generatedAt?: string;
  dtg?: string;
  asOf?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  // LOGSTAT fields
  supplyStatus?: ReportSupplySection[];
  equipmentReadiness?: {
    totalPossessed: number;
    totalMissionCapable: number;
    readinessPct: number;
    status: string;
  };
  openWorkOrders?: number;
  activeMovements?: number;
  personnelStrength?: number;
  totalSupplyItems?: number;
  // READINESS fields
  overallReadinessPct?: number;
  overallStatus?: string;
  totalPossessed?: number;
  totalMissionCapable?: number;
  totalNmc?: number;
  equipmentTypes?: ReportEquipmentType[];
  equipmentTypeCount?: number;
  individualStatusBreakdown?: Record<string, number>;
  deadlinedItems?: ReportDeadlinedItem[];
  // SUPPLY_STATUS fields
  overallHealth?: string;
  totalClassesTracked?: number;
  redClasses?: number;
  amberClasses?: number;
  classSummaries?: ReportClassSummary[];
  // EQUIPMENT_STATUS fields
  fleetReadiness?: {
    totalPossessed: number;
    totalMissionCapable: number;
    totalNmcMaintenance: number;
    totalNmcSupply: number;
    readinessPct: number;
    status: string;
  };
  fleetByType?: ReportEquipmentType[];
  individualTotal?: number;
  topDeadlinedItems?: ReportDeadlinedItem[];
  // MAINTENANCE_SUMMARY fields
  workOrderCounts?: Record<string, number>;
  totalWorkOrders?: number;
  avgCompletionTimeHours?: number;
  totalLaborHours?: number;
  partsOnOrder?: number;
  topIssues?: { equipmentType: string; openWorkOrders: number }[];
  // MOVEMENT_SUMMARY fields
  statusCounts?: Record<string, number>;
  totalMovements?: number;
  totalVehiclesInTransit?: number;
  totalPersonnelInTransit?: number;
  recentCompletions?: {
    convoyId: string | null;
    origin: string;
    destination: string;
    vehicleCount: number;
    arrival: string | null;
  }[];
  // PERSONNEL_STRENGTH fields
  totalAssigned?: number;
  totalActive?: number;
  statusBreakdown?: Record<string, number>;
  rankBreakdown?: Record<string, number>;
  mosBreakdown?: Record<string, number>;
}

export interface ReportSupplySection {
  class: string;
  className: string;
  items: {
    item: string;
    onHand: number;
    required: number;
    dos: number;
    consumptionRate: number;
    status: string;
  }[];
  overallStatus?: string;
}

export interface ReportEquipmentType {
  tamcn: string;
  nomenclature: string;
  totalPossessed: number;
  missionCapable: number;
  nmcMaintenance?: number;
  nmcSupply?: number;
  readinessPct: number;
  status: string;
}

export interface ReportDeadlinedItem {
  bumperNumber: string;
  nomenclature: string;
  tamcn: string;
  equipmentType: string;
  fault?: string;
  faultSeverity?: string;
}

export interface ReportClassSummary {
  supplyClass: string;
  className: string;
  totalOnHand: number;
  totalRequired: number;
  fillRatePct: number;
  avgDos: number;
  avgConsumptionRate: number;
  itemCount: number;
  redItems: number;
  amberItems: number;
  status: string;
  criticalItems: {
    item: string;
    onHand: number;
    required: number;
    dos: number;
  }[];
}

export interface ReportTemplate {
  id: number;
  name: string;
  reportType: string;
  description?: string;
  templateBody: string;
  sections: string[];
  classificationDefault: string;
  isDefault: boolean;
  createdBy: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportSchedule {
  id: number;
  templateId: number;
  unitId: number;
  frequency: ScheduleFrequency;
  timeOfDay?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  isActive: boolean;
  lastGenerated?: string;
  nextGeneration?: string;
  autoDistribute: boolean;
  distributionList?: Array<{ userId: number; role: string }>;
  createdAt?: string;
  updatedAt?: string;
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
  authType: 'none' | 'bearer' | 'api_key' | 'basic';
  authValue?: string | null;
  headers?: Record<string, string> | null;
  isActive: boolean;
  createdAt: string;
}

// NOTE: Create/Update types are request payloads — backend expects snake_case.
export interface ExportDestinationCreate {
  name: string;
  url: string;
  auth_type: 'none' | 'bearer' | 'api_key' | 'basic';
  auth_value?: string;
  headers?: Record<string, string>;
  isActive?: boolean;
}

export interface ExportDestinationUpdate {
  name?: string;
  url?: string;
  auth_type?: 'none' | 'bearer' | 'api_key' | 'basic';
  auth_value?: string;
  headers?: Record<string, string>;
  isActive?: boolean;
}

export interface ApiExportResultItem {
  destinationId: number;
  destinationName: string;
  success: boolean;
  statusCode?: number | null;
  error?: string | null;
}

export interface ApiExportResponse {
  reportId: number;
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
  approverId: number;
  approverName?: string;
  action: ApprovalAction;
  comments: string | null;
  actionDate: string;
}

export interface RequisitionStatusHistoryRecord {
  id: number;
  oldStatus: RequisitionStatus | null;
  newStatus: RequisitionStatus;
  changedById: number;
  changedByName?: string;
  changedAt: string;
  notes: string | null;
}

export interface Requisition {
  id: number;
  requisitionNumber: string;
  unitId: number;
  requestedById: number;
  requestedByName?: string;
  approvedById: number | null;
  supplyCatalogItemId: number | null;
  ammoCatalogItemId: number | null;
  equipmentCatalogItemId: number | null;
  nsn: string | null;
  dodic: string | null;
  nomenclature: string;
  quantityRequested: number;
  quantityApproved: number | null;
  quantityIssued: number | null;
  unitOfIssue: string;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  justification: string | null;
  denialReason: string | null;
  documentNumber: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  approvals?: RequisitionApprovalRecord[];
  statusHistory?: RequisitionStatusHistoryRecord[];
}

export interface InventoryRecord {
  id: number;
  unitId: number;
  location: string;
  nsn: string | null;
  nomenclature: string;
  unitOfIssue: string;
  quantityOnHand: number;
  quantityOnOrder: number;
  quantityDueOut: number;
  reorderPoint: number | null;
  reorderQuantity: number | null;
  lotNumber: string | null;
  expirationDate: string | null;
  conditionCode: string;
  lastInventoryDate: string;
}

export interface InventoryTransaction {
  id: number;
  inventoryRecordId: number;
  transactionType: TransactionType;
  quantity: number;
  requisitionId: number | null;
  performedById: number;
  transactionDate: string;
  documentNumber: string | null;
  notes: string | null;
}

export interface LowStockAlert {
  inventoryRecordId: number;
  unitId: number;
  location: string;
  nomenclature: string;
  quantityOnHand: number;
  reorderPoint: number;
  quantityBelow: number;
  lastInventoryDate: string;
}

// --- Personnel & Manning ---
export type PayGrade = 'E1'|'E2'|'E3'|'E4'|'E5'|'E6'|'E7'|'E8'|'E9'|'W1'|'W2'|'W3'|'W4'|'W5'|'O1'|'O2'|'O3'|'O4'|'O5'|'O6'|'O7'|'O8'|'O9'|'O10';
export type RifleQual = 'EXPERT'|'SHARPSHOOTER'|'MARKSMAN'|'UNQUAL';
export type SwimQual = 'CWS1'|'CWS2'|'CWS3'|'CWS4'|'UNQUAL';
export type SecurityClearanceLevel = 'NONE'|'CONFIDENTIAL'|'SECRET'|'TOP_SECRET'|'TS_SCI';
export type DutyStatusType = 'PRESENT'|'UA'|'DESERTER'|'AWOL'|'CONFINEMENT'|'LIMDU'|'PTAD';

export interface PersonnelRecord {
  id: number; edipi: string; firstName: string; lastName: string;
  rank: string | null; unitId: number | null; mos: string | null;
  payGrade: PayGrade | null; billet: string | null;
  dateOfRank: string | null; eaos: string | null; pmeComplete: boolean;
  rifleQual: RifleQual | null; rifleQualDate: string | null;
  pftScore: number | null; pftDate: string | null;
  cftScore: number | null; cftDate: string | null;
  swimQual: SwimQual | null; securityClearance: SecurityClearanceLevel | null;
  clearanceExpiry: string | null; driversLicenseMilitary: boolean;
  dutyStatus: DutyStatusType; status: string;
  currentMovementId?: number | null;
}

export interface BilletRecord {
  id: number; unitId: number; billetIdCode: string; billetTitle: string;
  mosRequired: string | null; rankRequired: string | null;
  isKeyBillet: boolean; isFilled: boolean;
  filledById: number | null; filledByName?: string; filledDate: string | null;
}

export interface ManningSnapshotRecord {
  id: number; unitId: number; snapshotDate: string;
  authorizedTotal: number; assignedTotal: number; presentForDuty: number;
  fillRatePct: number; mosShortfalls: Record<string, number> | null;
  rankDistribution: Record<string, number> | null;
}

export interface QualificationRecord {
  id: number; personnelId: number; qualificationType: string;
  qualificationName: string; dateAchieved: string;
  expirationDate: string | null; isCurrent: boolean;
}

export interface UnitStrengthData {
  totalAuthorized: number; totalAssigned: number; presentForDuty: number;
  deployed: number; tdy: number; leave: number; medical: number;
  inactive: number; fillRatePct: number;
}

export interface MOSFillData { required: number; assigned: number; shortfall: number; }

export interface QualStatusData { total: number; current: number; percent: number; }

export interface PersonnelReadinessData {
  pRating: string; percentReady: number;
  fillRatePct: number; qualificationPct: number; fitnessPct: number;
}

export interface EASRecord {
  id: number; edipi: string; firstName: string; lastName: string;
  rank: string; mos: string; payGrade: string | null; billet: string | null;
  eaos: string; daysUntilEas: number;
}

// --- Transportation & Movement Expansion ---
export type ConvoyPlanStatus = 'DRAFT' | 'APPROVED' | 'EXECUTING' | 'COMPLETE' | 'CANCELED';
export type RiskAssessmentLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type LiftRequestPriority = 'ROUTINE' | 'PRIORITY' | 'EMERGENCY';
export type LiftRequestStatus = 'REQUESTED' | 'APPROVED' | 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELED';
export type CargoType = 'PERSONNEL' | 'EQUIPMENT' | 'SUPPLY' | 'MIXED';

export interface ConvoySerial {
  id: number;
  convoyPlanId: number;
  serialNumber: string;
  serialCommanderId: number | null;
  serialCommanderName?: string;
  vehicleCount: number;
  paxCount: number;
  marchOrder: number;
  marchSpeedKph: number;
  catchUpSpeedKph: number;
  intervalMeters: number;
  createdAt: string;
}

export interface ConvoyPlan {
  id: number;
  name: string;
  unitId: number;
  createdBy: number;
  status: ConvoyPlanStatus;
  routeName: string | null;
  routeDescription: string | null;
  totalDistanceKm: number | null;
  estimatedDurationHours: number | null;
  routePrimary: string | null;
  routeAlternate: string | null;
  departureTimePlanned: string | null;
  spTime: string | null;
  rpTime: string | null;
  briefTime: string | null;
  rehearsalTime: string | null;
  movementCreditNumber: string | null;
  convoyCommanderId: number | null;
  riskAssessmentLevel: RiskAssessmentLevel | null;
  commPlan: string | null;
  recoveryPlan: string | null;
  medevacPlan: string | null;
  createdAt: string;
  updatedAt: string;
  serials: ConvoySerial[];
  movementId?: number | null;
}

export interface MarchTableData {
  spTime: string;
  rpTime: string;
  checkpoints: Array<{
    name: string;
    distanceKm: number;
    cumulativeDistanceKm: number;
    time: string;
    speedKph: number;
  }>;
  totalDistanceKm: number;
  totalDurationHours: number;
  marchSpeedKph: number;
  catchUpSpeedKph: number;
  fuelEstimate?: {
    totalGallons: number;
    totalLiters: number;
    perVehicleGallons: number;
  };
}

export interface LiftRequest {
  id: number;
  requestingUnitId: number;
  requestingUnitName?: string;
  supportingUnitId: number | null;
  supportingUnitName?: string;
  cargoType: CargoType;
  cargoDescription: string;
  weightLbs: number | null;
  cubeFt: number | null;
  paxCount: number;
  hazmat: boolean;
  priority: LiftRequestPriority;
  requiredDeliveryDate: string;
  status: LiftRequestStatus;
  pickupLocation: string;
  pickupLat: number | null;
  pickupLon: number | null;
  deliveryLocation: string;
  deliveryLat: number | null;
  deliveryLon: number | null;
  assignedMovementId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MovementHistoryRecord {
  id: number;
  convoyId: string | null;
  origin: string;
  destination: string;
  departureTime: string | null;
  eta: string | null;
  actualArrival: string | null;
  vehicleCount: number;
  cargoDescription: string | null;
  status: string;
  onTime: boolean;
  durationHours: number | null;
  averageSpeedKph: number | null;
  convoyPlanName?: string;
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
  casualtyId: string;
  unitId: number;
  personnelId: number | null;
  incidentDatetime: string;
  reportedDatetime: string;
  locationLat: number;
  locationLon: number;
  locationMgrs: string | null;
  locationDescription: string | null;
  precedence: CASEVACPrecedence;
  numberOfPatients: number;
  specialEquipmentRequired: string;
  securityAtPickup: string;
  patientType: string;
  markingMethod: string;
  nationalityStatus: string;
  nbcContamination: boolean;
  mechanismOfInjury: string | null;
  injuriesDescription: string | null;
  triageCategory: TriageCategory | null;
  tcccInterventions: Record<string, unknown> | null;
  status: CasualtyReportStatus;
  transportMethod: string | null;
  evacuationStatus: EvacuationStatus | null;
  receivingFacilityId: number | null;
  pickupTime: string | null;
  arrivalAtFacilityTime: string | null;
  remarks: string | null;
  logs: CasualtyLog[];
  createdAt: string;
  updatedAt: string;
}

export interface CasualtyLog {
  id: number;
  casualtyReportId: number;
  eventType: string;
  eventTime: string;
  notes: string | null;
}

export interface MedicalFacility {
  id: number;
  name: string;
  facilityType: MTFType;
  callsign: string | null;
  unitId: number | null;
  locationLat: number;
  locationLon: number;
  locationMgrs: string | null;
  capacity: number;
  currentCensus: number;
  status: MTFStatus;
  surgicalCapability: boolean;
  bloodBank: boolean;
  ventCapacity: number;
  contactFreq: string | null;
  physicianStaffing: number;
  paStaffing: number;
  medicStaffing: number;
  surgicalTechStaffing: number;
}

export interface BloodProductRecord {
  id: number;
  facilityId: number;
  productType: BloodProductType;
  bloodType: BloodTypeEnum;
  unitsOnHand: number;
  unitsUsed24h: number;
  expirationDate: string | null;
  walkingBloodBankDonors: number;
}

export interface MedicalBurnRate {
  id: number;
  unitId: number;
  supplyCatalogItemId: number;
  supplyName: string;
  periodStart: string;
  periodEnd: string;
  quantityUsed: number;
  quantityOnHand: number;
  daysOfSupply: number | null;
  burnRatePerDay: number;
  projectedExhaustionDate: string | null;
}

export interface PERSTATMedical {
  unitId: number;
  totalStrength: number;
  effectiveStrength: number;
  medicalHolds: number;
  activeCasualties: number;
  triageBreakdown: Record<string, number>;
  tcccCertRatePct: number;
  bloodTypeDistribution: Record<string, number>;
  timestamp: string;
}

// --- Notifications & Alert Rules ---

export type RuleOperator = 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ' | 'NEQ';
export type NotificationChannelType = 'IN_APP' | 'EMAIL' | 'BOTH' | 'NONE';

export interface AlertRule {
  id: number;
  name: string;
  description?: string;
  alertType: string;
  severity: string;
  metric: string;
  operator: RuleOperator;
  thresholdValue: number;
  isScopeAll: boolean;
  scopeUnitId?: number;
  cooldownMinutes: number;
  lastFiredAt?: string;
  isActive: boolean;
  createdBy: number;
  createdAt?: string;
  updatedAt?: string;
  // Advanced fields
  scopeType?: string;
  scopeEchelon?: string;
  includeSubordinates?: boolean;
  metricType?: string;
  metricItemFilter?: Record<string, any>;
  notifyRoles?: string[];
  checkIntervalMinutes?: number;
  autoRecommend?: boolean;
  recommendType?: string;
  recommendSourceUnitId?: number;
  recommendAssignToRole?: string;
}

export interface LogisticsRecommendation {
  id: number;
  recommendationType: string;
  triggeredByRuleId?: number;
  triggeredByMetric?: string;
  targetUnitId: number;
  description: string;
  recommendedItems?: any[];
  recommendedSource?: string;
  recommendedVehicles?: any[];
  recommendedPersonnel?: any[];
  recommendedRoute?: string;
  estimatedWeight?: number;
  estimatedCost?: number;
  estimatedDuration?: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXECUTED' | 'EXPIRED';
  assignedToUserId?: number;
  assignedToRole?: string;
  generatedMovementId?: number;
  generatedRequisitionId?: number;
  createdAt?: string;
  decidedAt?: string;
  decidedBy?: number;
  notes?: string;
  expiresAt?: string;
}

export interface Notification {
  id: number;
  userId: number;
  alertId?: number;
  title: string;
  body: string;
  linkUrl?: string;
  channel: NotificationChannelType;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreference {
  id: number;
  userId: number;
  alertType: string;
  channel: NotificationChannelType;
  minSeverity: string;
}

export interface AlertSummary {
  totalActive: number;
  bySeverity: { CRITICAL: number; WARNING: number; INFO: number };
  byType: Record<string, number>;
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
  unitId: number;
  name: string;
  facilityType: FuelFacilityType;
  fuelType: FuelType;
  capacityGallons: number;
  currentGallons: number;
  fillPercentage: number;
  status: FuelStorageStatus;
  latitude: number | null;
  longitude: number | null;
  mgrs: string | null;
  locationDescription: string | null;
  lastResupplyDate: string | null;
  nextResupplyEta: string | null;
  equipmentId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FuelTransaction {
  id: number;
  storagePointId: number;
  storagePointName?: string;
  transactionType: FuelTransactionType;
  fuelType: FuelType;
  quantityGallons: number;
  receivingUnitId: number | null;
  vehicleBumperNumber: string | null;
  vehicleType: string | null;
  documentNumber: string | null;
  meterReadingBefore: number | null;
  meterReadingAfter: number | null;
  notes: string | null;
  performedByName?: string;
  transactionDate: string;
  createdAt: string;
}

export interface FuelConsumptionRate {
  id: number;
  equipmentCatalogItemId: number;
  equipmentName?: string;
  fuelType: FuelType;
  gallonsPerHourIdle: number;
  gallonsPerHourTactical: number;
  gallonsPerMile: number | null;
  gallonsPerFlightHour: number | null;
  source: ConsumptionSourceType;
  notes: string | null;
  updatedAt: string;
}

export interface FuelForecast {
  unitId: number;
  forecastDate: string;
  operationalTempo: OperationalTempo;
  projectedDailyConsumptionGallons: number;
  currentOnHandGallons: number;
  daysOfSupply: number;
  resupplyRequiredByDate: string;
  alert: boolean;
}

export interface FuelDashboard {
  unitId: number;
  storagePoints: FuelStoragePoint[];
  totalCapacityGallons: number;
  totalOnHandGallons: number;
  fillPercentage: number;
  daysOfSupply: number;
  limitingFuelType: string | null;
  alert: boolean;
  forecast: {
    operationalTempo: OperationalTempo;
    projectedDailyConsumption: number;
    daysOfSupply: number;
    resupplyRequiredBy: string;
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
  serialNumber: string;
  itemType: SensitiveItemType;
  nomenclature: string;
  nsn: string | null;
  tamcn: string | null;
  securityClassification: SecurityClassification;
  owningUnitId: number;
  currentHolderId: number | null;
  currentHolderName: string | null;
  handReceiptNumber: string | null;
  subHandReceiptNumber: string | null;
  conditionCode: ItemConditionCode;
  status: SensitiveItemStatus;
  lastInventoryDate: string | null;
  lastTransferDate: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
}

export interface CustodyTransfer {
  id: number;
  sensitiveItemId: number;
  fromPersonnelId: number | null;
  fromPersonnelName: string | null;
  toPersonnelId: number | null;
  toPersonnelName: string | null;
  fromUnitId: number | null;
  toUnitId: number | null;
  transferType: TransferType;
  transferDate: string;
  documentNumber: string | null;
  authorizedBy: number | null;
  witnessedBy: number | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

export interface InventoryEvent {
  id: number;
  unitId: number;
  inventoryType: InventoryEventType;
  conductedBy: number;
  conductedByName: string | null;
  witnessedBy: number | null;
  startedAt: string;
  completedAt: string | null;
  totalItemsExpected: number;
  totalItemsVerified: number;
  discrepancies: number;
  status: InventoryEventStatus;
  approvedBy: number | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface InventoryLineItem {
  id: number;
  inventoryEventId: number;
  sensitiveItemId: number;
  verified: boolean;
  serialNumberVerified: boolean;
  conditionCode: ItemConditionCode | null;
  discrepancyType: DiscrepancyType | null;
  notes: string | null;
  createdAt: string;
}

export interface AuditLogEntry {
  id: number;
  userId: number;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: number | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface HandReceipt {
  personnelId: number;
  personnelName: string;
  rank: string;
  edipi: string;
  unitName: string;
  totalItems: number;
  items: SensitiveItem[];
  generatedAt: string;
}

// Transportation manifest types
export interface LocationInventoryItem {
  itemId: string;
  itemType: 'equipment' | 'supply' | 'personnel';
  nomenclature: string;
  tamcn?: string;
  nsn?: string;
  category: string;
  availableQty: number;
  weightLbs?: number;
  status: string;
}

export interface ManifestEntry {
  itemId: string;
  nomenclature: string;
  category: string;
  quantity: number;
  priority: 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'FLASH';
  specialHandling?: string;
  weightLbs?: number;
  addedAt: string;
}

// --- Transportation Personnel Assignment & Certification Verification ---

export type QualificationType =
  | 'MILITARY_DRIVER' | 'HMMWV_LICENSE' | 'MTVR_LICENSE' | 'JLTV_LICENSE'
  | 'LVSR_LICENSE' | 'LAV_LICENSE' | 'ACV_LICENSE' | 'WEAPONS_QUAL' | 'TCCC' | 'MOS_8404';

export interface ConvoyCargoItem {
  id: number;
  movementId: number;
  convoyVehicleId: number;
  description: string | null;
  quantity: number;
  weightLbs: number | null;
  isHazmat: boolean;
  supplyCatalogItemId: number | null;
  equipmentCatalogItemId: number | null;
}

export interface QualifiedPersonnelItem {
  id: number;
  edipi: string;
  rank: string | null;
  firstName: string;
  lastName: string;
  mos: string | null;
  payGrade: string | null;
  isAssignedToMovement: boolean;
  qualifications: { qualificationType: string; qualificationName: string; isCurrent: boolean; expirationDate: string | null }[];
}

export interface QualifiedPersonnelResponse {
  personnel: QualifiedPersonnelItem[];
  total: number;
  requiredQualifications: string[];
}

export interface ValidateAssignmentRequest {
  personnelId: number;
  role: string;
  vehicle_tamcn: string;
  movement_id: number;
}

export interface ValidateAssignmentResponse {
  valid: boolean;
  reason: string;
  missingQualifications: string[];
  assignedToOtherVehicle: boolean;
}

export interface FullManifestVehicle {
  convoyVehicleId: number;
  bumperNumber: string;
  vehicleType: string;
  tamcn: string;
  personnel: { role: string; id: number; rank: string; name: string }[];
  cargo: ConvoyCargoItem[];
  totalCargoWeight: number;
}

export interface FullManifestResponse {
  movementId: number;
  convoyId: string;
  vehicles: FullManifestVehicle[];
}
