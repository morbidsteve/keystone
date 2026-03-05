// =============================================================================
// KEYSTONE Transportation & Movement Expansion — API functions
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';
import type {
  ConvoyPlan,
  ConvoySerial,
  MarchTableData,
  LiftRequest,
  Movement,
  MovementHistoryRecord,
  LocationInventoryItem,
} from '@/lib/types';
import { MovementStatus } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helper: date string N days ago (ISO short form)
// ---------------------------------------------------------------------------

function dateStr(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split('T')[0];
}

function isoStr(daysBack: number, hoursOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
}

function futureIso(daysAhead: number, hoursOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Mock delay
// ---------------------------------------------------------------------------

const mockDelay = (ms = 150 + Math.random() * 150): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Mock Convoy Serials factory
// ---------------------------------------------------------------------------

function makeSerial(
  id: number,
  planId: number,
  serialNum: string,
  order: number,
  opts: Partial<ConvoySerial> = {},
): ConvoySerial {
  return {
    id,
    convoy_plan_id: planId,
    serial_number: serialNum,
    serial_commander_id: opts.serial_commander_id ?? null,
    serial_commander_name: opts.serial_commander_name,
    vehicle_count: opts.vehicle_count ?? 6,
    pax_count: opts.pax_count ?? 24,
    march_order: order,
    march_speed_kph: opts.march_speed_kph ?? 40,
    catch_up_speed_kph: opts.catch_up_speed_kph ?? 56,
    interval_meters: opts.interval_meters ?? 100,
    created_at: isoStr(5),
  };
}

// ---------------------------------------------------------------------------
// Mock Convoy Plan Data — 8 items
// ---------------------------------------------------------------------------

const MOCK_CONVOY_PLANS: ConvoyPlan[] = [
  {
    id: 1,
    name: 'IRON HAWK RESUPPLY',
    unit_id: 4,
    created_by: 5,
    status: 'DRAFT',
    route_name: 'MSR EAGLE',
    route_description: 'Camp Lejeune to Fort Liberty via US-17 / I-95',
    total_distance_km: 210,
    estimated_duration_hours: 5.5,
    route_primary: 'US-17 N to I-95 N, Exit 56B to Reilly Rd',
    route_alternate: 'US-421 N to NC-87 N, approach via Bragg Blvd',
    departure_time_planned: futureIso(2, 6),
    sp_time: futureIso(2, 6),
    rp_time: futureIso(2, 12),
    brief_time: futureIso(2, 4),
    rehearsal_time: futureIso(1, 8),
    movement_credit_number: null,
    convoy_commander_id: 5,
    risk_assessment_level: 'MEDIUM',
    comm_plan: 'Primary: BN TAC 1 (36.600 MHz). Alternate: BN CMD (46.200 MHz). Contingency: Cell phone roster.',
    recovery_plan: 'Lead vehicle carries tow bar. Recovery team staged at midpoint (Fayetteville). Contact MTM at (910) 555-0142.',
    medevac_plan: 'Route to nearest MTF. Primary: Naval Medical Center Camp Lejeune (first half). Womack AMC (second half). Corpsman in Serial 1.',
    created_at: isoStr(3),
    updated_at: isoStr(1),
    serials: [
      makeSerial(1, 1, 'S-1', 1, { serial_commander_name: 'SSgt Martinez', vehicle_count: 8, pax_count: 32 }),
      makeSerial(2, 1, 'S-2', 2, { serial_commander_name: 'Sgt Williams', vehicle_count: 6, pax_count: 24 }),
      makeSerial(3, 1, 'S-3', 3, { serial_commander_name: 'Cpl Johnson', vehicle_count: 4, pax_count: 16 }),
    ],
  },
  {
    id: 2,
    name: 'DESERT VIPER MOVEMENT',
    unit_id: 5,
    created_by: 8,
    status: 'DRAFT',
    route_name: 'MSR CONDOR',
    route_description: 'Camp Pendleton to MCAGCC 29 Palms via I-15 / CA-247',
    total_distance_km: 245,
    estimated_duration_hours: 6.0,
    route_primary: 'I-15 N to CA-247 E via Barstow, approach Gate 1',
    route_alternate: 'CA-79 N to I-10 E, north on CA-62',
    departure_time_planned: futureIso(5, 5),
    sp_time: futureIso(5, 5),
    rp_time: futureIso(5, 11),
    brief_time: futureIso(5, 3),
    rehearsal_time: futureIso(4, 10),
    movement_credit_number: 'MCN-2026-0034',
    convoy_commander_id: 8,
    risk_assessment_level: 'HIGH',
    comm_plan: 'Primary: Regt TAC (42.350 MHz). SATCOM backup on channel 7.',
    recovery_plan: 'Recovery section trails Serial 2. Civilian tow contract via MARCORLOGCOM on standby.',
    medevac_plan: 'CASEVAC to NHCP (first leg) or Robert E. Bush NMCSD. Air MEDEVAC request via Regt S-3.',
    created_at: isoStr(5),
    updated_at: isoStr(2),
    serials: [
      makeSerial(4, 2, 'S-1', 1, { serial_commander_name: 'GySgt Thompson', vehicle_count: 10, pax_count: 40 }),
      makeSerial(5, 2, 'S-2', 2, { serial_commander_name: 'SSgt Kim', vehicle_count: 8, pax_count: 32 }),
    ],
  },
  {
    id: 3,
    name: 'ROLLING THUNDER AMMO HAUL',
    unit_id: 4,
    created_by: 10,
    status: 'DRAFT',
    route_name: 'ASR DELTA',
    route_description: 'Camp Lejeune ASP to G-10 Range Complex',
    total_distance_km: 35,
    estimated_duration_hours: 1.5,
    route_primary: 'Sneads Ferry Rd to Range Rd, north to G-10 ASP',
    route_alternate: 'Piney Green Rd to Verona Loop Rd',
    departure_time_planned: futureIso(3, 7),
    sp_time: futureIso(3, 7),
    rp_time: futureIso(3, 9),
    brief_time: futureIso(3, 6),
    rehearsal_time: null,
    movement_credit_number: null,
    convoy_commander_id: 10,
    risk_assessment_level: 'HIGH',
    comm_plan: 'BN TAC 1. Report at each checkpoint.',
    recovery_plan: 'Recovery vehicle in trail. No civilian tow for Class V cargo.',
    medevac_plan: 'BAS on standby at G-10. Corpsman rides in lead vehicle.',
    created_at: isoStr(2),
    updated_at: isoStr(1),
    serials: [
      makeSerial(6, 3, 'S-1', 1, { serial_commander_name: 'SSgt Martinez', vehicle_count: 4, pax_count: 12 }),
      makeSerial(7, 3, 'S-2', 2, { serial_commander_name: 'Sgt Davis', vehicle_count: 3, pax_count: 9 }),
    ],
  },
  {
    id: 4,
    name: 'STEEL RAIN DEPLOY',
    unit_id: 4,
    created_by: 5,
    status: 'APPROVED',
    route_name: 'MSR TITAN',
    route_description: 'Camp Lejeune to Ft. Stewart via I-95 S / I-16',
    total_distance_km: 560,
    estimated_duration_hours: 12.0,
    route_primary: 'I-95 S to I-16 W to Ft. Stewart Gate 1',
    route_alternate: 'US-17 S through Savannah',
    departure_time_planned: futureIso(7, 4),
    sp_time: futureIso(7, 4),
    rp_time: futureIso(7, 16),
    brief_time: futureIso(7, 2),
    rehearsal_time: futureIso(6, 8),
    movement_credit_number: 'MCN-2026-0041',
    convoy_commander_id: 5,
    risk_assessment_level: 'MEDIUM',
    comm_plan: 'Primary: BN CMD. Secondary: Cell phone roster. SITREP every 2 hours.',
    recovery_plan: 'Recovery vehicle trails each serial. Rest halt at Walterboro SC (4 hr mark).',
    medevac_plan: 'Route to nearest civilian ER for first 6 hours. Winn AMC at Ft. Stewart for final leg.',
    created_at: isoStr(10),
    updated_at: isoStr(3),
    serials: [
      makeSerial(8, 4, 'S-1', 1, { serial_commander_name: 'SSgt Martinez', vehicle_count: 12, pax_count: 48 }),
      makeSerial(9, 4, 'S-2', 2, { serial_commander_name: 'GySgt Thompson', vehicle_count: 10, pax_count: 40 }),
      makeSerial(10, 4, 'S-3', 3, { serial_commander_name: 'Sgt Williams', vehicle_count: 8, pax_count: 32 }),
    ],
  },
  {
    id: 5,
    name: 'PHOENIX RELAY',
    unit_id: 5,
    created_by: 8,
    status: 'APPROVED',
    route_name: 'MSR PHOENIX',
    route_description: 'MCAS Miramar to Camp Pendleton',
    total_distance_km: 65,
    estimated_duration_hours: 2.0,
    route_primary: 'I-15 N to I-5 N, exit Las Pulgas Rd',
    route_alternate: 'Miramar Rd to Oceanside via US-101',
    departure_time_planned: futureIso(1, 8),
    sp_time: futureIso(1, 8),
    rp_time: futureIso(1, 10),
    brief_time: futureIso(1, 7),
    rehearsal_time: null,
    movement_credit_number: null,
    convoy_commander_id: 8,
    risk_assessment_level: 'LOW',
    comm_plan: 'Cell phone roster. Primary freq: Co TAC.',
    recovery_plan: 'Tow vehicle in trail serial.',
    medevac_plan: 'NHCP emergency room. Corpsman in lead vehicle.',
    created_at: isoStr(4),
    updated_at: isoStr(1),
    serials: [
      makeSerial(11, 5, 'S-1', 1, { serial_commander_name: 'SSgt Kim', vehicle_count: 5, pax_count: 20 }),
      makeSerial(12, 5, 'S-2', 2, { serial_commander_name: 'Cpl Nguyen', vehicle_count: 4, pax_count: 16 }),
    ],
  },
  {
    id: 6,
    name: 'TRIDENT PUSH',
    unit_id: 4,
    created_by: 5,
    status: 'EXECUTING',
    route_name: 'MSR TRIDENT',
    route_description: 'Camp Lejeune to MCB Quantico via I-95 N',
    total_distance_km: 470,
    estimated_duration_hours: 10.0,
    route_primary: 'I-95 N direct to MCB Quantico Gate 2',
    route_alternate: 'US-17 N to I-64 E to I-95 N',
    departure_time_planned: isoStr(0, -4),
    sp_time: isoStr(0, -4),
    rp_time: futureIso(0, 6),
    brief_time: isoStr(0, -6),
    rehearsal_time: isoStr(1, 8),
    movement_credit_number: 'MCN-2026-0039',
    convoy_commander_id: 5,
    risk_assessment_level: 'MEDIUM',
    comm_plan: 'BN TAC 1 primary. SATCOM as backup. SITREP at each checkpoint.',
    recovery_plan: 'Recovery section in Serial 2 trail. Tow bar in each serial lead.',
    medevac_plan: 'Nearest civilian ER en route. Navy Medicine at Quantico for final approach.',
    created_at: isoStr(14),
    updated_at: isoStr(0),
    serials: [
      makeSerial(13, 6, 'S-1', 1, { serial_commander_name: 'SSgt Martinez', vehicle_count: 7, pax_count: 28 }),
      makeSerial(14, 6, 'S-2', 2, { serial_commander_name: 'Sgt Williams', vehicle_count: 6, pax_count: 24 }),
    ],
  },
  {
    id: 7,
    name: 'LONGBOW RETURN',
    unit_id: 5,
    created_by: 8,
    status: 'COMPLETE',
    route_name: 'MSR LONGBOW',
    route_description: '29 Palms MCAGCC to Camp Pendleton return',
    total_distance_km: 245,
    estimated_duration_hours: 6.0,
    route_primary: 'CA-247 W to I-15 S to I-5 S',
    route_alternate: 'CA-62 S to I-10 W to CA-79 S',
    departure_time_planned: isoStr(5, 5),
    sp_time: isoStr(5, 5),
    rp_time: isoStr(5, 11),
    brief_time: isoStr(5, 3),
    rehearsal_time: isoStr(6, 10),
    movement_credit_number: 'MCN-2026-0028',
    convoy_commander_id: 8,
    risk_assessment_level: 'MEDIUM',
    comm_plan: 'Regt TAC primary. Cell phone backup.',
    recovery_plan: 'Recovery vehicle trailed Serial 1. No breakdowns occurred.',
    medevac_plan: 'Standard desert MEDEVAC plan. No incidents.',
    created_at: isoStr(20),
    updated_at: isoStr(5),
    serials: [
      makeSerial(15, 7, 'S-1', 1, { serial_commander_name: 'GySgt Thompson', vehicle_count: 8, pax_count: 32 }),
      makeSerial(16, 7, 'S-2', 2, { serial_commander_name: 'SSgt Kim', vehicle_count: 6, pax_count: 24 }),
    ],
  },
  {
    id: 8,
    name: 'CANCELED MAINTENANCE MOVE',
    unit_id: 4,
    created_by: 10,
    status: 'CANCELED',
    route_name: 'ASR BRAVO',
    route_description: 'Camp Lejeune Motor-T to 2nd MLG maintenance bay',
    total_distance_km: 12,
    estimated_duration_hours: 0.5,
    route_primary: 'Holcomb Blvd to 2nd MLG compound',
    route_alternate: null,
    departure_time_planned: isoStr(8, 7),
    sp_time: isoStr(8, 7),
    rp_time: isoStr(8, 8),
    brief_time: null,
    rehearsal_time: null,
    movement_credit_number: null,
    convoy_commander_id: 10,
    risk_assessment_level: 'LOW',
    comm_plan: 'Cell phone.',
    recovery_plan: 'N/A — short distance.',
    medevac_plan: 'Naval Medical Center Camp Lejeune.',
    created_at: isoStr(12),
    updated_at: isoStr(8),
    serials: [
      makeSerial(17, 8, 'S-1', 1, { serial_commander_name: 'Cpl Johnson', vehicle_count: 3, pax_count: 6 }),
    ],
  },
];

// ---------------------------------------------------------------------------
// Mock Lift Request Data — 10 items
// ---------------------------------------------------------------------------

const MOCK_LIFT_REQUESTS: LiftRequest[] = [
  {
    id: 1,
    requesting_unit_id: 4,
    requesting_unit_name: '1/1 Marines',
    supporting_unit_id: null,
    cargo_type: 'SUPPLY',
    cargo_description: 'Class I resupply — 120 cases MRE, 50 cases water',
    weight_lbs: 8400,
    cube_ft: 320,
    pax_count: 0,
    hazmat: false,
    priority: 'ROUTINE',
    required_delivery_date: futureIso(5).split('T')[0],
    status: 'REQUESTED',
    pickup_location: 'Camp Lejeune LSA',
    pickup_lat: 34.62,
    pickup_lon: -77.36,
    delivery_location: 'FOB Raider, Camp Lejeune',
    delivery_lat: 34.65,
    delivery_lon: -77.32,
    assigned_movement_id: null,
    created_at: isoStr(2),
    updated_at: isoStr(2),
  },
  {
    id: 2,
    requesting_unit_id: 5,
    requesting_unit_name: '2/1 Marines',
    supporting_unit_id: null,
    cargo_type: 'EQUIPMENT',
    cargo_description: '4x HMMWV NMC vehicles for IMA repair',
    weight_lbs: 48000,
    cube_ft: null,
    pax_count: 0,
    hazmat: false,
    priority: 'PRIORITY',
    required_delivery_date: futureIso(3).split('T')[0],
    status: 'REQUESTED',
    pickup_location: 'Camp Pendleton Motor-T',
    pickup_lat: 33.30,
    pickup_lon: -117.35,
    delivery_location: 'MCRD San Diego Maint Bay',
    delivery_lat: 32.74,
    delivery_lon: -117.20,
    assigned_movement_id: null,
    created_at: isoStr(1),
    updated_at: isoStr(1),
  },
  {
    id: 3,
    requesting_unit_id: 4,
    requesting_unit_name: '1/1 Marines',
    supporting_unit_id: 6,
    supporting_unit_name: 'CLB-1',
    cargo_type: 'MIXED',
    cargo_description: 'Class V push package + 2 replacement M240Bs',
    weight_lbs: 6200,
    cube_ft: 180,
    pax_count: 4,
    hazmat: true,
    priority: 'EMERGENCY',
    required_delivery_date: futureIso(1).split('T')[0],
    status: 'APPROVED',
    pickup_location: 'Camp Lejeune ASP',
    pickup_lat: 34.60,
    pickup_lon: -77.38,
    delivery_location: 'SR-10 Range Complex',
    delivery_lat: 34.68,
    delivery_lon: -77.28,
    assigned_movement_id: null,
    created_at: isoStr(1),
    updated_at: isoStr(0),
  },
  {
    id: 4,
    requesting_unit_id: 5,
    requesting_unit_name: '2/1 Marines',
    supporting_unit_id: 6,
    supporting_unit_name: 'CLB-1',
    cargo_type: 'PERSONNEL',
    cargo_description: 'Advance party for ITX rotation',
    weight_lbs: null,
    cube_ft: null,
    pax_count: 35,
    hazmat: false,
    priority: 'PRIORITY',
    required_delivery_date: futureIso(4).split('T')[0],
    status: 'APPROVED',
    pickup_location: 'Camp Pendleton Mainside',
    pickup_lat: 33.30,
    pickup_lon: -117.35,
    delivery_location: 'MCAGCC 29 Palms',
    delivery_lat: 34.23,
    delivery_lon: -116.05,
    assigned_movement_id: null,
    created_at: isoStr(3),
    updated_at: isoStr(1),
  },
  {
    id: 5,
    requesting_unit_id: 4,
    requesting_unit_name: '1/1 Marines',
    supporting_unit_id: 6,
    supporting_unit_name: 'CLB-1',
    cargo_type: 'SUPPLY',
    cargo_description: 'Class III bulk fuel — 2000 gal JP-8',
    weight_lbs: 13600,
    cube_ft: null,
    pax_count: 0,
    hazmat: true,
    priority: 'PRIORITY',
    required_delivery_date: futureIso(2).split('T')[0],
    status: 'SCHEDULED',
    pickup_location: 'Camp Lejeune Fuel Farm',
    pickup_lat: 34.62,
    pickup_lon: -77.36,
    delivery_location: 'LZ Bluebird, Camp Lejeune',
    delivery_lat: 34.70,
    delivery_lon: -77.25,
    assigned_movement_id: null,
    created_at: isoStr(4),
    updated_at: isoStr(1),
  },
  {
    id: 6,
    requesting_unit_id: 5,
    requesting_unit_name: '2/1 Marines',
    supporting_unit_id: 6,
    supporting_unit_name: 'CLB-1',
    cargo_type: 'EQUIPMENT',
    cargo_description: '2x MTVR 7-ton trucks for engineer support',
    weight_lbs: 66000,
    cube_ft: null,
    pax_count: 4,
    hazmat: false,
    priority: 'ROUTINE',
    required_delivery_date: futureIso(6).split('T')[0],
    status: 'SCHEDULED',
    pickup_location: 'CLB-1 Motor Pool',
    pickup_lat: 33.31,
    pickup_lon: -117.34,
    delivery_location: 'Camp Pendleton Training Area 52',
    delivery_lat: 33.38,
    delivery_lon: -117.42,
    assigned_movement_id: null,
    created_at: isoStr(5),
    updated_at: isoStr(2),
  },
  {
    id: 7,
    requesting_unit_id: 4,
    requesting_unit_name: '1/1 Marines',
    supporting_unit_id: 6,
    supporting_unit_name: 'CLB-1',
    cargo_type: 'MIXED',
    cargo_description: 'FEX resupply — rations, water, Class IX parts',
    weight_lbs: 12000,
    cube_ft: 480,
    pax_count: 8,
    hazmat: false,
    priority: 'ROUTINE',
    required_delivery_date: isoStr(0).split('T')[0],
    status: 'IN_TRANSIT',
    pickup_location: 'Camp Lejeune LSA',
    pickup_lat: 34.62,
    pickup_lon: -77.36,
    delivery_location: 'Tactical Assembly Area Hawk',
    delivery_lat: 34.67,
    delivery_lon: -77.30,
    assigned_movement_id: null,
    created_at: isoStr(3),
    updated_at: isoStr(0),
  },
  {
    id: 8,
    requesting_unit_id: 5,
    requesting_unit_name: '2/1 Marines',
    supporting_unit_id: 6,
    supporting_unit_name: 'CLB-1',
    cargo_type: 'SUPPLY',
    cargo_description: 'Class VIII medical resupply for BAS',
    weight_lbs: 2400,
    cube_ft: 96,
    pax_count: 0,
    hazmat: false,
    priority: 'EMERGENCY',
    required_delivery_date: isoStr(1).split('T')[0],
    status: 'DELIVERED',
    pickup_location: 'NHCP Pharmacy',
    pickup_lat: 32.87,
    pickup_lon: -117.14,
    delivery_location: 'Camp Pendleton BAS',
    delivery_lat: 33.30,
    delivery_lon: -117.35,
    assigned_movement_id: null,
    created_at: isoStr(4),
    updated_at: isoStr(1),
  },
  {
    id: 9,
    requesting_unit_id: 4,
    requesting_unit_name: '1/1 Marines',
    supporting_unit_id: null,
    cargo_type: 'PERSONNEL',
    cargo_description: 'Range detail return transport — 40 PAX',
    weight_lbs: null,
    cube_ft: null,
    pax_count: 40,
    hazmat: false,
    priority: 'ROUTINE',
    required_delivery_date: isoStr(3).split('T')[0],
    status: 'DELIVERED',
    pickup_location: 'SR-10 Range Complex',
    pickup_lat: 34.68,
    pickup_lon: -77.28,
    delivery_location: 'BEQ Bldg 1372',
    delivery_lat: 34.62,
    delivery_lon: -77.36,
    assigned_movement_id: null,
    created_at: isoStr(5),
    updated_at: isoStr(3),
  },
  {
    id: 10,
    requesting_unit_id: 5,
    requesting_unit_name: '2/1 Marines',
    supporting_unit_id: null,
    cargo_type: 'EQUIPMENT',
    cargo_description: 'Generator set MEP-803A for field CP',
    weight_lbs: 3200,
    cube_ft: 64,
    pax_count: 0,
    hazmat: false,
    priority: 'PRIORITY',
    required_delivery_date: futureIso(2).split('T')[0],
    status: 'CANCELED',
    pickup_location: 'Camp Pendleton CEB Yard',
    pickup_lat: 33.31,
    pickup_lon: -117.34,
    delivery_location: 'Camp Pendleton Training Area 62',
    delivery_lat: 33.40,
    delivery_lon: -117.45,
    assigned_movement_id: null,
    created_at: isoStr(6),
    updated_at: isoStr(2),
  },
];

// ---------------------------------------------------------------------------
// Mock March Table Data
// ---------------------------------------------------------------------------

const MOCK_MARCH_TABLE: MarchTableData = {
  sp_time: futureIso(2, 6),
  rp_time: futureIso(2, 12),
  checkpoints: [
    { name: 'SP — Main Gate CL', distance_km: 0, cumulative_distance_km: 0, time: futureIso(2, 6), speed_kph: 0 },
    { name: 'CP 1 — Jacksonville', distance_km: 18, cumulative_distance_km: 18, time: futureIso(2, 6.5), speed_kph: 40 },
    { name: 'CP 2 — I-95 On-Ramp', distance_km: 22, cumulative_distance_km: 40, time: futureIso(2, 7), speed_kph: 45 },
    { name: 'CP 3 — Smithfield Rest Area', distance_km: 55, cumulative_distance_km: 95, time: futureIso(2, 8.25), speed_kph: 55 },
    { name: 'HALT — Dunn Rest Stop', distance_km: 30, cumulative_distance_km: 125, time: futureIso(2, 8.75), speed_kph: 55 },
    { name: 'CP 4 — Fayetteville Exit', distance_km: 45, cumulative_distance_km: 170, time: futureIso(2, 10), speed_kph: 50 },
    { name: 'CP 5 — Reilly Rd Gate', distance_km: 30, cumulative_distance_km: 200, time: futureIso(2, 11), speed_kph: 45 },
    { name: 'RP — Ft Liberty Motor Pool', distance_km: 10, cumulative_distance_km: 210, time: futureIso(2, 12), speed_kph: 30 },
  ],
  total_distance_km: 210,
  total_duration_hours: 5.5,
  march_speed_kph: 40,
  catch_up_speed_kph: 56,
  fuel_estimate: {
    total_gallons: 540,
    total_liters: 2044,
    per_vehicle_gallons: 30,
  },
};

// ---------------------------------------------------------------------------
// Mock Movement History — 6 records
// ---------------------------------------------------------------------------

const MOCK_MOVEMENT_HISTORY: MovementHistoryRecord[] = [
  {
    id: 1,
    convoy_id: 'CVY-2026-001',
    origin: 'Camp Lejeune',
    destination: 'Fort Liberty',
    departure_time: isoStr(15, 6),
    eta: isoStr(15, 12),
    actual_arrival: isoStr(15, 11.5),
    vehicle_count: 18,
    cargo_description: 'Class I/III resupply + 72 PAX',
    status: 'ARRIVED',
    on_time: true,
    duration_hours: 5.5,
    average_speed_kph: 38,
    convoy_plan_name: 'IRON HAWK RESUPPLY',
  },
  {
    id: 2,
    convoy_id: 'CVY-2026-002',
    origin: 'Camp Pendleton',
    destination: 'MCAGCC 29 Palms',
    departure_time: isoStr(12, 5),
    eta: isoStr(12, 11),
    actual_arrival: isoStr(12, 12.5),
    vehicle_count: 22,
    cargo_description: 'Full battalion equipment + 80 PAX',
    status: 'ARRIVED',
    on_time: false,
    duration_hours: 7.5,
    average_speed_kph: 33,
    convoy_plan_name: 'DESERT VIPER MOVEMENT',
  },
  {
    id: 3,
    convoy_id: 'CVY-2026-003',
    origin: 'Camp Lejeune ASP',
    destination: 'G-10 Range Complex',
    departure_time: isoStr(10, 7),
    eta: isoStr(10, 8.5),
    actual_arrival: isoStr(10, 8.25),
    vehicle_count: 7,
    cargo_description: 'Class V ammo push — 5.56mm, 7.62mm, 40mm',
    status: 'ARRIVED',
    on_time: true,
    duration_hours: 1.25,
    average_speed_kph: 28,
    convoy_plan_name: 'ROLLING THUNDER AMMO HAUL',
  },
  {
    id: 4,
    convoy_id: 'CVY-2026-004',
    origin: 'MCAS Miramar',
    destination: 'Camp Pendleton',
    departure_time: isoStr(8, 8),
    eta: isoStr(8, 10),
    actual_arrival: isoStr(8, 9.75),
    vehicle_count: 9,
    cargo_description: 'Aviation support equipment + 36 PAX',
    status: 'ARRIVED',
    on_time: true,
    duration_hours: 1.75,
    average_speed_kph: 37,
    convoy_plan_name: 'PHOENIX RELAY',
  },
  {
    id: 5,
    convoy_id: 'CVY-2026-005',
    origin: '29 Palms MCAGCC',
    destination: 'Camp Pendleton',
    departure_time: isoStr(5, 5),
    eta: isoStr(5, 11),
    actual_arrival: isoStr(5, 11.25),
    vehicle_count: 14,
    cargo_description: 'ITX return movement — vehicles + 56 PAX',
    status: 'ARRIVED',
    on_time: true,
    duration_hours: 6.25,
    average_speed_kph: 39,
    convoy_plan_name: 'LONGBOW RETURN',
  },
  {
    id: 6,
    convoy_id: 'CVY-2026-006',
    origin: 'Camp Lejeune',
    destination: 'MCB Quantico',
    departure_time: isoStr(20, 4),
    eta: isoStr(20, 14),
    actual_arrival: isoStr(20, 15.5),
    vehicle_count: 16,
    cargo_description: 'Equipment transfer + 48 PAX',
    status: 'ARRIVED',
    on_time: false,
    duration_hours: 11.5,
    average_speed_kph: 41,
    convoy_plan_name: 'TRIDENT PUSH',
  },
];

// ---------------------------------------------------------------------------
// Mock Active Movements (EN_ROUTE / DELAYED)
// ---------------------------------------------------------------------------

const MOCK_ACTIVE_MOVEMENTS: Movement[] = [
  {
    id: 'mov-active-1',
    name: 'TRIDENT PUSH Serial 1',
    originUnit: 'Camp Lejeune',
    destinationUnit: 'MCB Quantico',
    status: MovementStatus.EN_ROUTE,
    cargo: 'Equipment + 28 PAX',
    priority: 'PRIORITY',
    departureTime: isoStr(0, -4),
    eta: futureIso(0, 6),
    vehicles: 7,
    personnel: 28,
    notes: 'Currently passing CP 3 — Richmond VA area',
    routeWaypoints: [
      { lat: 34.62, lon: -77.36, label: 'SP Camp Lejeune' },
      { lat: 37.54, lon: -77.43, label: 'CP 3 Richmond' },
      { lat: 38.52, lon: -77.30, label: 'RP Quantico' },
    ],
    lastUpdated: isoStr(0),
    originCoords: { lat: 34.62, lon: -77.36 },
    destinationCoords: { lat: 38.52, lon: -77.30 },
  },
  {
    id: 'mov-active-2',
    name: 'TRIDENT PUSH Serial 2',
    originUnit: 'Camp Lejeune',
    destinationUnit: 'MCB Quantico',
    status: MovementStatus.EN_ROUTE,
    cargo: 'Equipment + 24 PAX',
    priority: 'PRIORITY',
    departureTime: isoStr(0, -3.5),
    eta: futureIso(0, 6.5),
    vehicles: 6,
    personnel: 24,
    notes: 'Trailing Serial 1 by 30 min. Currently south of Petersburg VA.',
    lastUpdated: isoStr(0),
    originCoords: { lat: 34.62, lon: -77.36 },
    destinationCoords: { lat: 38.52, lon: -77.30 },
  },
  {
    id: 'mov-active-3',
    name: 'CLB-1 FEX RESUPPLY',
    originUnit: 'Camp Lejeune LSA',
    destinationUnit: 'TAA Hawk',
    status: MovementStatus.EN_ROUTE,
    cargo: 'Class I/IX + 8 PAX',
    priority: 'ROUTINE',
    departureTime: isoStr(0, -2),
    eta: futureIso(0, 1),
    vehicles: 4,
    personnel: 8,
    notes: 'On schedule. ETA 1 hour.',
    lastUpdated: isoStr(0),
    originCoords: { lat: 34.62, lon: -77.36 },
    destinationCoords: { lat: 34.67, lon: -77.30 },
  },
  {
    id: 'mov-active-4',
    name: 'DESERT VIPER ADV PARTY',
    originUnit: 'Camp Pendleton',
    destinationUnit: '29 Palms MCAGCC',
    status: MovementStatus.DELAYED,
    cargo: '35 PAX advance party',
    priority: 'PRIORITY',
    departureTime: isoStr(0, -5),
    eta: futureIso(0, 2),
    vehicles: 3,
    personnel: 35,
    notes: 'DELAYED: Vehicle breakdown on I-15 near Barstow. Recovery en route. ETA delayed 2 hrs.',
    lastUpdated: isoStr(0),
    originCoords: { lat: 33.30, lon: -117.35 },
    destinationCoords: { lat: 34.23, lon: -116.05 },
  },
];

// ---------------------------------------------------------------------------
// API Functions — Convoy Plans
// ---------------------------------------------------------------------------

export async function getConvoyPlans(
  unitId?: number,
  status?: string,
): Promise<ConvoyPlan[]> {
  if (isDemoMode) {
    await mockDelay();
    let results = [...MOCK_CONVOY_PLANS];
    if (unitId) results = results.filter((p) => p.unit_id === unitId);
    if (status) results = results.filter((p) => p.status === status);
    return results;
  }
  const response = await apiClient.get<{ data: ConvoyPlan[] }>('/convoy-plans', {
    params: { unit_id: unitId, status },
  });
  return response.data.data;
}

export async function getConvoyPlan(planId: number): Promise<ConvoyPlan> {
  if (isDemoMode) {
    await mockDelay();
    const plan = MOCK_CONVOY_PLANS.find((p) => p.id === planId);
    if (!plan) throw new Error(`Convoy plan ${planId} not found`);
    return plan;
  }
  const response = await apiClient.get<{ data: ConvoyPlan }>(`/convoy-plans/${planId}`);
  return response.data.data;
}

export async function createConvoyPlan(data: Partial<ConvoyPlan>): Promise<ConvoyPlan> {
  if (isDemoMode) {
    await mockDelay();
    const newPlan: ConvoyPlan = {
      id: MOCK_CONVOY_PLANS.length + 1,
      name: data.name ?? 'NEW CONVOY PLAN',
      unit_id: data.unit_id ?? 4,
      created_by: data.created_by ?? 5,
      status: 'DRAFT',
      route_name: data.route_name ?? null,
      route_description: data.route_description ?? null,
      total_distance_km: data.total_distance_km ?? null,
      estimated_duration_hours: data.estimated_duration_hours ?? null,
      route_primary: data.route_primary ?? null,
      route_alternate: data.route_alternate ?? null,
      departure_time_planned: data.departure_time_planned ?? null,
      sp_time: data.sp_time ?? null,
      rp_time: data.rp_time ?? null,
      brief_time: data.brief_time ?? null,
      rehearsal_time: data.rehearsal_time ?? null,
      movement_credit_number: data.movement_credit_number ?? null,
      convoy_commander_id: data.convoy_commander_id ?? null,
      risk_assessment_level: data.risk_assessment_level ?? null,
      comm_plan: data.comm_plan ?? null,
      recovery_plan: data.recovery_plan ?? null,
      medevac_plan: data.medevac_plan ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      serials: [],
    };
    MOCK_CONVOY_PLANS.push(newPlan);
    return newPlan;
  }
  const response = await apiClient.post<{ data: ConvoyPlan }>('/convoy-plans', data);
  return response.data.data;
}

export async function updateConvoyPlan(
  planId: number,
  data: Partial<ConvoyPlan>,
): Promise<ConvoyPlan> {
  if (isDemoMode) {
    await mockDelay();
    const plan = MOCK_CONVOY_PLANS.find((p) => p.id === planId);
    if (!plan) throw new Error(`Convoy plan ${planId} not found`);
    Object.assign(plan, data, { updated_at: new Date().toISOString() });
    return { ...plan };
  }
  const response = await apiClient.put<{ data: ConvoyPlan }>(`/convoy-plans/${planId}`, data);
  return response.data.data;
}

export async function approveConvoyPlan(planId: number): Promise<ConvoyPlan> {
  if (isDemoMode) {
    await mockDelay();
    const plan = MOCK_CONVOY_PLANS.find((p) => p.id === planId);
    if (!plan) throw new Error(`Convoy plan ${planId} not found`);
    plan.status = 'APPROVED';
    plan.updated_at = new Date().toISOString();
    return { ...plan };
  }
  const response = await apiClient.post<{ data: ConvoyPlan }>(`/convoy-plans/${planId}/approve`);
  return response.data.data;
}

export async function executeConvoyPlan(planId: number): Promise<ConvoyPlan> {
  if (isDemoMode) {
    await mockDelay();
    const plan = MOCK_CONVOY_PLANS.find((p) => p.id === planId);
    if (!plan) throw new Error(`Convoy plan ${planId} not found`);
    plan.status = 'EXECUTING';
    plan.updated_at = new Date().toISOString();
    return { ...plan };
  }
  const response = await apiClient.post<{ data: ConvoyPlan }>(`/convoy-plans/${planId}/execute`);
  return response.data.data;
}

export async function cancelConvoyPlan(planId: number): Promise<ConvoyPlan> {
  if (isDemoMode) {
    await mockDelay();
    const plan = MOCK_CONVOY_PLANS.find((p) => p.id === planId);
    if (!plan) throw new Error(`Convoy plan ${planId} not found`);
    plan.status = 'CANCELED';
    plan.updated_at = new Date().toISOString();
    return { ...plan };
  }
  const response = await apiClient.post<{ data: ConvoyPlan }>(`/convoy-plans/${planId}/cancel`);
  return response.data.data;
}

export async function getMarchTable(planId: number): Promise<MarchTableData> {
  if (isDemoMode) {
    await mockDelay();
    // return the same mock march table for any plan
    return { ...MOCK_MARCH_TABLE };
  }
  const response = await apiClient.get<{ data: MarchTableData }>(
    `/convoy-plans/${planId}/march-table`,
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// API Functions — Lift Requests
// ---------------------------------------------------------------------------

export async function getLiftRequests(
  unitId?: number,
  status?: string,
): Promise<LiftRequest[]> {
  if (isDemoMode) {
    await mockDelay();
    let results = [...MOCK_LIFT_REQUESTS];
    if (unitId) results = results.filter((r) => r.requesting_unit_id === unitId);
    if (status) results = results.filter((r) => r.status === status);
    return results;
  }
  const response = await apiClient.get<{ data: LiftRequest[] }>('/lift-requests', {
    params: { unit_id: unitId, status },
  });
  return response.data.data;
}

export async function createLiftRequest(data: Partial<LiftRequest>): Promise<LiftRequest> {
  if (isDemoMode) {
    await mockDelay();
    const newReq: LiftRequest = {
      id: MOCK_LIFT_REQUESTS.length + 1,
      requesting_unit_id: data.requesting_unit_id ?? 4,
      requesting_unit_name: data.requesting_unit_name ?? '1/1 Marines',
      supporting_unit_id: data.supporting_unit_id ?? null,
      cargo_type: data.cargo_type ?? 'SUPPLY',
      cargo_description: data.cargo_description ?? '',
      weight_lbs: data.weight_lbs ?? null,
      cube_ft: data.cube_ft ?? null,
      pax_count: data.pax_count ?? 0,
      hazmat: data.hazmat ?? false,
      priority: data.priority ?? 'ROUTINE',
      required_delivery_date: data.required_delivery_date ?? futureIso(7).split('T')[0],
      status: 'REQUESTED',
      pickup_location: data.pickup_location ?? '',
      pickup_lat: data.pickup_lat ?? null,
      pickup_lon: data.pickup_lon ?? null,
      delivery_location: data.delivery_location ?? '',
      delivery_lat: data.delivery_lat ?? null,
      delivery_lon: data.delivery_lon ?? null,
      assigned_movement_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_LIFT_REQUESTS.push(newReq);
    return newReq;
  }
  const response = await apiClient.post<{ data: LiftRequest }>('/lift-requests', data);
  return response.data.data;
}

export async function updateLiftRequest(
  requestId: number,
  data: Partial<LiftRequest>,
): Promise<LiftRequest> {
  if (isDemoMode) {
    await mockDelay();
    const req = MOCK_LIFT_REQUESTS.find((r) => r.id === requestId);
    if (!req) throw new Error(`Lift request ${requestId} not found`);
    Object.assign(req, data, { updated_at: new Date().toISOString() });
    return { ...req };
  }
  const response = await apiClient.put<{ data: LiftRequest }>(
    `/lift-requests/${requestId}`,
    data,
  );
  return response.data.data;
}

export async function approveLiftRequest(
  requestId: number,
  supportingUnitId: number,
): Promise<LiftRequest> {
  if (isDemoMode) {
    await mockDelay();
    const req = MOCK_LIFT_REQUESTS.find((r) => r.id === requestId);
    if (!req) throw new Error(`Lift request ${requestId} not found`);
    req.status = 'APPROVED';
    req.supporting_unit_id = supportingUnitId;
    req.updated_at = new Date().toISOString();
    return { ...req };
  }
  const response = await apiClient.post<{ data: LiftRequest }>(
    `/lift-requests/${requestId}/approve`,
    { supporting_unit_id: supportingUnitId },
  );
  return response.data.data;
}

export async function assignLiftRequest(
  requestId: number,
  movementId: number,
): Promise<LiftRequest> {
  if (isDemoMode) {
    await mockDelay();
    const req = MOCK_LIFT_REQUESTS.find((r) => r.id === requestId);
    if (!req) throw new Error(`Lift request ${requestId} not found`);
    req.status = 'SCHEDULED';
    req.assigned_movement_id = movementId;
    req.updated_at = new Date().toISOString();
    return { ...req };
  }
  const response = await apiClient.post<{ data: LiftRequest }>(
    `/lift-requests/${requestId}/assign`,
    { movement_id: movementId },
  );
  return response.data.data;
}

export async function cancelLiftRequest(requestId: number): Promise<LiftRequest> {
  if (isDemoMode) {
    await mockDelay();
    const req = MOCK_LIFT_REQUESTS.find((r) => r.id === requestId);
    if (!req) throw new Error(`Lift request ${requestId} not found`);
    req.status = 'CANCELED';
    req.updated_at = new Date().toISOString();
    return { ...req };
  }
  const response = await apiClient.post<{ data: LiftRequest }>(
    `/lift-requests/${requestId}/cancel`,
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// API Functions — Active Movements & History
// ---------------------------------------------------------------------------

export async function getActiveMovements(unitId?: number): Promise<Movement[]> {
  if (isDemoMode) {
    await mockDelay();
    let results = [...MOCK_ACTIVE_MOVEMENTS];
    if (unitId) {
      // Simple filter — in mock all belong to same general area
      results = results;
    }
    return results;
  }
  const response = await apiClient.get<{ data: Movement[] }>('/movements/active', {
    params: { unit_id: unitId },
  });
  return response.data.data;
}

export async function getMovementHistory(
  unitId?: number,
  days?: number,
): Promise<MovementHistoryRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    return [...MOCK_MOVEMENT_HISTORY];
  }
  const response = await apiClient.get<{ data: MovementHistoryRecord[] }>(
    '/movements/history',
    { params: { unit_id: unitId, days } },
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Location Inventory (for manifest building)
// ---------------------------------------------------------------------------

const MOCK_INVENTORY: LocationInventoryItem[] = [
  { item_id: 'eq-001', item_type: 'equipment', nomenclature: 'HMMWV M1151 Up-Armored', tamcn: 'D1076', category: 'VEHICLES', available_qty: 8, weight_lbs: 12100, status: 'SERVICEABLE' },
  { item_id: 'eq-002', item_type: 'equipment', nomenclature: 'MTVR MK23 7-Ton Cargo', tamcn: 'D0090', category: 'VEHICLES', available_qty: 4, weight_lbs: 30000, status: 'SERVICEABLE' },
  { item_id: 'eq-003', item_type: 'equipment', nomenclature: 'JLTV M1280 General Purpose', tamcn: 'D1180', category: 'VEHICLES', available_qty: 6, weight_lbs: 14000, status: 'SERVICEABLE' },
  { item_id: 'eq-004', item_type: 'equipment', nomenclature: 'M240B Machine Gun 7.62mm', nsn: '1005-01-412-9963', category: 'WEAPONS', available_qty: 24, weight_lbs: 27.6, status: 'SERVICEABLE' },
  { item_id: 'eq-005', item_type: 'equipment', nomenclature: 'M2A1 .50 Cal Machine Gun', nsn: '1005-01-364-0443', category: 'WEAPONS', available_qty: 12, weight_lbs: 84, status: 'SERVICEABLE' },
  { item_id: 'eq-006', item_type: 'equipment', nomenclature: 'AN/PRC-117G Multiband Radio', nsn: '5820-01-557-5829', category: 'COMMS', available_qty: 16, weight_lbs: 12.5, status: 'SERVICEABLE' },
  { item_id: 'eq-007', item_type: 'equipment', nomenclature: 'AN/PRC-152A Handheld Radio', nsn: '5820-01-451-8250', category: 'COMMS', available_qty: 48, weight_lbs: 2.6, status: 'SERVICEABLE' },
  { item_id: 'eq-008', item_type: 'equipment', nomenclature: 'MEP-803A Generator 10kW', nsn: '6115-01-274-7392', category: 'EQUIPMENT', available_qty: 3, weight_lbs: 880, status: 'SERVICEABLE' },
  { item_id: 'eq-009', item_type: 'equipment', nomenclature: 'MK19 MOD 3 Grenade Launcher', nsn: '1010-01-126-9063', category: 'WEAPONS', available_qty: 8, weight_lbs: 77.6, status: 'SERVICEABLE' },
  { item_id: 'eq-010', item_type: 'equipment', nomenclature: 'HMMWV M1165 Expanded Capacity', tamcn: 'D1077', category: 'VEHICLES', available_qty: 4, weight_lbs: 13000, status: 'SERVICEABLE' },
  { item_id: 'sup-001', item_type: 'supply', nomenclature: 'MRE, Menu Variety Pack (Case)', nsn: '8970-01-321-9160', category: 'SUPPLY', available_qty: 200, weight_lbs: 22.5, status: 'SERVICEABLE' },
  { item_id: 'sup-002', item_type: 'supply', nomenclature: 'Potable Water, 1L Bottles (Case/12)', nsn: '8960-00-926-1730', category: 'SUPPLY', available_qty: 150, weight_lbs: 28, status: 'SERVICEABLE' },
  { item_id: 'sup-003', item_type: 'supply', nomenclature: '5.56mm Ball M855A1 (840rd Can)', nsn: '1305-01-617-8520', category: 'AMMO', available_qty: 60, weight_lbs: 27, status: 'SERVICEABLE' },
  { item_id: 'sup-004', item_type: 'supply', nomenclature: '7.62mm Ball M80A1 (200rd Belt)', nsn: '1305-01-600-8703', category: 'AMMO', available_qty: 40, weight_lbs: 13.5, status: 'SERVICEABLE' },
  { item_id: 'sup-005', item_type: 'supply', nomenclature: 'JP-8 Aviation Fuel (55gal Drum)', nsn: '9130-00-256-8366', category: 'SUPPLY', available_qty: 20, weight_lbs: 410, status: 'SERVICEABLE' },
  { item_id: 'sup-006', item_type: 'supply', nomenclature: 'MOGAS Unleaded (55gal Drum)', nsn: '9130-00-160-1818', category: 'SUPPLY', available_qty: 15, weight_lbs: 370, status: 'SERVICEABLE' },
  { item_id: 'sup-007', item_type: 'supply', nomenclature: 'Camouflage Net System, Woodland', nsn: '1080-01-455-0590', category: 'EQUIPMENT', available_qty: 10, weight_lbs: 45, status: 'SERVICEABLE' },
  { item_id: 'sup-008', item_type: 'supply', nomenclature: 'Concertina Wire, Triple Standard', nsn: '5660-00-262-4855', category: 'EQUIPMENT', available_qty: 30, weight_lbs: 52, status: 'SERVICEABLE' },
  { item_id: 'eq-011', item_type: 'equipment', nomenclature: 'ACOG TA31RCO Rifle Scope', nsn: '1240-01-412-6608', category: 'EQUIPMENT', available_qty: 100, weight_lbs: 0.97, status: 'SERVICEABLE' },
  { item_id: 'eq-012', item_type: 'equipment', nomenclature: 'PVS-14 Night Vision Monocular', nsn: '5855-01-432-0524', category: 'EQUIPMENT', available_qty: 40, weight_lbs: 0.77, status: 'SERVICEABLE' },
];

export async function getLocationInventory(
  _location: string,
  query?: { q?: string; category?: string; limit?: number; offset?: number },
): Promise<{ data: LocationInventoryItem[]; total_count: number }> {
  if (isDemoMode) {
    await mockDelay();
    let items = [...MOCK_INVENTORY];
    if (query?.q) {
      const q = query.q.toLowerCase();
      items = items.filter(
        (i) =>
          i.nomenclature.toLowerCase().includes(q) ||
          (i.tamcn && i.tamcn.toLowerCase().includes(q)) ||
          (i.nsn && i.nsn.toLowerCase().includes(q)),
      );
    }
    if (query?.category && query.category !== 'ALL') {
      items = items.filter((i) => i.category === query.category);
    }
    const total = items.length;
    const offset = query?.offset ?? 0;
    const limit = query?.limit ?? 25;
    return { data: items.slice(offset, offset + limit), total_count: total };
  }
  const response = await apiClient.get('/transportation/location-inventory', {
    params: { location: _location, ...query },
  });
  return response.data;
}
