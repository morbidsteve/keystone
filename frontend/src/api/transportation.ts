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
  ConvoyCargoItem,
  FullManifestResponse,
  FullManifestVehicle,
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
    convoyPlanId: planId,
    serialNumber: serialNum,
    serialCommanderId: opts.serialCommanderId ?? null,
    serialCommanderName: opts.serialCommanderName,
    vehicleCount: opts.vehicleCount ?? 6,
    paxCount: opts.paxCount ?? 24,
    marchOrder: order,
    marchSpeedKph: opts.marchSpeedKph ?? 40,
    catchUpSpeedKph: opts.catchUpSpeedKph ?? 56,
    intervalMeters: opts.intervalMeters ?? 100,
    createdAt: isoStr(5),
  };
}

// ---------------------------------------------------------------------------
// Mock Convoy Plan Data — 8 items
// ---------------------------------------------------------------------------

const MOCK_CONVOY_PLANS: ConvoyPlan[] = [
  {
    id: 1,
    name: 'IRON HAWK RESUPPLY',
    unitId: 4,
    createdBy: 5,
    status: 'DRAFT',
    routeName: 'MSR EAGLE',
    routeDescription: 'Camp Lejeune to Fort Liberty via US-17 / I-95',
    totalDistanceKm: 210,
    estimatedDurationHours: 5.5,
    routePrimary: 'US-17 N to I-95 N, Exit 56B to Reilly Rd',
    routeAlternate: 'US-421 N to NC-87 N, approach via Bragg Blvd',
    departureTimePlanned: futureIso(2, 6),
    spTime: futureIso(2, 6),
    rpTime: futureIso(2, 12),
    briefTime: futureIso(2, 4),
    rehearsalTime: futureIso(1, 8),
    movementCreditNumber: null,
    convoyCommanderId: 5,
    riskAssessmentLevel: 'MEDIUM',
    commPlan: 'Primary: BN TAC 1 (36.600 MHz). Alternate: BN CMD (46.200 MHz). Contingency: Cell phone roster.',
    recoveryPlan: 'Lead vehicle carries tow bar. Recovery team staged at midpoint (Fayetteville). Contact MTM at (910) 555-0142.',
    medevacPlan: 'Route to nearest MTF. Primary: Naval Medical Center Camp Lejeune (first half). Womack AMC (second half). Corpsman in Serial 1.',
    createdAt: isoStr(3),
    updatedAt: isoStr(1),
    serials: [
      makeSerial(1, 1, 'S-1', 1, { serialCommanderName: 'SSgt Martinez', vehicleCount: 8, paxCount: 32 }),
      makeSerial(2, 1, 'S-2', 2, { serialCommanderName: 'Sgt Williams', vehicleCount: 6, paxCount: 24 }),
      makeSerial(3, 1, 'S-3', 3, { serialCommanderName: 'Cpl Johnson', vehicleCount: 4, paxCount: 16 }),
    ],
  },
  {
    id: 2,
    name: 'DESERT VIPER MOVEMENT',
    unitId: 5,
    createdBy: 8,
    status: 'DRAFT',
    routeName: 'MSR CONDOR',
    routeDescription: 'Camp Pendleton to MCAGCC 29 Palms via I-15 / CA-247',
    totalDistanceKm: 245,
    estimatedDurationHours: 6.0,
    routePrimary: 'I-15 N to CA-247 E via Barstow, approach Gate 1',
    routeAlternate: 'CA-79 N to I-10 E, north on CA-62',
    departureTimePlanned: futureIso(5, 5),
    spTime: futureIso(5, 5),
    rpTime: futureIso(5, 11),
    briefTime: futureIso(5, 3),
    rehearsalTime: futureIso(4, 10),
    movementCreditNumber: 'MCN-2026-0034',
    convoyCommanderId: 8,
    riskAssessmentLevel: 'HIGH',
    commPlan: 'Primary: Regt TAC (42.350 MHz). SATCOM backup on channel 7.',
    recoveryPlan: 'Recovery section trails Serial 2. Civilian tow contract via MARCORLOGCOM on standby.',
    medevacPlan: 'CASEVAC to NHCP (first leg) or Robert E. Bush NMCSD. Air MEDEVAC request via Regt S-3.',
    createdAt: isoStr(5),
    updatedAt: isoStr(2),
    serials: [
      makeSerial(4, 2, 'S-1', 1, { serialCommanderName: 'GySgt Thompson', vehicleCount: 10, paxCount: 40 }),
      makeSerial(5, 2, 'S-2', 2, { serialCommanderName: 'SSgt Kim', vehicleCount: 8, paxCount: 32 }),
    ],
  },
  {
    id: 3,
    name: 'ROLLING THUNDER AMMO HAUL',
    unitId: 4,
    createdBy: 10,
    status: 'DRAFT',
    routeName: 'ASR DELTA',
    routeDescription: 'Camp Lejeune ASP to G-10 Range Complex',
    totalDistanceKm: 35,
    estimatedDurationHours: 1.5,
    routePrimary: 'Sneads Ferry Rd to Range Rd, north to G-10 ASP',
    routeAlternate: 'Piney Green Rd to Verona Loop Rd',
    departureTimePlanned: futureIso(3, 7),
    spTime: futureIso(3, 7),
    rpTime: futureIso(3, 9),
    briefTime: futureIso(3, 6),
    rehearsalTime: null,
    movementCreditNumber: null,
    convoyCommanderId: 10,
    riskAssessmentLevel: 'HIGH',
    commPlan: 'BN TAC 1. Report at each checkpoint.',
    recoveryPlan: 'Recovery vehicle in trail. No civilian tow for Class V cargo.',
    medevacPlan: 'BAS on standby at G-10. Corpsman rides in lead vehicle.',
    createdAt: isoStr(2),
    updatedAt: isoStr(1),
    serials: [
      makeSerial(6, 3, 'S-1', 1, { serialCommanderName: 'SSgt Martinez', vehicleCount: 4, paxCount: 12 }),
      makeSerial(7, 3, 'S-2', 2, { serialCommanderName: 'Sgt Davis', vehicleCount: 3, paxCount: 9 }),
    ],
  },
  {
    id: 4,
    name: 'STEEL RAIN DEPLOY',
    unitId: 4,
    createdBy: 5,
    status: 'APPROVED',
    routeName: 'MSR TITAN',
    routeDescription: 'Camp Lejeune to Ft. Stewart via I-95 S / I-16',
    totalDistanceKm: 560,
    estimatedDurationHours: 12.0,
    routePrimary: 'I-95 S to I-16 W to Ft. Stewart Gate 1',
    routeAlternate: 'US-17 S through Savannah',
    departureTimePlanned: futureIso(7, 4),
    spTime: futureIso(7, 4),
    rpTime: futureIso(7, 16),
    briefTime: futureIso(7, 2),
    rehearsalTime: futureIso(6, 8),
    movementCreditNumber: 'MCN-2026-0041',
    convoyCommanderId: 5,
    riskAssessmentLevel: 'MEDIUM',
    commPlan: 'Primary: BN CMD. Secondary: Cell phone roster. SITREP every 2 hours.',
    recoveryPlan: 'Recovery vehicle trails each serial. Rest halt at Walterboro SC (4 hr mark).',
    medevacPlan: 'Route to nearest civilian ER for first 6 hours. Winn AMC at Ft. Stewart for final leg.',
    createdAt: isoStr(10),
    updatedAt: isoStr(3),
    serials: [
      makeSerial(8, 4, 'S-1', 1, { serialCommanderName: 'SSgt Martinez', vehicleCount: 12, paxCount: 48 }),
      makeSerial(9, 4, 'S-2', 2, { serialCommanderName: 'GySgt Thompson', vehicleCount: 10, paxCount: 40 }),
      makeSerial(10, 4, 'S-3', 3, { serialCommanderName: 'Sgt Williams', vehicleCount: 8, paxCount: 32 }),
    ],
  },
  {
    id: 5,
    name: 'PHOENIX RELAY',
    unitId: 5,
    createdBy: 8,
    status: 'APPROVED',
    routeName: 'MSR PHOENIX',
    routeDescription: 'MCAS Miramar to Camp Pendleton',
    totalDistanceKm: 65,
    estimatedDurationHours: 2.0,
    routePrimary: 'I-15 N to I-5 N, exit Las Pulgas Rd',
    routeAlternate: 'Miramar Rd to Oceanside via US-101',
    departureTimePlanned: futureIso(1, 8),
    spTime: futureIso(1, 8),
    rpTime: futureIso(1, 10),
    briefTime: futureIso(1, 7),
    rehearsalTime: null,
    movementCreditNumber: null,
    convoyCommanderId: 8,
    riskAssessmentLevel: 'LOW',
    commPlan: 'Cell phone roster. Primary freq: Co TAC.',
    recoveryPlan: 'Tow vehicle in trail serial.',
    medevacPlan: 'NHCP emergency room. Corpsman in lead vehicle.',
    createdAt: isoStr(4),
    updatedAt: isoStr(1),
    serials: [
      makeSerial(11, 5, 'S-1', 1, { serialCommanderName: 'SSgt Kim', vehicleCount: 5, paxCount: 20 }),
      makeSerial(12, 5, 'S-2', 2, { serialCommanderName: 'Cpl Nguyen', vehicleCount: 4, paxCount: 16 }),
    ],
  },
  {
    id: 6,
    name: 'TRIDENT PUSH',
    unitId: 4,
    createdBy: 5,
    status: 'EXECUTING',
    routeName: 'MSR TRIDENT',
    routeDescription: 'Camp Lejeune to MCB Quantico via I-95 N',
    totalDistanceKm: 470,
    estimatedDurationHours: 10.0,
    routePrimary: 'I-95 N direct to MCB Quantico Gate 2',
    routeAlternate: 'US-17 N to I-64 E to I-95 N',
    departureTimePlanned: isoStr(0, -4),
    spTime: isoStr(0, -4),
    rpTime: futureIso(0, 6),
    briefTime: isoStr(0, -6),
    rehearsalTime: isoStr(1, 8),
    movementCreditNumber: 'MCN-2026-0039',
    convoyCommanderId: 5,
    riskAssessmentLevel: 'MEDIUM',
    commPlan: 'BN TAC 1 primary. SATCOM as backup. SITREP at each checkpoint.',
    recoveryPlan: 'Recovery section in Serial 2 trail. Tow bar in each serial lead.',
    medevacPlan: 'Nearest civilian ER en route. Navy Medicine at Quantico for final approach.',
    createdAt: isoStr(14),
    updatedAt: isoStr(0),
    serials: [
      makeSerial(13, 6, 'S-1', 1, { serialCommanderName: 'SSgt Martinez', vehicleCount: 7, paxCount: 28 }),
      makeSerial(14, 6, 'S-2', 2, { serialCommanderName: 'Sgt Williams', vehicleCount: 6, paxCount: 24 }),
    ],
  },
  {
    id: 7,
    name: 'LONGBOW RETURN',
    unitId: 5,
    createdBy: 8,
    status: 'COMPLETE',
    routeName: 'MSR LONGBOW',
    routeDescription: '29 Palms MCAGCC to Camp Pendleton return',
    totalDistanceKm: 245,
    estimatedDurationHours: 6.0,
    routePrimary: 'CA-247 W to I-15 S to I-5 S',
    routeAlternate: 'CA-62 S to I-10 W to CA-79 S',
    departureTimePlanned: isoStr(5, 5),
    spTime: isoStr(5, 5),
    rpTime: isoStr(5, 11),
    briefTime: isoStr(5, 3),
    rehearsalTime: isoStr(6, 10),
    movementCreditNumber: 'MCN-2026-0028',
    convoyCommanderId: 8,
    riskAssessmentLevel: 'MEDIUM',
    commPlan: 'Regt TAC primary. Cell phone backup.',
    recoveryPlan: 'Recovery vehicle trailed Serial 1. No breakdowns occurred.',
    medevacPlan: 'Standard desert MEDEVAC plan. No incidents.',
    createdAt: isoStr(20),
    updatedAt: isoStr(5),
    serials: [
      makeSerial(15, 7, 'S-1', 1, { serialCommanderName: 'GySgt Thompson', vehicleCount: 8, paxCount: 32 }),
      makeSerial(16, 7, 'S-2', 2, { serialCommanderName: 'SSgt Kim', vehicleCount: 6, paxCount: 24 }),
    ],
  },
  {
    id: 8,
    name: 'CANCELED MAINTENANCE MOVE',
    unitId: 4,
    createdBy: 10,
    status: 'CANCELED',
    routeName: 'ASR BRAVO',
    routeDescription: 'Camp Lejeune Motor-T to 2nd MLG maintenance bay',
    totalDistanceKm: 12,
    estimatedDurationHours: 0.5,
    routePrimary: 'Holcomb Blvd to 2nd MLG compound',
    routeAlternate: null,
    departureTimePlanned: isoStr(8, 7),
    spTime: isoStr(8, 7),
    rpTime: isoStr(8, 8),
    briefTime: null,
    rehearsalTime: null,
    movementCreditNumber: null,
    convoyCommanderId: 10,
    riskAssessmentLevel: 'LOW',
    commPlan: 'Cell phone.',
    recoveryPlan: 'N/A — short distance.',
    medevacPlan: 'Naval Medical Center Camp Lejeune.',
    createdAt: isoStr(12),
    updatedAt: isoStr(8),
    serials: [
      makeSerial(17, 8, 'S-1', 1, { serialCommanderName: 'Cpl Johnson', vehicleCount: 3, paxCount: 6 }),
    ],
  },
];

