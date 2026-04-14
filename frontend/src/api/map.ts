import apiClient from './client';
import { isDemoMode } from './mockClient';
import type { ApiResponse } from '@/lib/types';

// ── Map Types ──────────────────────────────────────────────────────────

export interface SupplyBreakdown {
  supplyClass: string;
  name: string;
  percentage: number;
  dos: number;
  status: string;
}

export interface EquipmentSummary {
  type: string;
  missionCapable: number;
  total: number;
  readinessPct: number;
}

export interface InboundConvoy {
  convoyId: string;
  name: string;
  eta: string;
  status: string;
  cargoSummary: string;
}

export interface MapUnit {
  unitId: string;
  name: string;
  abbreviation: string;
  echelon: string;
  latitude: number;
  longitude: number;
  mgrs?: string;
  supplyStatus: string;
  readinessPct: number;
  worstSupplyClass: string;
  worstDos: number;
  symbolSidc: string;
  positionSource?: string;
  lastUpdated?: string;
  supplyBreakdown?: SupplyBreakdown[];
  equipmentSummary?: EquipmentSummary[];
  inboundConvoys?: InboundConvoy[];
}

export interface ConvoyEndpoint {
  name: string;
  lat: number;
  lon: number;
  mgrs?: string;
}

export interface MapConvoy {
  convoyId: string;
  name: string;
  origin: ConvoyEndpoint;
  destination: ConvoyEndpoint;
  currentPosition: { lat: number; lon: number; mgrs?: string } | null;
  routeGeometry: [number, number][];
  status: string;
  vehicleCount: number;
  cargoSummary: string;
  departureTime: string;
  eta: string;
  speedKph: number;
  heading: number;
}

export interface ConvoyVehicleDetail {
  vehicleId: string;
  vehicleType: 'HMMWV' | 'MTVR' | 'JLTV' | 'LVSR' | 'LAV' | 'ACV' | 'AAV' | string;
  tamcn: string;
  bumperNumber: string;
  callSign: string;
  status: 'FMC' | 'NMC' | 'BROKEN_DOWN' | 'MOVING' | 'STOPPED';
  position: { lat: number; lon: number };
  heading: number;
  speedKph: number;
  lastUpdated: string;
  crew: {
    personnelId: string;
    rank: string;
    name: string;
    role: 'DRIVER' | 'TC' | 'GUNNER' | 'PAX';
  }[];
  cargo: {
    itemId: string;
    itemName: string;
    supplyClass: string;
    quantity: number;
    uom: string;
    totalWeightKg: number;
  }[];
}

export interface ConvoyMovementDetail extends MapConvoy {
  vehicles: ConvoyVehicleDetail[];
  totalPersonnel: number;
  totalCargoWeightKg: number;
  progressPercent: number;
}

export interface MapSupplyPoint {
  id: string;
  name: string;
  pointType: string;
  latitude: number;
  longitude: number;
  mgrs?: string;
  status: string;
  parentUnitName: string;
  capacityNotes: string;
}

export interface RouteWaypoint {
  lat: number;
  lon: number;
  mgrs?: string;
  label?: string;
}

export interface MapRoute {
  id: string;
  name: string;
  routeType: string;
  status: string;
  waypoints: RouteWaypoint[];
  description: string;
}

export interface MapAlert {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  unitName: string;
  latitude: number;
  longitude: number;
  mgrs?: string;
}

export interface MapData {
  units: MapUnit[];
  convoys: MapConvoy[];
  supplyPoints: MapSupplyPoint[];
  routes: MapRoute[];
  alerts: MapAlert[];
}

// ── Mock Data ──────────────────────────────────────────────────────────

