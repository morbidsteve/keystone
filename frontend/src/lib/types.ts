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
  MOVEMENT_SUMMARY = 'MOVEMENT_SUMMARY',
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
  generatedBy: string;
  generatedAt: string;
  finalizedAt?: string;
  finalizedBy?: string;
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