// ---------------------------------------------------------------------------
// Mock Lift Request Data — 10 items
// ---------------------------------------------------------------------------

const MOCK_LIFT_REQUESTS: LiftRequest[] = [
  {
    id: 1,
    requestingUnitId: 4,
    requestingUnitName: '1/1 Marines',
    supportingUnitId: null,
    cargoType: 'SUPPLY',
    cargoDescription: 'Class I resupply — 120 cases MRE, 50 cases water',
    weightLbs: 8400,
    cubeFt: 320,
    paxCount: 0,
    hazmat: false,
    priority: 'ROUTINE',
    requiredDeliveryDate: futureIso(5).split('T')[0],
    status: 'REQUESTED',
    pickupLocation: 'Camp Lejeune LSA',
    pickupLat: 34.62,
    pickupLon: -77.36,
    deliveryLocation: 'FOB Raider, Camp Lejeune',
    deliveryLat: 34.65,
    deliveryLon: -77.32,
    assignedMovementId: null,
    createdAt: isoStr(2),
    updatedAt: isoStr(2),
  },
  {
    id: 2,
    requestingUnitId: 5,
    requestingUnitName: '2/1 Marines',
    supportingUnitId: null,
    cargoType: 'EQUIPMENT',
    cargoDescription: '4x HMMWV NMC vehicles for IMA repair',
    weightLbs: 48000,
    cubeFt: null,
    paxCount: 0,
    hazmat: false,
    priority: 'PRIORITY',
    requiredDeliveryDate: futureIso(3).split('T')[0],
    status: 'REQUESTED',
    pickupLocation: 'Camp Pendleton Motor-T',
    pickupLat: 33.30,
    pickupLon: -117.35,
    deliveryLocation: 'MCRD San Diego Maint Bay',
    deliveryLat: 32.74,
    deliveryLon: -117.20,
    assignedMovementId: null,
    createdAt: isoStr(1),
    updatedAt: isoStr(1),
  },
  {
    id: 3,
    requestingUnitId: 4,
    requestingUnitName: '1/1 Marines',
    supportingUnitId: 6,
    supportingUnitName: 'CLB-1',
    cargoType: 'MIXED',
    cargoDescription: 'Class V push package + 2 replacement M240Bs',
    weightLbs: 6200,
    cubeFt: 180,
    paxCount: 4,
    hazmat: true,
    priority: 'EMERGENCY',
    requiredDeliveryDate: futureIso(1).split('T')[0],
    status: 'APPROVED',
    pickupLocation: 'Camp Lejeune ASP',
    pickupLat: 34.60,
    pickupLon: -77.38,
    deliveryLocation: 'SR-10 Range Complex',
    deliveryLat: 34.68,
    deliveryLon: -77.28,
    assignedMovementId: null,
    createdAt: isoStr(1),
    updatedAt: isoStr(0),
  },
  {
    id: 4,
    requestingUnitId: 5,
    requestingUnitName: '2/1 Marines',
    supportingUnitId: 6,
    supportingUnitName: 'CLB-1',
    cargoType: 'PERSONNEL',
    cargoDescription: 'Advance party for ITX rotation',
    weightLbs: null,
    cubeFt: null,
    paxCount: 35,
    hazmat: false,
    priority: 'PRIORITY',
    requiredDeliveryDate: futureIso(4).split('T')[0],
    status: 'APPROVED',
    pickupLocation: 'Camp Pendleton Mainside',
    pickupLat: 33.30,
    pickupLon: -117.35,
    deliveryLocation: 'MCAGCC 29 Palms',
    deliveryLat: 34.23,
    deliveryLon: -116.05,
    assignedMovementId: null,
    createdAt: isoStr(3),
    updatedAt: isoStr(1),
  },
  {
    id: 5,
    requestingUnitId: 4,
    requestingUnitName: '1/1 Marines',
    supportingUnitId: 6,
    supportingUnitName: 'CLB-1',
    cargoType: 'SUPPLY',
    cargoDescription: 'Class III bulk fuel — 2000 gal JP-8',
    weightLbs: 13600,
    cubeFt: null,
    paxCount: 0,
    hazmat: true,
    priority: 'PRIORITY',
    requiredDeliveryDate: futureIso(2).split('T')[0],
    status: 'SCHEDULED',
    pickupLocation: 'Camp Lejeune Fuel Farm',
    pickupLat: 34.62,
    pickupLon: -77.36,
    deliveryLocation: 'LZ Bluebird, Camp Lejeune',
    deliveryLat: 34.70,
    deliveryLon: -77.25,
    assignedMovementId: null,
    createdAt: isoStr(4),
    updatedAt: isoStr(1),
  },
  {
    id: 6,
    requestingUnitId: 5,
    requestingUnitName: '2/1 Marines',
    supportingUnitId: 6,
    supportingUnitName: 'CLB-1',
    cargoType: 'EQUIPMENT',
    cargoDescription: '2x MTVR 7-ton trucks for engineer support',
    weightLbs: 66000,
    cubeFt: null,
    paxCount: 4,
    hazmat: false,
    priority: 'ROUTINE',
    requiredDeliveryDate: futureIso(6).split('T')[0],
    status: 'SCHEDULED',
    pickupLocation: 'CLB-1 Motor Pool',
    pickupLat: 33.31,
    pickupLon: -117.34,
    deliveryLocation: 'Camp Pendleton Training Area 52',
    deliveryLat: 33.38,
    deliveryLon: -117.42,
    assignedMovementId: null,
    createdAt: isoStr(5),
    updatedAt: isoStr(2),
  },
  {
    id: 7,
    requestingUnitId: 4,
    requestingUnitName: '1/1 Marines',
    supportingUnitId: 6,
    supportingUnitName: 'CLB-1',
    cargoType: 'MIXED',
    cargoDescription: 'FEX resupply — rations, water, Class IX parts',
    weightLbs: 12000,
    cubeFt: 480,
    paxCount: 8,
    hazmat: false,
    priority: 'ROUTINE',
    requiredDeliveryDate: isoStr(0).split('T')[0],
    status: 'IN_TRANSIT',
    pickupLocation: 'Camp Lejeune LSA',
    pickupLat: 34.62,
    pickupLon: -77.36,
    deliveryLocation: 'Tactical Assembly Area Hawk',
    deliveryLat: 34.67,
    deliveryLon: -77.30,
    assignedMovementId: null,
    createdAt: isoStr(3),
    updatedAt: isoStr(0),
  },
  {
    id: 8,
    requestingUnitId: 5,
    requestingUnitName: '2/1 Marines',
    supportingUnitId: 6,
    supportingUnitName: 'CLB-1',
    cargoType: 'SUPPLY',
    cargoDescription: 'Class VIII medical resupply for BAS',
    weightLbs: 2400,
    cubeFt: 96,
    paxCount: 0,
    hazmat: false,
    priority: 'EMERGENCY',
    requiredDeliveryDate: isoStr(1).split('T')[0],
    status: 'DELIVERED',
    pickupLocation: 'NHCP Pharmacy',
    pickupLat: 32.87,
    pickupLon: -117.14,
    deliveryLocation: 'Camp Pendleton BAS',
    deliveryLat: 33.30,
    deliveryLon: -117.35,
    assignedMovementId: null,
    createdAt: isoStr(4),
    updatedAt: isoStr(1),
  },
  {
    id: 9,
    requestingUnitId: 4,
    requestingUnitName: '1/1 Marines',
    supportingUnitId: null,
    cargoType: 'PERSONNEL',
    cargoDescription: 'Range detail return transport — 40 PAX',
    weightLbs: null,
    cubeFt: null,
    paxCount: 40,
    hazmat: false,
    priority: 'ROUTINE',
    requiredDeliveryDate: isoStr(3).split('T')[0],
    status: 'DELIVERED',
    pickupLocation: 'SR-10 Range Complex',
    pickupLat: 34.68,
    pickupLon: -77.28,
    deliveryLocation: 'BEQ Bldg 1372',
    deliveryLat: 34.62,
    deliveryLon: -77.36,
    assignedMovementId: null,
    createdAt: isoStr(5),
    updatedAt: isoStr(3),
  },
  {
    id: 10,
    requestingUnitId: 5,
    requestingUnitName: '2/1 Marines',
    supportingUnitId: null,
    cargoType: 'EQUIPMENT',
    cargoDescription: 'Generator set MEP-803A for field CP',
    weightLbs: 3200,
    cubeFt: 64,
    paxCount: 0,
    hazmat: false,
    priority: 'PRIORITY',
    requiredDeliveryDate: futureIso(2).split('T')[0],
    status: 'CANCELED',
    pickupLocation: 'Camp Pendleton CEB Yard',
    pickupLat: 33.31,
    pickupLon: -117.34,
    deliveryLocation: 'Camp Pendleton Training Area 62',
    deliveryLat: 33.40,
    deliveryLon: -117.45,
    assignedMovementId: null,
    createdAt: isoStr(6),
    updatedAt: isoStr(2),
  },
];