const mockMapData: MapData = {
  units: [
    {
      unitId: '1mef',
      name: 'I Marine Expeditionary Force',
      abbreviation: 'I MEF',
      echelon: 'MEF',
      latitude: 33.3,
      longitude: -117.35,
      mgrs: '11SMS6741584600',
      supplyStatus: 'GREEN',
      readinessPct: 92,
      worstSupplyClass: 'V',
      worstDos: 8,
      symbolSidc: 'SFGPU-----G----',
      positionSource: 'GCCS',
      lastUpdated: new Date(Date.now() - 300000).toISOString(),
      supplyBreakdown: [
        { supplyClass: 'I', name: 'Subsistence', percentage: 95, dos: 14, status: 'GREEN' },
        { supplyClass: 'III', name: 'POL', percentage: 88, dos: 10, status: 'GREEN' },
        { supplyClass: 'V', name: 'Ammunition', percentage: 72, dos: 8, status: 'AMBER' },
        { supplyClass: 'VIII', name: 'Medical', percentage: 91, dos: 12, status: 'GREEN' },
        { supplyClass: 'IX', name: 'Repair Parts', percentage: 78, dos: 9, status: 'AMBER' },
      ],
      equipmentSummary: [
        { type: 'LAV-25', missionCapable: 42, total: 48, readinessPct: 88 },
        { type: 'HMMWV', missionCapable: 180, total: 200, readinessPct: 90 },
        { type: 'M1A1', missionCapable: 28, total: 32, readinessPct: 88 },
      ],
      inboundConvoys: [
        {
          convoyId: 'cv1',
          name: 'SUPPLY RUN ALPHA',
          eta: new Date(Date.now() + 7200000).toISOString(),
          status: 'EN_ROUTE',
          cargoSummary: 'CL I, CL III',
        },
      ],
    },
    {
      unitId: '1mardiv',
      name: '1st Marine Division',
      abbreviation: '1 MARDIV',
      echelon: 'DIVISION',
      latitude: 33.31,
      longitude: -117.32,
      mgrs: '11SMS7021185700',
      supplyStatus: 'AMBER',
      readinessPct: 85,
      worstSupplyClass: 'V',
      worstDos: 5,
      symbolSidc: 'SFGPU-----F----',
      positionSource: 'GCCS',
      lastUpdated: new Date(Date.now() - 600000).toISOString(),
      supplyBreakdown: [
        { supplyClass: 'I', name: 'Subsistence', percentage: 90, dos: 12, status: 'GREEN' },
        { supplyClass: 'III', name: 'POL', percentage: 75, dos: 7, status: 'AMBER' },
        { supplyClass: 'V', name: 'Ammunition', percentage: 58, dos: 5, status: 'RED' },
        { supplyClass: 'IX', name: 'Repair Parts', percentage: 68, dos: 6, status: 'AMBER' },
      ],
      equipmentSummary: [
        { type: 'LAV-25', missionCapable: 36, total: 48, readinessPct: 75 },
        { type: 'HMMWV', missionCapable: 155, total: 180, readinessPct: 86 },
      ],
    },
    {
      unitId: '1mar',
      name: '1st Marine Regiment',
      abbreviation: '1 MAR',
      echelon: 'REGIMENT',
      latitude: 33.28,
      longitude: -117.37,
      mgrs: '11SMS6554582389',
      supplyStatus: 'GREEN',
      readinessPct: 91,
      worstSupplyClass: 'IX',
      worstDos: 7,
      symbolSidc: 'SFGPU-----E----',
      positionSource: 'BFT',
      lastUpdated: new Date(Date.now() - 120000).toISOString(),
    },
    {
      unitId: '1-1',
      name: '1st Battalion, 1st Marines',
      abbreviation: '1/1',
      echelon: 'BATTALION',
      latitude: 33.27,
      longitude: -117.34,
      mgrs: '11SMS6833581271',
      supplyStatus: 'RED',
      readinessPct: 68,
      worstSupplyClass: 'V',
      worstDos: 2,
      symbolSidc: 'SFGPU-----D----',
      positionSource: 'BFT',
      lastUpdated: new Date(Date.now() - 60000).toISOString(),
      supplyBreakdown: [
        { supplyClass: 'I', name: 'Subsistence', percentage: 82, dos: 8, status: 'GREEN' },
        { supplyClass: 'III', name: 'POL', percentage: 55, dos: 4, status: 'AMBER' },
        { supplyClass: 'V', name: 'Ammunition', percentage: 28, dos: 2, status: 'RED' },
        { supplyClass: 'VIII', name: 'Medical', percentage: 70, dos: 6, status: 'AMBER' },
        { supplyClass: 'IX', name: 'Repair Parts', percentage: 45, dos: 3, status: 'RED' },
      ],
      equipmentSummary: [
        { type: 'LAV-25', missionCapable: 8, total: 14, readinessPct: 57 },
        { type: 'HMMWV', missionCapable: 28, total: 40, readinessPct: 70 },
      ],
      inboundConvoys: [
        {
          convoyId: 'cv2',
          name: 'EMERGENCY RESUPPLY',
          eta: new Date(Date.now() + 3600000).toISOString(),
          status: 'EN_ROUTE',
          cargoSummary: 'CL V (Priority)',
        },
      ],
    },
    {
      unitId: '2-1',
      name: '2nd Battalion, 1st Marines',
      abbreviation: '2/1',
      echelon: 'BATTALION',
      latitude: 33.26,
      longitude: -117.39,
      mgrs: '11SMS6367480178',
      supplyStatus: 'AMBER',
      readinessPct: 79,
      worstSupplyClass: 'III',
      worstDos: 5,
      symbolSidc: 'SFGPU-----D----',
      positionSource: 'BFT',
      lastUpdated: new Date(Date.now() - 180000).toISOString(),
    },
  ],
  convoys: [
    {
      convoyId: 'cv1',
      name: 'SUPPLY RUN ALPHA',
      origin: { name: 'LOG BASE CHARLIE', lat: 33.35, lon: -117.30, mgrs: '11SMS7208690129' },
      destination: { name: 'I MEF HQ', lat: 33.30, lon: -117.35, mgrs: '11SMS6741584600' },
      currentPosition: { lat: 33.33, lon: -117.32, mgrs: '11SMS7021887917' },
      routeGeometry: [
        [33.35, -117.30],
        [33.34, -117.31],
        [33.33, -117.32],
        [33.32, -117.33],
        [33.31, -117.34],
        [33.30, -117.35],
      ],
      status: 'EN_ROUTE',
      vehicleCount: 12,
      cargoSummary: 'CL I: 20T, CL III: 5000 GAL',
      departureTime: new Date(Date.now() - 3600000).toISOString(),
      eta: new Date(Date.now() + 3600000).toISOString(),
      speedKph: 35,
      heading: 225,
    },
    {
      convoyId: 'cv2',
      name: 'EMERGENCY RESUPPLY',
      origin: { name: 'ASP BRAVO', lat: 33.32, lon: -117.28, mgrs: '11SMS7393886798' },
      destination: { name: '1/1 BN CP', lat: 33.27, lon: -117.34, mgrs: '11SMS6833581271' },
      currentPosition: { lat: 33.30, lon: -117.30, mgrs: '11SMS7207084585' },
      routeGeometry: [
        [33.32, -117.28],
        [33.31, -117.29],
        [33.30, -117.30],
        [33.29, -117.31],
        [33.28, -117.32],
        [33.27, -117.34],
      ],
      status: 'EN_ROUTE',
      vehicleCount: 6,
      cargoSummary: 'CL V: 15T (PRIORITY)',
      departureTime: new Date(Date.now() - 1800000).toISOString(),
      eta: new Date(Date.now() + 1800000).toISOString(),
      speedKph: 45,
      heading: 210,
    },
    {
      convoyId: 'cv3',
      name: 'ROUTINE SUPPLY BRAVO',
      origin: { name: 'DEPOT ALPHA', lat: 33.36, lon: -117.25, mgrs: '11SMS7673691244' },
      destination: { name: '2/1 BN CP', lat: 33.26, lon: -117.39, mgrs: '11SMS6367480178' },
      currentPosition: null,
      routeGeometry: [
        [33.36, -117.25],
        [33.34, -117.28],
        [33.32, -117.31],
        [33.29, -117.35],
        [33.26, -117.39],
      ],
      status: 'PLANNED',
      vehicleCount: 8,
      cargoSummary: 'CL I, CL III, CL IX',
      departureTime: new Date(Date.now() + 14400000).toISOString(),
      eta: new Date(Date.now() + 21600000).toISOString(),
      speedKph: 0,
      heading: 0,
    },
  ],
  supplyPoints: [
    {
      id: 'sp1',
      name: 'LOG BASE CHARLIE',
      pointType: 'LOG_BASE',
      latitude: 33.35,
      longitude: -117.30,
      mgrs: '11SMS7208690129',
      status: 'ACTIVE',
      parentUnitName: 'CLR-1',
      capacityNotes: 'Full capacity, 3-day surge stock',
    },
    {
      id: 'sp2',
      name: 'ASP BRAVO',
      pointType: 'AMMO_SUPPLY_POINT',
      latitude: 33.32,
      longitude: -117.28,
      mgrs: '11SMS7393886798',
      status: 'ACTIVE',
      parentUnitName: '1st EOD Co',
      capacityNotes: 'CL V primary distribution',
    },
    {
      id: 'sp3',
      name: 'FARP DELTA',
      pointType: 'FARP',
      latitude: 33.29,
      longitude: -117.40,
      mgrs: '11SMS6275683508',
      status: 'ACTIVE',
      parentUnitName: 'HMLA-367',
      capacityNotes: 'JP-5, 10K gal capacity',
    },
    {
      id: 'sp4',
      name: 'LZ EAGLE',
      pointType: 'LZ',
      latitude: 33.25,
      longitude: -117.36,
      mgrs: '11SMS6646579060',
      status: 'PLANNED',
      parentUnitName: '1/1 BN',
      capacityNotes: 'Emergency resupply LZ, CH-53 capable',
    },
    {
      id: 'sp5',
      name: 'WATER POINT 3',
      pointType: 'WATER_POINT',
      latitude: 33.28,
      longitude: -117.33,
      mgrs: '11SMS6927082377',
      status: 'ACTIVE',
      parentUnitName: '7th ESB',
      capacityNotes: 'ROWPU operational, 20K gal/day',
    },
  ],
  routes: [
    {
      id: 'r1',
      name: 'MSR TAMPA',
      routeType: 'MSR',
      status: 'OPEN',
      waypoints: [
        { lat: 33.36, lon: -117.25, mgrs: '11SMS7673691244', label: 'DEPOT ALPHA' },
        { lat: 33.34, lon: -117.28 },
        { lat: 33.32, lon: -117.31 },
        { lat: 33.30, lon: -117.34 },
        { lat: 33.28, lon: -117.37 },
        { lat: 33.26, lon: -117.40, mgrs: '11SMS6275680400', label: 'FARP DELTA' },
      ],
      description: 'Main supply route, Camp Pendleton N-S axis',
    },
    {
      id: 'r2',
      name: 'ASR LION',
      routeType: 'ASR',
      status: 'OPEN',
      waypoints: [
        { lat: 33.30, lon: -117.25, label: 'ASR LION START' },
        { lat: 33.30, lon: -117.28 },
        { lat: 33.30, lon: -117.31 },
        { lat: 33.30, lon: -117.34 },
        { lat: 33.30, lon: -117.37 },
        { lat: 33.30, lon: -117.40, label: 'ASR LION END' },
      ],
      description: 'Alternate E-W supply route',
    },
    {
      id: 'r3',
      name: 'ASR TIGER',
      routeType: 'ASR',
      status: 'RESTRICTED',
      waypoints: [
        { lat: 33.35, lon: -117.35 },
        { lat: 33.33, lon: -117.35 },
        { lat: 33.31, lon: -117.36, mgrs: '11SMS6648885712', label: 'RESTRICTION ZONE' },
        { lat: 33.29, lon: -117.37 },
        { lat: 33.27, lon: -117.38 },
      ],
      description: 'Secondary route, restricted due to construction',
    },
  ],
  alerts: [
    {
      id: 'a1',
      alertType: 'SUPPLY_CRITICAL',
      severity: 'CRITICAL',
      message: '1/1 BN CL V at 28% - 2 DOS remaining',
      unitName: '1/1',
      latitude: 33.27,
      longitude: -117.34,
      mgrs: '11SMS6833581271',
    },
    {
      id: 'a2',
      alertType: 'EQUIPMENT_DOWN',
      severity: 'WARNING',
      message: '1 MARDIV LAV-25 readiness below 80%',
      unitName: '1 MARDIV',
      latitude: 33.31,
      longitude: -117.32,
      mgrs: '11SMS7021185700',
    },
    {
      id: 'a3',
      alertType: 'MOVEMENT_DELAYED',
      severity: 'WARNING',
      message: 'ASR TIGER restricted - alternate routing in effect',
      unitName: '',
      latitude: 33.31,
      longitude: -117.36,
      mgrs: '11SMS6648885712',
    },
  ],
};

