import apiClient from './client';
import { isDemoMode } from './mockClient';
import type { ApiResponse } from '@/lib/types';

// ── Map Types ──────────────────────────────────────────────────────────

export interface SupplyBreakdown {
  supply_class: string;
  name: string;
  percentage: number;
  dos: number;
  status: string;
}

export interface EquipmentSummary {
  type: string;
  mission_capable: number;
  total: number;
  readiness_pct: number;
}

export interface InboundConvoy {
  convoy_id: string;
  name: string;
  eta: string;
  status: string;
  cargo_summary: string;
}

export interface MapUnit {
  unit_id: string;
  name: string;
  abbreviation: string;
  echelon: string;
  latitude: number;
  longitude: number;
  supply_status: string;
  readiness_pct: number;
  worst_supply_class: string;
  worst_dos: number;
  symbol_sidc: string;
  position_source?: string;
  last_updated?: string;
  supply_breakdown?: SupplyBreakdown[];
  equipment_summary?: EquipmentSummary[];
  inbound_convoys?: InboundConvoy[];
}

export interface ConvoyEndpoint {
  name: string;
  lat: number;
  lon: number;
}

export interface MapConvoy {
  convoy_id: string;
  name: string;
  origin: ConvoyEndpoint;
  destination: ConvoyEndpoint;
  current_position: { lat: number; lon: number } | null;
  route_geometry: [number, number][];
  status: string;
  vehicle_count: number;
  cargo_summary: string;
  departure_time: string;
  eta: string;
  speed_kph: number;
  heading: number;
}

export interface MapSupplyPoint {
  id: string;
  name: string;
  point_type: string;
  latitude: number;
  longitude: number;
  status: string;
  parent_unit_name: string;
  capacity_notes: string;
}

export interface MapRoute {
  id: string;
  name: string;
  route_type: string;
  status: string;
  waypoints: [number, number][];
  description: string;
}