// ---------------------------------------------------------------------------
// Mock March Table Data
// ---------------------------------------------------------------------------

const MOCK_MARCH_TABLE: MarchTableData = {
  spTime: futureIso(2, 6),
  rpTime: futureIso(2, 12),
  checkpoints: [
    { name: 'SP — Main Gate CL', distanceKm: 0, cumulativeDistanceKm: 0, time: futureIso(2, 6), speedKph: 0 },
    { name: 'CP 1 — Jacksonville', distanceKm: 18, cumulativeDistanceKm: 18, time: futureIso(2, 6.5), speedKph: 40 },
    { name: 'CP 2 — I-95 On-Ramp', distanceKm: 22, cumulativeDistanceKm: 40, time: futureIso(2, 7), speedKph: 45 },
    { name: 'CP 3 — Smithfield Rest Area', distanceKm: 55, cumulativeDistanceKm: 95, time: futureIso(2, 8.25), speedKph: 55 },
    { name: 'HALT — Dunn Rest Stop', distanceKm: 30, cumulativeDistanceKm: 125, time: futureIso(2, 8.75), speedKph: 55 },
    { name: 'CP 4 — Fayetteville Exit', distanceKm: 45, cumulativeDistanceKm: 170, time: futureIso(2, 10), speedKph: 50 },
    { name: 'CP 5 — Reilly Rd Gate', distanceKm: 30, cumulativeDistanceKm: 200, time: futureIso(2, 11), speedKph: 45 },
    { name: 'RP — Ft Liberty Motor Pool', distanceKm: 10, cumulativeDistanceKm: 210, time: futureIso(2, 12), speedKph: 30 },
  ],
  totalDistanceKm: 210,
  totalDurationHours: 5.5,
  marchSpeedKph: 40,
  catchUpSpeedKph: 56,
  fuelEstimate: {
    totalGallons: 540,
    totalLiters: 2044,
    perVehicleGallons: 30,
  },
};