// ── Demo-mode persistence ─────────────────────────────────────────────

const MAP_STORAGE_KEY = 'keystone_map_data';

function loadPersistedMapData(): void {
  try {
    const stored = localStorage.getItem(MAP_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as MapData;
      mockMapData.units = parsed.units;
      mockMapData.supplyPoints = parsed.supplyPoints;
      mockMapData.routes = parsed.routes;
    }
  } catch { /* ignore corrupt data */ }
}

function persistMapData(): void {
  try {
    localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify({
      units: mockMapData.units,
      supplyPoints: mockMapData.supplyPoints,
      routes: mockMapData.routes,
    }));
  } catch { /* storage full or unavailable */ }
}

loadPersistedMapData();

// ── Convoy Vehicle Mock Data ─────────────────────────────────────────

function generateMockConvoyMovements(): ConvoyMovementDetail[] {
  const baseConvoys = mockMapData.convoys;
  return baseConvoys
    .filter((c) => c.status === 'EN_ROUTE' || c.status === 'DELAYED')
    .map((convoy) => {
      if (convoy.convoyId === 'cv1') {
        return {
          ...convoy,
          progressPercent: 50,
          totalPersonnel: 7,
          totalCargoWeightKg: 11900,
          vehicles: [
            {
              vehicleId: 'veh-cv1-001',
              vehicleType: 'HMMWV' as const,
              tamcn: 'D1100',
              bumperNumber: 'A1-01',
              callSign: 'ALPHA-1',
              status: 'MOVING' as const,
              position: { lat: convoy.currentPosition!.lat, lon: convoy.currentPosition!.lon },
              heading: convoy.heading,
              speedKph: convoy.speedKph,
              lastUpdated: new Date().toISOString(),
              crew: [
                { personnelId: 'p1', rank: 'Cpl', name: 'Garcia, L.', role: 'DRIVER' as const },
                { personnelId: 'p2', rank: 'Sgt', name: 'Martinez, R.', role: 'TC' as const },
              ],
              cargo: [
                { itemId: 'i1', itemName: 'MRE Case', supplyClass: 'I', quantity: 50, uom: 'CASE', totalWeightKg: 1100 },
              ],
            },
            {
              vehicleId: 'veh-cv1-002',
              vehicleType: 'MTVR' as const,
              tamcn: 'D0054',
              bumperNumber: 'A1-02',
              callSign: 'ALPHA-2',
              status: 'MOVING' as const,
              position: { lat: convoy.currentPosition!.lat - 0.002, lon: convoy.currentPosition!.lon + 0.001 },
              heading: convoy.heading - 1,
              speedKph: convoy.speedKph - 1,
              lastUpdated: new Date().toISOString(),
              crew: [
                { personnelId: 'p3', rank: 'LCpl', name: 'Smith, J.', role: 'DRIVER' as const },
                { personnelId: 'p4', rank: 'PFC', name: 'Johnson, M.', role: 'TC' as const },
              ],
              cargo: [
                { itemId: 'i2', itemName: 'Diesel Fuel', supplyClass: 'III', quantity: 5000, uom: 'GAL', totalWeightKg: 4200 },
                { itemId: 'i3', itemName: 'MRE Case', supplyClass: 'I', quantity: 200, uom: 'CASE', totalWeightKg: 4400 },
              ],
            },
            {
              vehicleId: 'veh-cv1-003',
              vehicleType: 'JLTV' as const,
              tamcn: 'D1195',
              bumperNumber: 'A1-03',
              callSign: 'ALPHA-3',
              status: 'MOVING' as const,
              position: { lat: convoy.currentPosition!.lat - 0.004, lon: convoy.currentPosition!.lon + 0.002 },
              heading: convoy.heading + 1,
              speedKph: convoy.speedKph + 1,
              lastUpdated: new Date().toISOString(),
              crew: [
                { personnelId: 'p5', rank: 'LCpl', name: 'Brown, K.', role: 'DRIVER' as const },
                { personnelId: 'p6', rank: 'PFC', name: 'Davis, R.', role: 'GUNNER' as const },
                { personnelId: 'p7', rank: 'PFC', name: 'Miller, A.', role: 'PAX' as const },
              ],
              cargo: [
                { itemId: 'i4', itemName: 'Medical Supplies', supplyClass: 'VIII', quantity: 10, uom: 'KIT', totalWeightKg: 2200 },
              ],
            },
          ],
        };
      }
      // cv2 - EMERGENCY RESUPPLY
      return {
        ...convoy,
        progressPercent: 33,
        totalPersonnel: 4,
        totalCargoWeightKg: 15000,
        vehicles: [
          {
            vehicleId: 'veh-cv2-001',
            vehicleType: 'MTVR' as const,
            tamcn: 'D0054',
            bumperNumber: 'B2-01',
            callSign: 'BRAVO-1',
            status: 'MOVING' as const,
            position: { lat: convoy.currentPosition!.lat, lon: convoy.currentPosition!.lon },
            heading: convoy.heading,
            speedKph: convoy.speedKph,
            lastUpdated: new Date().toISOString(),
            crew: [
              { personnelId: 'p8', rank: 'Cpl', name: 'Wilson, T.', role: 'DRIVER' as const },
              { personnelId: 'p9', rank: 'Sgt', name: 'Taylor, D.', role: 'TC' as const },
            ],
            cargo: [
              { itemId: 'i5', itemName: '5.56mm Ball', supplyClass: 'V', quantity: 100, uom: 'CASE', totalWeightKg: 7500 },
            ],
          },
          {
            vehicleId: 'veh-cv2-002',
            vehicleType: 'MTVR' as const,
            tamcn: 'D0054',
            bumperNumber: 'B2-02',
            callSign: 'BRAVO-2',
            status: 'MOVING' as const,
            position: { lat: convoy.currentPosition!.lat - 0.002, lon: convoy.currentPosition!.lon + 0.001 },
            heading: convoy.heading + 2,
            speedKph: convoy.speedKph - 2,
            lastUpdated: new Date().toISOString(),
            crew: [
              { personnelId: 'p10', rank: 'LCpl', name: 'Anderson, P.', role: 'DRIVER' as const },
              { personnelId: 'p11', rank: 'PFC', name: 'Thomas, S.', role: 'TC' as const },
            ],
            cargo: [
              { itemId: 'i6', itemName: '7.62mm Linked', supplyClass: 'V', quantity: 50, uom: 'CASE', totalWeightKg: 5000 },
              { itemId: 'i7', itemName: 'Grenades, Frag', supplyClass: 'V', quantity: 20, uom: 'CASE', totalWeightKg: 2500 },
            ],
          },
        ],
      };
    });
}