export interface MapAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  unit_name: string;
  latitude: number;
  longitude: number;
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
      unit_id: '1mef',
      name: 'I Marine Expeditionary Force',
      abbreviation: 'I MEF',
      echelon: 'MEF',
      latitude: 33.3,
      longitude: -117.35,
      supply_status: 'GREEN',
      readiness_pct: 92,
      worst_supply_class: 'V',
      worst_dos: 8,
      symbol_sidc: 'SFGPU-----G----',
      position_source: 'GCCS',
      last_updated: new Date(Date.now() - 300000).toISOString(),
      supply_breakdown: [
        { supply_class: 'I', name: 'Subsistence', percentage: 95, dos: 14, status: 'GREEN' },
        { supply_class: 'III', name: 'POL', percentage: 88, dos: 10, status: 'GREEN' },
        { supply_class: 'V', name: 'Ammunition', percentage: 72, dos: 8, status: 'AMBER' },
        { supply_class: 'VIII', name: 'Medical', percentage: 91, dos: 12, status: 'GREEN' },
        { supply_class: 'IX', name: 'Repair Parts', percentage: 78, dos: 9, status: 'AMBER' },
      ],
      equipment_summary: [
        { type: 'LAV-25', mission_capable: 42, total: 48, readiness_pct: 88 },
        { type: 'HMMWV', mission_capable: 180, total: 200, readiness_pct: 90 },
        { type: 'M1A1', mission_capable: 28, total: 32, readiness_pct: 88 },
      ],
      inbound_convoys: [
        {
          convoy_id: 'cv1',
          name: 'SUPPLY RUN ALPHA',
          eta: new Date(Date.now() + 7200000).toISOString(),
          status: 'EN_ROUTE',
          cargo_summary: 'CL I, CL III',
        },
      ],
    },
    {
      unit_id: '1mardiv',
      name: '1st Marine Division',
      abbreviation: '1 MARDIV',
      echelon: 'DIVISION',
      latitude: 33.31,
      longitude: -117.32,
      supply_status: 'AMBER',
      readiness_pct: 85,
      worst_supply_class: 'V',
      worst_dos: 5,
      symbol_sidc: 'SFGPU-----F----',
      position_source: 'GCCS',
      last_updated: new Date(Date.now() - 600000).toISOString(),
      supply_breakdown: [
        { supply_class: 'I', name: 'Subsistence', percentage: 90, dos: 12, status: 'GREEN' },
        { supply_class: 'III', name: 'POL', percentage: 75, dos: 7, status: 'AMBER' },
        { supply_class: 'V', name: 'Ammunition', percentage: 58, dos: 5, status: 'RED' },
        { supply_class: 'IX', name: 'Repair Parts', percentage: 68, dos: 6, status: 'AMBER' },
      ],
      equipment_summary: [
        { type: 'LAV-25', mission_capable: 36, total: 48, readiness_pct: 75 },
        { type: 'HMMWV', mission_capable: 155, total: 180, readiness_pct: 86 },
      ],
    },
    {
      unit_id: '1mar',
      name: '1st Marine Regiment',
      abbreviation: '1 MAR',
      echelon: 'REGIMENT',
      latitude: 33.28,
      longitude: -117.37,
      supply_status: 'GREEN',
      readiness_pct: 91,
      worst_supply_class: 'IX',
      worst_dos: 7,
      symbol_sidc: 'SFGPU-----E----',
      position_source: 'BFT',
      last_updated: new Date(Date.now() - 120000).toISOString(),
    },
    {
      unit_id: '1-1',
      name: '1st Battalion, 1st Marines',
      abbreviation: '1/1',
      echelon: 'BATTALION',
      latitude: 33.27,
      longitude: -117.34,
      supply_status: 'RED',
      readiness_pct: 68,
      worst_supply_class: 'V',
      worst_dos: 2,
      symbol_sidc: 'SFGPU-----D----',
      position_source: 'BFT',
      last_updated: new Date(Date.now() - 60000).toISOString(),
      supply_breakdown: [
        { supply_class: 'I', name: 'Subsistence', percentage: 82, dos: 8, status: 'GREEN' },
        { supply_class: 'III', name: 'POL', percentage: 55, dos: 4, status: 'AMBER' },
        { supply_class: 'V', name: 'Ammunition', percentage: 28, dos: 2, status: 'RED' },
        { supply_class: 'VIII', name: 'Medical', percentage: 70, dos: 6, status: 'AMBER' },
        { supply_class: 'IX', name: 'Repair Parts', percentage: 45, dos: 3, status: 'RED' },
      ],
      equipment_summary: [
        { type: 'LAV-25', mission_capable: 8, total: 14, readiness_pct: 57 },
        { type: 'HMMWV', mission_capable: 28, total: 40, readiness_pct: 70 },
      ],
      inbound_convoys: [
        {
          convoy_id: 'cv2',
          name: 'EMERGENCY RESUPPLY',
          eta: new Date(Date.now() + 3600000).toISOString(),
          status: 'EN_ROUTE',
          cargo_summary: 'CL V (Priority)',
        },
      ],
    },
    {
      unit_id: '2-1',
      name: '2nd Battalion, 1st Marines',
      abbreviation: '2/1',
      echelon: 'BATTALION',
      latitude: 33.26,
      longitude: -117.39,
      supply_status: 'AMBER',
      readiness_pct: 79,
      worst_supply_class: 'III',
      worst_dos: 5,
      symbol_sidc: 'SFGPU-----D----',
      position_source: 'BFT',
      last_updated: new Date(Date.now() - 180000).toISOString(),
    },
  ],
  convoys: [
    {
      convoy_id: 'cv1',
      name: 'SUPPLY RUN ALPHA',
      origin: { name: 'LOG BASE CHARLIE', lat: 33.35, lon: -117.30 },
      destination: { name: 'I MEF HQ', lat: 33.30, lon: -117.35 },
      current_position: { lat: 33.33, lon: -117.32 },
      route_geometry: [
        [33.35, -117.30],
        [33.34, -117.31],
        [33.33, -117.32],
        [33.32, -117.33],
        [33.31, -117.34],
        [33.30, -117.35],
      ],
      status: 'EN_ROUTE',
      vehicle_count: 12,
      cargo_summary: 'CL I: 20T, CL III: 5000 GAL',
      departure_time: new Date(Date.now() - 3600000).toISOString(),
      eta: new Date(Date.now() + 3600000).toISOString(),
      speed_kph: 35,
      heading: 225,
    },
    {
      convoy_id: 'cv2',
      name: 'EMERGENCY RESUPPLY',
      origin: { name: 'ASP BRAVO', lat: 33.32, lon: -117.28 },
      destination: { name: '1/1 BN CP', lat: 33.27, lon: -117.34 },
      current_position: { lat: 33.30, lon: -117.30 },
      route_geometry: [
        [33.32, -117.28],
        [33.31, -117.29],
        [33.30, -117.30],
        [33.29, -117.31],
        [33.28, -117.32],
        [33.27, -117.34],
      ],
      status: 'EN_ROUTE',
      vehicle_count: 6,
      cargo_summary: 'CL V: 15T (PRIORITY)',
      departure_time: new Date(Date.now() - 1800000).toISOString(),
      eta: new Date(Date.now() + 1800000).toISOString(),
      speed_kph: 45,
      heading: 210,
    },
    {
      convoy_id: 'cv3',
      name: 'ROUTINE SUPPLY BRAVO',
      origin: { name: 'DEPOT ALPHA', lat: 33.36, lon: -117.25 },
      destination: { name: '2/1 BN CP', lat: 33.26, lon: -117.39 },
      current_position: null,
      route_geometry: [
        [33.36, -117.25],
        [33.34, -117.28],
        [33.32, -117.31],
        [33.29, -117.35],
        [33.26, -117.39],
      ],
      status: 'PLANNED',
      vehicle_count: 8,
      cargo_summary: 'CL I, CL III, CL IX',
      departure_time: new Date(Date.now() + 14400000).toISOString(),
      eta: new Date(Date.now() + 21600000).toISOString(),
      speed_kph: 0,
      heading: 0,
    },
  ],
  supplyPoints: [
    {
      id: 'sp1',
      name: 'LOG BASE CHARLIE',
      point_type: 'LOG_BASE',
      latitude: 33.35,
      longitude: -117.30,
      status: 'ACTIVE',
      parent_unit_name: 'CLR-1',
      capacity_notes: 'Full capacity, 3-day surge stock',
    },
    {
      id: 'sp2',
      name: 'ASP BRAVO',
      point_type: 'AMMO_SUPPLY_POINT',
      latitude: 33.32,
      longitude: -117.28,
      status: 'ACTIVE',
      parent_unit_name: '1st EOD Co',
      capacity_notes: 'CL V primary distribution',
    },
    {
      id: 'sp3',
      name: 'FARP DELTA',
      point_type: 'FARP',
      latitude: 33.29,
      longitude: -117.40,
      status: 'ACTIVE',
      parent_unit_name: 'HMLA-367',
      capacity_notes: 'JP-5, 10K gal capacity',
    },
    {
      id: 'sp4',
      name: 'LZ EAGLE',
      point_type: 'LZ',
      latitude: 33.25,
      longitude: -117.36,
      status: 'PLANNED',
      parent_unit_name: '1/1 BN',
      capacity_notes: 'Emergency resupply LZ, CH-53 capable',
    },
    {
      id: 'sp5',
      name: 'WATER POINT 3',
      point_type: 'WATER_POINT',
      latitude: 33.28,
      longitude: -117.33,
      status: 'ACTIVE',
      parent_unit_name: '7th ESB',
      capacity_notes: 'ROWPU operational, 20K gal/day',
    },
  ],
  routes: [
    {
      id: 'r1',
      name: 'MSR TAMPA',
      route_type: 'MSR',
      status: 'OPEN',
      waypoints: [
        [33.36, -117.25],
        [33.34, -117.28],
        [33.32, -117.31],
        [33.30, -117.34],
        [33.28, -117.37],
        [33.26, -117.40],
      ],
      description: 'Main supply route, Camp Pendleton N-S axis',
    },
    {
      id: 'r2',
      name: 'ASR LION',
      route_type: 'ASR',
      status: 'OPEN',
      waypoints: [
        [33.30, -117.25],
        [33.30, -117.28],
        [33.30, -117.31],
        [33.30, -117.34],
        [33.30, -117.37],
        [33.30, -117.40],
      ],
      description: 'Alternate E-W supply route',
    },
    {
      id: 'r3',
      name: 'ASR TIGER',
      route_type: 'ASR',
      status: 'RESTRICTED',
      waypoints: [
        [33.35, -117.35],
        [33.33, -117.35],
        [33.31, -117.36],
        [33.29, -117.37],
        [33.27, -117.38],
      ],
      description: 'Secondary route, restricted due to construction',
    },
  ],
  alerts: [
    {
      id: 'a1',
      alert_type: 'SUPPLY_CRITICAL',
      severity: 'CRITICAL',
      message: '1/1 BN CL V at 28% - 2 DOS remaining',
      unit_name: '1/1',
      latitude: 33.27,
      longitude: -117.34,
    },
    {
      id: 'a2',
      alert_type: 'EQUIPMENT_DOWN',
      severity: 'WARNING',
      message: '1 MARDIV LAV-25 readiness below 80%',
      unit_name: '1 MARDIV',
      latitude: 33.31,
      longitude: -117.32,
    },
    {
      id: 'a3',
      alert_type: 'MOVEMENT_DELAYED',
      severity: 'WARNING',
      message: 'ASR TIGER restricted - alternate routing in effect',
      unit_name: '',
      latitude: 33.31,
      longitude: -117.36,
    },
  ],
};

// ── API Functions ──────────────────────────────────────────────────────

export async function getMapData(): Promise<MapData> {
  if (isDemoMode) return mockMapData;
  const response = await apiClient.get<ApiResponse<MapData>>('/map/data');
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