// ---------------------------------------------------------------------------
// Mock Movement History — 6 records
// ---------------------------------------------------------------------------

const MOCK_MOVEMENT_HISTORY: MovementHistoryRecord[] = [
  {
    id: 1,
    convoyId: 'CVY-2026-001',
    origin: 'Camp Lejeune',
    destination: 'Fort Liberty',
    departureTime: isoStr(15, 6),
    eta: isoStr(15, 12),
    actualArrival: isoStr(15, 11.5),
    vehicleCount: 18,
    cargoDescription: 'Class I/III resupply + 72 PAX',
    status: 'ARRIVED',
    onTime: true,
    durationHours: 5.5,
    averageSpeedKph: 38,
    convoyPlanName: 'IRON HAWK RESUPPLY',
  },
  {
    id: 2,
    convoyId: 'CVY-2026-002',
    origin: 'Camp Pendleton',
    destination: 'MCAGCC 29 Palms',
    departureTime: isoStr(12, 5),
    eta: isoStr(12, 11),
    actualArrival: isoStr(12, 12.5),
    vehicleCount: 22,
    cargoDescription: 'Full battalion equipment + 80 PAX',
    status: 'ARRIVED',
    onTime: false,
    durationHours: 7.5,
    averageSpeedKph: 33,
    convoyPlanName: 'DESERT VIPER MOVEMENT',
  },
  {
    id: 3,
    convoyId: 'CVY-2026-003',
    origin: 'Camp Lejeune ASP',
    destination: 'G-10 Range Complex',
    departureTime: isoStr(10, 7),
    eta: isoStr(10, 8.5),
    actualArrival: isoStr(10, 8.25),
    vehicleCount: 7,
    cargoDescription: 'Class V ammo push — 5.56mm, 7.62mm, 40mm',
    status: 'ARRIVED',
    onTime: true,
    durationHours: 1.25,
    averageSpeedKph: 28,
    convoyPlanName: 'ROLLING THUNDER AMMO HAUL',
  },
  {
    id: 4,
    convoyId: 'CVY-2026-004',
    origin: 'MCAS Miramar',
    destination: 'Camp Pendleton',
    departureTime: isoStr(8, 8),
    eta: isoStr(8, 10),
    actualArrival: isoStr(8, 9.75),
    vehicleCount: 9,
    cargoDescription: 'Aviation support equipment + 36 PAX',
    status: 'ARRIVED',
    onTime: true,
    durationHours: 1.75,
    averageSpeedKph: 37,
    convoyPlanName: 'PHOENIX RELAY',
  },
  {
    id: 5,
    convoyId: 'CVY-2026-005',
    origin: '29 Palms MCAGCC',
    destination: 'Camp Pendleton',
    departureTime: isoStr(5, 5),
    eta: isoStr(5, 11),
    actualArrival: isoStr(5, 11.25),
    vehicleCount: 14,
    cargoDescription: 'ITX return movement — vehicles + 56 PAX',
    status: 'ARRIVED',
    onTime: true,
    durationHours: 6.25,
    averageSpeedKph: 39,
    convoyPlanName: 'LONGBOW RETURN',
  },
  {
    id: 6,
    convoyId: 'CVY-2026-006',
    origin: 'Camp Lejeune',
    destination: 'MCB Quantico',
    departureTime: isoStr(20, 4),
    eta: isoStr(20, 14),
    actualArrival: isoStr(20, 15.5),
    vehicleCount: 16,
    cargoDescription: 'Equipment transfer + 48 PAX',
    status: 'ARRIVED',
    onTime: false,
    durationHours: 11.5,
    averageSpeedKph: 41,
    convoyPlanName: 'TRIDENT PUSH',
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
    if (unitId) results = results.filter((p) => p.unitId === unitId);
    if (status) results = results.filter((p) => p.status === status);
    return results;
  }
  const response = await apiClient.get<{ data: ConvoyPlan[] }>('/convoy-plans', {
    params: { unitId: unitId, status },
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
      unitId: data.unitId ?? 4,
      createdBy: data.createdBy ?? 5,
      status: 'DRAFT',
      routeName: data.routeName ?? null,
      routeDescription: data.routeDescription ?? null,
      totalDistanceKm: data.totalDistanceKm ?? null,
      estimatedDurationHours: data.estimatedDurationHours ?? null,
      routePrimary: data.routePrimary ?? null,
      routeAlternate: data.routeAlternate ?? null,
      departureTimePlanned: data.departureTimePlanned ?? null,
      spTime: data.spTime ?? null,
      rpTime: data.rpTime ?? null,
      briefTime: data.briefTime ?? null,
      rehearsalTime: data.rehearsalTime ?? null,
      movementCreditNumber: data.movementCreditNumber ?? null,
      convoyCommanderId: data.convoyCommanderId ?? null,
      riskAssessmentLevel: data.riskAssessmentLevel ?? null,
      commPlan: data.commPlan ?? null,
      recoveryPlan: data.recoveryPlan ?? null,
      medevacPlan: data.medevacPlan ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    Object.assign(plan, data, { updatedAt: new Date().toISOString() });
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
    plan.updatedAt = new Date().toISOString();
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
    plan.updatedAt = new Date().toISOString();
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
    plan.updatedAt = new Date().toISOString();
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
    if (unitId) results = results.filter((r) => r.requestingUnitId === unitId);
    if (status) results = results.filter((r) => r.status === status);
    return results;
  }
  const response = await apiClient.get<{ data: LiftRequest[] }>('/lift-requests', {
    params: { unitId: unitId, status },
  });
  return response.data.data;
}

export async function createLiftRequest(data: Partial<LiftRequest>): Promise<LiftRequest> {
  if (isDemoMode) {
    await mockDelay();
    const newReq: LiftRequest = {
      id: MOCK_LIFT_REQUESTS.length + 1,
      requestingUnitId: data.requestingUnitId ?? 4,
      requestingUnitName: data.requestingUnitName ?? '1/1 Marines',
      supportingUnitId: data.supportingUnitId ?? null,
      cargoType: data.cargoType ?? 'SUPPLY',
      cargoDescription: data.cargoDescription ?? '',
      weightLbs: data.weightLbs ?? null,
      cubeFt: data.cubeFt ?? null,
      paxCount: data.paxCount ?? 0,
      hazmat: data.hazmat ?? false,
      priority: data.priority ?? 'ROUTINE',
      requiredDeliveryDate: data.requiredDeliveryDate ?? futureIso(7).split('T')[0],
      status: 'REQUESTED',
      pickupLocation: data.pickupLocation ?? '',
      pickupLat: data.pickupLat ?? null,
      pickupLon: data.pickupLon ?? null,
      deliveryLocation: data.deliveryLocation ?? '',
      deliveryLat: data.deliveryLat ?? null,
      deliveryLon: data.deliveryLon ?? null,
      assignedMovementId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    Object.assign(req, data, { updatedAt: new Date().toISOString() });
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
    req.supportingUnitId = supportingUnitId;
    req.updatedAt = new Date().toISOString();
    return { ...req };
  }
  const response = await apiClient.post<{ data: LiftRequest }>(
    `/lift-requests/${requestId}/approve`,
    { supportingUnitId: supportingUnitId },
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
    req.assignedMovementId = movementId;
    req.updatedAt = new Date().toISOString();
    return { ...req };
  }
  const response = await apiClient.post<{ data: LiftRequest }>(
    `/lift-requests/${requestId}/assign`,
    { movementId: movementId },
  );
  return response.data.data;
}

export async function cancelLiftRequest(requestId: number): Promise<LiftRequest> {
  if (isDemoMode) {
    await mockDelay();
    const req = MOCK_LIFT_REQUESTS.find((r) => r.id === requestId);
    if (!req) throw new Error(`Lift request ${requestId} not found`);
    req.status = 'CANCELED';
    req.updatedAt = new Date().toISOString();
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
  const response = await apiClient.get<{ data: Movement[] }>('/transportation/active', {
    params: { unitId: unitId },
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
    { params: { unitId: unitId, days } },
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Location Inventory (for manifest building)
// ---------------------------------------------------------------------------

const MOCK_INVENTORY: LocationInventoryItem[] = [
  { itemId: 'eq-001', itemType: 'equipment', nomenclature: 'HMMWV M1151 Up-Armored', tamcn: 'D1076', category: 'VEHICLES', availableQty: 8, weightLbs: 12100, status: 'SERVICEABLE' },
  { itemId: 'eq-002', itemType: 'equipment', nomenclature: 'MTVR MK23 7-Ton Cargo', tamcn: 'D0090', category: 'VEHICLES', availableQty: 4, weightLbs: 30000, status: 'SERVICEABLE' },
  { itemId: 'eq-003', itemType: 'equipment', nomenclature: 'JLTV M1280 General Purpose', tamcn: 'D1180', category: 'VEHICLES', availableQty: 6, weightLbs: 14000, status: 'SERVICEABLE' },
  { itemId: 'eq-004', itemType: 'equipment', nomenclature: 'M240B Machine Gun 7.62mm', nsn: '1005-01-412-9963', category: 'WEAPONS', availableQty: 24, weightLbs: 27.6, status: 'SERVICEABLE' },
  { itemId: 'eq-005', itemType: 'equipment', nomenclature: 'M2A1 .50 Cal Machine Gun', nsn: '1005-01-364-0443', category: 'WEAPONS', availableQty: 12, weightLbs: 84, status: 'SERVICEABLE' },
  { itemId: 'eq-006', itemType: 'equipment', nomenclature: 'AN/PRC-117G Multiband Radio', nsn: '5820-01-557-5829', category: 'COMMS', availableQty: 16, weightLbs: 12.5, status: 'SERVICEABLE' },
  { itemId: 'eq-007', itemType: 'equipment', nomenclature: 'AN/PRC-152A Handheld Radio', nsn: '5820-01-451-8250', category: 'COMMS', availableQty: 48, weightLbs: 2.6, status: 'SERVICEABLE' },
  { itemId: 'eq-008', itemType: 'equipment', nomenclature: 'MEP-803A Generator 10kW', nsn: '6115-01-274-7392', category: 'EQUIPMENT', availableQty: 3, weightLbs: 880, status: 'SERVICEABLE' },
  { itemId: 'eq-009', itemType: 'equipment', nomenclature: 'MK19 MOD 3 Grenade Launcher', nsn: '1010-01-126-9063', category: 'WEAPONS', availableQty: 8, weightLbs: 77.6, status: 'SERVICEABLE' },
  { itemId: 'eq-010', itemType: 'equipment', nomenclature: 'HMMWV M1165 Expanded Capacity', tamcn: 'D1077', category: 'VEHICLES', availableQty: 4, weightLbs: 13000, status: 'SERVICEABLE' },
  { itemId: 'sup-001', itemType: 'supply', nomenclature: 'MRE, Menu Variety Pack (Case)', nsn: '8970-01-321-9160', category: 'SUPPLY', availableQty: 200, weightLbs: 22.5, status: 'SERVICEABLE' },
  { itemId: 'sup-002', itemType: 'supply', nomenclature: 'Potable Water, 1L Bottles (Case/12)', nsn: '8960-00-926-1730', category: 'SUPPLY', availableQty: 150, weightLbs: 28, status: 'SERVICEABLE' },
  { itemId: 'sup-003', itemType: 'supply', nomenclature: '5.56mm Ball M855A1 (840rd Can)', nsn: '1305-01-617-8520', category: 'AMMO', availableQty: 60, weightLbs: 27, status: 'SERVICEABLE' },
  { itemId: 'sup-004', itemType: 'supply', nomenclature: '7.62mm Ball M80A1 (200rd Belt)', nsn: '1305-01-600-8703', category: 'AMMO', availableQty: 40, weightLbs: 13.5, status: 'SERVICEABLE' },
  { itemId: 'sup-005', itemType: 'supply', nomenclature: 'JP-8 Aviation Fuel (55gal Drum)', nsn: '9130-00-256-8366', category: 'SUPPLY', availableQty: 20, weightLbs: 410, status: 'SERVICEABLE' },
  { itemId: 'sup-006', itemType: 'supply', nomenclature: 'MOGAS Unleaded (55gal Drum)', nsn: '9130-00-160-1818', category: 'SUPPLY', availableQty: 15, weightLbs: 370, status: 'SERVICEABLE' },
  { itemId: 'sup-007', itemType: 'supply', nomenclature: 'Camouflage Net System, Woodland', nsn: '1080-01-455-0590', category: 'EQUIPMENT', availableQty: 10, weightLbs: 45, status: 'SERVICEABLE' },
  { itemId: 'sup-008', itemType: 'supply', nomenclature: 'Concertina Wire, Triple Standard', nsn: '5660-00-262-4855', category: 'EQUIPMENT', availableQty: 30, weightLbs: 52, status: 'SERVICEABLE' },
  { itemId: 'eq-011', itemType: 'equipment', nomenclature: 'ACOG TA31RCO Rifle Scope', nsn: '1240-01-412-6608', category: 'EQUIPMENT', availableQty: 100, weightLbs: 0.97, status: 'SERVICEABLE' },
  { itemId: 'eq-012', itemType: 'equipment', nomenclature: 'PVS-14 Night Vision Monocular', nsn: '5855-01-432-0524', category: 'EQUIPMENT', availableQty: 40, weightLbs: 0.77, status: 'SERVICEABLE' },
];

// ---------------------------------------------------------------------------
// Transportation Personnel Assignment — Manifest & Cargo
// ---------------------------------------------------------------------------

// In-memory mock cargo store
let MOCK_CONVOY_CARGO: ConvoyCargoItem[] = [
  { id: 1, movementId: 1, convoyVehicleId: 1, description: 'MRE Cases (Class I)', quantity: 20, weightLbs: 450, isHazmat: false, supplyCatalogItemId: null, equipmentCatalogItemId: null },
  { id: 2, movementId: 1, convoyVehicleId: 1, description: '5.56mm Ammo Cans (Class V)', quantity: 8, weightLbs: 216, isHazmat: true, supplyCatalogItemId: null, equipmentCatalogItemId: null },
  { id: 3, movementId: 1, convoyVehicleId: 2, description: 'Water Cans (Class I)', quantity: 30, weightLbs: 840, isHazmat: false, supplyCatalogItemId: null, equipmentCatalogItemId: null },
];
let nextCargoId = 4;

export async function getMovementManifest(movementId: number): Promise<FullManifestResponse> {
  if (isDemoMode) {
    await mockDelay();

    // Find a convoy plan that could correspond to this movement
    const plan = MOCK_CONVOY_PLANS.find((p) => p.id === movementId) ?? MOCK_CONVOY_PLANS[0];
    const convoyId = `CVY-2026-${String(plan.id).padStart(3, '0')}`;

    // Build vehicles from the plan's serials
    const vehicles: FullManifestVehicle[] = [];
    let vehicleCounter = 1;

    for (const serial of plan.serials) {
      for (let v = 0; v < Math.min(serial.vehicleCount, 3); v++) {
        const cvId = vehicleCounter;
        const cargo = MOCK_CONVOY_CARGO.filter(
          (c) => c.movementId === movementId && c.convoyVehicleId === cvId,
        );
        vehicles.push({
          convoyVehicleId: cvId,
          bumperNumber: `${serial.serialNumber}-V${v + 1}`,
          vehicleType: v === 0 ? 'HMMWV M1151' : 'MTVR MK23',
          tamcn: v === 0 ? 'D1100' : 'D0090',
          personnel: [],
          cargo,
          totalCargoWeight: cargo.reduce((sum, c) => sum + (c.weightLbs ?? 0), 0),
        });
        vehicleCounter++;
      }
    }

    return {
      movementId: movementId,
      convoyId: convoyId,
      vehicles,
    };
  }

  const response = await apiClient.get<{ data: FullManifestResponse }>(
    `/transportation/movements/${movementId}/manifest`,
  );
  return response.data.data;
}

export async function addConvoyCargo(
  movementId: number,
  cargo: Omit<ConvoyCargoItem, 'id' | 'movementId'>,
): Promise<ConvoyCargoItem> {
  if (isDemoMode) {
    await mockDelay();
    const record: ConvoyCargoItem = {
      id: nextCargoId++,
      movementId: movementId,
      ...cargo,
    };
    MOCK_CONVOY_CARGO = [...MOCK_CONVOY_CARGO, record];
    return record;
  }

  const response = await apiClient.post<{ data: ConvoyCargoItem }>(
    `/transportation/movements/${movementId}/cargo`,
    cargo,
  );
  return response.data.data;
}

export async function removeConvoyCargo(movementId: number, cargoId: number): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    MOCK_CONVOY_CARGO = MOCK_CONVOY_CARGO.filter(
      (c) => !(c.id === cargoId && c.movementId === movementId),
    );
    return;
  }

  await apiClient.delete(`/transportation/movements/${movementId}/cargo/${cargoId}`);
}

// ---------------------------------------------------------------------------
// Location Inventory (for manifest building)
// ---------------------------------------------------------------------------

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