// ── API Functions ──────────────────────────────────────────────────────

export async function getMapData(): Promise<MapData> {
  if (isDemoMode) return JSON.parse(JSON.stringify(mockMapData)) as MapData;
  const response = await apiClient.get<ApiResponse<MapData>>('/map/all');
  return response.data.data;
}

export async function getMapUnits(): Promise<MapUnit[]> {
  if (isDemoMode) return mockMapData.units;
  const response = await apiClient.get<ApiResponse<MapUnit[]>>('/map/units');
  return response.data.data;
}

export async function getMapConvoys(): Promise<MapConvoy[]> {
  if (isDemoMode) return mockMapData.convoys;
  const response = await apiClient.get<ApiResponse<MapConvoy[]>>('/map/convoys');
  return response.data.data;
}

export async function getMapSupplyPoints(): Promise<MapSupplyPoint[]> {
  if (isDemoMode) return mockMapData.supplyPoints;
  const response = await apiClient.get<ApiResponse<MapSupplyPoint[]>>('/map/supply-points');
  return response.data.data;
}

export async function getMapRoutes(): Promise<MapRoute[]> {
  if (isDemoMode) return mockMapData.routes;
  const response = await apiClient.get<ApiResponse<MapRoute[]>>('/map/routes');
  return response.data.data;
}

export async function getMapAlerts(): Promise<MapAlert[]> {
  if (isDemoMode) return mockMapData.alerts;
  const response = await apiClient.get<ApiResponse<MapAlert[]>>('/map/alerts');
  return response.data.data;
}

// ── Active Convoy Movements (with vehicle detail) ────────────────────

export async function getActiveConvoyMovements(): Promise<ConvoyMovementDetail[]> {
  if (isDemoMode) return generateMockConvoyMovements();
  try {
    const response = await apiClient.get<ApiResponse<ConvoyMovementDetail[]>>(
      '/transportation/active-convoys/map',
    );
    return response.data.data ?? [];
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return [];
    throw err;
  }
}

// ── Position Update ───────────────────────────────────────────────────

export async function updateUnitPosition(
  unitId: string,
  data: { latitude?: number; longitude?: number; mgrs?: string },
): Promise<MapUnit> {
  if (isDemoMode) {
    const unit = mockMapData.units.find((u) => u.unitId === unitId);
    if (!unit) throw new Error(`Unit ${unitId} not found`);
    if (data.latitude !== undefined) unit.latitude = data.latitude;
    if (data.longitude !== undefined) unit.longitude = data.longitude;
    if (data.mgrs !== undefined) unit.mgrs = data.mgrs;
    unit.lastUpdated = new Date().toISOString();
    persistMapData();
    return { ...unit };
  }
  const response = await apiClient.post<ApiResponse<MapUnit>>(
    `/map/units/${unitId}/position`,
    data,
  );
  return response.data.data;
}

// ── Supply Points CRUD ────────────────────────────────────────────────

export async function createSupplyPoint(
  data: Partial<MapSupplyPoint>,
): Promise<MapSupplyPoint> {
  if (isDemoMode) {
    const newPoint: MapSupplyPoint = {
      id: 'sp-new-' + Date.now(),
      name: data.name || 'New Supply Point',
      pointType: data.pointType || 'LOG_BASE',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      mgrs: data.mgrs,
      status: data.status || 'PLANNED',
      parentUnitName: data.parentUnitName || '',
      capacityNotes: data.capacityNotes || '',
    };
    mockMapData.supplyPoints.push(newPoint);
    persistMapData();
    return { ...newPoint };
  }
  const response = await apiClient.post<ApiResponse<MapSupplyPoint>>(
    '/map/supply-points',
    data,
  );
  return response.data.data;
}

export async function updateSupplyPoint(
  id: string,
  data: Partial<MapSupplyPoint>,
): Promise<MapSupplyPoint> {
  if (isDemoMode) {
    const idx = mockMapData.supplyPoints.findIndex((sp) => sp.id === id);
    if (idx === -1) throw new Error(`Supply point ${id} not found`);
    mockMapData.supplyPoints[idx] = { ...mockMapData.supplyPoints[idx], ...data };
    persistMapData();
    return { ...mockMapData.supplyPoints[idx] };
  }
  const response = await apiClient.put<ApiResponse<MapSupplyPoint>>(
    `/map/supply-points/${id}`,
    data,
  );
  return response.data.data;
}

export async function updateSupplyPointPosition(
  id: string,
  data: { latitude?: number; longitude?: number; mgrs?: string },
): Promise<MapSupplyPoint> {
  if (isDemoMode) {
    const sp = mockMapData.supplyPoints.find((s) => s.id === id);
    if (!sp) throw new Error(`Supply point ${id} not found`);
    if (data.latitude !== undefined) sp.latitude = data.latitude;
    if (data.longitude !== undefined) sp.longitude = data.longitude;
    if (data.mgrs !== undefined) sp.mgrs = data.mgrs;
    persistMapData();
    return { ...sp };
  }
  const response = await apiClient.put<ApiResponse<MapSupplyPoint>>(
    `/map/supply-points/${id}/position`,
    data,
  );
  return response.data.data;
}

export async function deleteSupplyPoint(id: string): Promise<void> {
  if (isDemoMode) {
    const idx = mockMapData.supplyPoints.findIndex((sp) => sp.id === id);
    if (idx !== -1) mockMapData.supplyPoints.splice(idx, 1);
    persistMapData();
    return;
  }
  await apiClient.delete(`/map/supply-points/${id}`);
}

// ── Routes CRUD ───────────────────────────────────────────────────────

export async function createRoute(
  data: Partial<MapRoute>,
): Promise<MapRoute> {
  if (isDemoMode) {
    const newRoute: MapRoute = {
      id: 'r-new-' + Date.now(),
      name: data.name || 'New Route',
      routeType: data.routeType || 'ASR',
      status: data.status || 'OPEN',
      waypoints: data.waypoints || [],
      description: data.description || '',
    };
    mockMapData.routes.push(newRoute);
    persistMapData();
    return { ...newRoute };
  }
  const response = await apiClient.post<ApiResponse<MapRoute>>(
    '/map/routes',
    data,
  );
  return response.data.data;
}

export async function updateRoute(
  id: string,
  data: Partial<MapRoute>,
): Promise<MapRoute> {
  if (isDemoMode) {
    const idx = mockMapData.routes.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Route ${id} not found`);
    mockMapData.routes[idx] = { ...mockMapData.routes[idx], ...data };
    persistMapData();
    return { ...mockMapData.routes[idx] };
  }
  const response = await apiClient.put<ApiResponse<MapRoute>>(
    `/map/routes/${id}`,
    data,
  );
  return response.data.data;
}

export async function deleteRoute(id: string): Promise<void> {
  if (isDemoMode) {
    const idx = mockMapData.routes.findIndex((r) => r.id === id);
    if (idx !== -1) mockMapData.routes.splice(idx, 1);
    persistMapData();
    return;
  }
  await apiClient.delete(`/map/routes/${id}`);
}

export async function uploadRouteFile(file: File): Promise<{ created_routes: number[]; count: number }> {
  if (isDemoMode) {
    // Simulate: add a dummy route
    const newRoute: MapRoute = {
      id: 'r-import-' + Date.now(),
      name: file.name.replace(/\.[^.]+$/, ''),
      routeType: 'ASR',
      status: 'OPEN',
      waypoints: [
        { lat: 33.30, lon: -117.30 },
        { lat: 33.32, lon: -117.32 },
      ],
      description: `Imported from ${file.name}`,
    };
    mockMapData.routes.push(newRoute);
    persistMapData();
    return { created_routes: [parseInt(newRoute.id.split('-')[2]) || 0], count: 1 };
  }
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<{ created_routes: number[]; count: number }>>('/ingestion/routes', formData);
  return response.data.data;
}

// ── Nearby Query ──────────────────────────────────────────────────────

export interface NearbyResult {
  units: MapUnit[];
  supplyPoints: MapSupplyPoint[];
  alerts: MapAlert[];
}

export async function getNearby(params: {
  lat?: number;
  lon?: number;
  mgrs?: string;
  radiusKm?: number;
}): Promise<NearbyResult> {
  if (isDemoMode) {
    const radiusKm = params.radiusKm ?? 10;
    const centerLat = params.lat ?? 33.3;
    const centerLon = params.lon ?? -117.35;

    // Approximate distance filter (1 degree lat ~ 111km)
    const degThreshold = radiusKm / 111;

    const units = mockMapData.units.filter(
      (u) =>
        Math.abs(u.latitude - centerLat) <= degThreshold &&
        Math.abs(u.longitude - centerLon) <= degThreshold,
    );
    const supplyPoints = mockMapData.supplyPoints.filter(
      (sp) =>
        Math.abs(sp.latitude - centerLat) <= degThreshold &&
        Math.abs(sp.longitude - centerLon) <= degThreshold,
    );
    const alerts = mockMapData.alerts.filter(
      (a) =>
        Math.abs(a.latitude - centerLat) <= degThreshold &&
        Math.abs(a.longitude - centerLon) <= degThreshold,
    );

    return { units, supplyPoints, alerts };
  }
  const response = await apiClient.get<ApiResponse<NearbyResult>>(
    '/map/nearby',
    { params },
  );
  return response.data.data;
}
