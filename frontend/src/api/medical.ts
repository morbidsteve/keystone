// =============================================================================
// KEYSTONE Medical & CASEVAC — API functions
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';
import {
  CASEVACPrecedence,
  TriageCategory,
  CasualtyReportStatus,
  EvacuationStatus,
  MTFType,
  MTFStatus,
  BloodProductType,
  BloodTypeEnum,
} from '@/lib/types';
import type {
  CasualtyReport,
  MedicalFacility,
  BloodProductRecord,
  MedicalBurnRate,
  PERSTATMedical,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Helper: date string N days from now (ISO short form)
// ---------------------------------------------------------------------------

function dateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

function isoStr(daysFromNow: number, hoursOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Mock delay
// ---------------------------------------------------------------------------

const mockDelay = (ms = 150 + Math.random() * 150): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Mock Casualty Reports (8 records)
// ---------------------------------------------------------------------------

const MOCK_CASUALTIES: CasualtyReport[] = [
  {
    id: 1,
    casualtyId: 'CAS-2026-0001',
    unitId: 4,
    personnelId: 17,
    incidentDatetime: isoStr(0, -2),
    reportedDatetime: isoStr(0, -1.5),
    locationLat: 33.3528,
    locationLon: 44.3661,
    locationMgrs: '38SMB4512067890',
    locationDescription: 'MSR TAMPA, 2km S of CP ALPHA',
    precedence: CASEVACPrecedence.URGENT_SURGICAL,
    numberOfPatients: 1,
    specialEquipmentRequired: 'HOIST',
    securityAtPickup: 'NO_ENEMY',
    patientType: 'US_MILITARY',
    markingMethod: 'VS_17_PANEL',
    nationalityStatus: 'US',
    nbcContamination: false,
    mechanismOfInjury: 'IED blast — bilateral lower extremity amputation',
    injuriesDescription: 'Traumatic bilateral BKA, massive hemorrhage controlled with bilateral CAT tourniquets. TQ time 0845Z.',
    triageCategory: TriageCategory.IMMEDIATE,
    tcccInterventions: { tourniquet: true, chest_seal: false, npa: false, iv_access: true, txa: true },
    status: CasualtyReportStatus.REPORTED,
    transportMethod: null,
    evacuationStatus: EvacuationStatus.PENDING,
    receivingFacilityId: null,
    pickupTime: null,
    arrivalAtFacilityTime: null,
    remarks: 'Requires surgical intervention within 2 hours. Walking blood bank activated.',
    logs: [
      { id: 1, casualtyReportId: 1, eventType: 'REPORTED', eventTime: isoStr(0, -1.5), notes: '9-LINE submitted by 1st PLT' },
    ],
    createdAt: isoStr(0, -1.5),
    updatedAt: isoStr(0, -1.5),
  },
  {
    id: 2,
    casualtyId: 'CAS-2026-0002',
    unitId: 4,
    personnelId: 19,
    incidentDatetime: isoStr(0, -3),
    reportedDatetime: isoStr(0, -2.5),
    locationLat: 33.3610,
    locationLon: 44.3750,
    locationMgrs: '38SMB4520068100',
    locationDescription: 'PB DELTA, main entrance',
    precedence: CASEVACPrecedence.URGENT,
    numberOfPatients: 2,
    specialEquipmentRequired: 'NONE',
    securityAtPickup: 'NO_ENEMY',
    patientType: 'US_MILITARY',
    markingMethod: 'SMOKE_SIGNAL',
    nationalityStatus: 'US',
    nbcContamination: false,
    mechanismOfInjury: 'GSW — right thorax penetrating',
    injuriesDescription: 'Sucking chest wound R anterior chest. Chest seal applied. Decreased breath sounds R lung.',
    triageCategory: TriageCategory.IMMEDIATE,
    tcccInterventions: { tourniquet: false, chest_seal: true, npa: false, iv_access: true, txa: false },
    status: CasualtyReportStatus.REPORTED,
    transportMethod: null,
    evacuationStatus: EvacuationStatus.PENDING,
    receivingFacilityId: null,
    pickupTime: null,
    arrivalAtFacilityTime: null,
    remarks: 'Second patient has minor shrapnel wounds — MINIMAL triage.',
    logs: [
      { id: 2, casualtyReportId: 2, eventType: 'REPORTED', eventTime: isoStr(0, -2.5), notes: '9-LINE submitted by 2nd PLT' },
    ],
    createdAt: isoStr(0, -2.5),
    updatedAt: isoStr(0, -2.5),
  },
  {
    id: 3,
    casualtyId: 'CAS-2026-0003',
    unitId: 4,
    personnelId: 14,
    incidentDatetime: isoStr(0, -5),
    reportedDatetime: isoStr(0, -4.8),
    locationLat: 33.3400,
    locationLon: 44.3500,
    locationMgrs: '38SMB4490067700',
    locationDescription: 'OP NORTH, observation post',
    precedence: CASEVACPrecedence.PRIORITY,
    numberOfPatients: 1,
    specialEquipmentRequired: 'NONE',
    securityAtPickup: 'NO_ENEMY',
    patientType: 'US_MILITARY',
    markingMethod: 'VS_17_PANEL',
    nationalityStatus: 'US',
    nbcContamination: false,
    mechanismOfInjury: 'Fall from height — suspected spinal injury',
    injuriesDescription: 'C-spine precautions in place. GCS 14. Pain in lumbar region. No neuro deficit noted.',
    triageCategory: TriageCategory.DELAYED,
    tcccInterventions: { tourniquet: false, chest_seal: false, npa: false, iv_access: true, txa: false },
    status: CasualtyReportStatus.DISPATCHED,
    transportMethod: 'GROUND_AMBULANCE',
    evacuationStatus: EvacuationStatus.PENDING,
    receivingFacilityId: 2,
    pickupTime: null,
    arrivalAtFacilityTime: null,
    remarks: 'Ground CASEVAC dispatched. ETA 15 min to pickup.',
    logs: [
      { id: 3, casualtyReportId: 3, eventType: 'REPORTED', eventTime: isoStr(0, -4.8), notes: '9-LINE submitted' },
      { id: 4, casualtyReportId: 3, eventType: 'DISPATCHED', eventTime: isoStr(0, -4.5), notes: 'Ground ambulance dispatched from BAS' },
    ],
    createdAt: isoStr(0, -4.8),
    updatedAt: isoStr(0, -4.5),
  },
  {
    id: 4,
    casualtyId: 'CAS-2026-0004',
    unitId: 4,
    personnelId: 20,
    incidentDatetime: isoStr(0, -8),
    reportedDatetime: isoStr(0, -7.5),
    locationLat: 33.3700,
    locationLon: 44.3800,
    locationMgrs: '38SMB4530068200',
    locationDescription: 'Route IRON, convoy halt position',
    precedence: CASEVACPrecedence.URGENT,
    numberOfPatients: 1,
    specialEquipmentRequired: 'VENTILATOR',
    securityAtPickup: 'POSSIBLE_ENEMY',
    patientType: 'US_MILITARY',
    markingMethod: 'SMOKE_SIGNAL',
    nationalityStatus: 'US',
    nbcContamination: false,
    mechanismOfInjury: 'Blast injury — TBI, bilateral TM rupture',
    injuriesDescription: 'GCS 10. Bilateral hemotympanum. Battle signs present. Intermittent seizure activity.',
    triageCategory: TriageCategory.IMMEDIATE,
    tcccInterventions: { tourniquet: false, chest_seal: false, npa: true, iv_access: true, txa: true },
    status: CasualtyReportStatus.EVACUATING,
    transportMethod: 'MEDEVAC_ROTARY',
    evacuationStatus: EvacuationStatus.IN_TRANSIT,
    receivingFacilityId: 4,
    pickupTime: isoStr(0, -6),
    arrivalAtFacilityTime: null,
    remarks: 'DUSTOFF en route to ROLE2. ETA 20 min.',
    logs: [
      { id: 5, casualtyReportId: 4, eventType: 'REPORTED', eventTime: isoStr(0, -7.5), notes: '9-LINE submitted' },
      { id: 6, casualtyReportId: 4, eventType: 'DISPATCHED', eventTime: isoStr(0, -7), notes: 'MEDEVAC dispatched' },
      { id: 7, casualtyReportId: 4, eventType: 'EVACUATING', eventTime: isoStr(0, -6), notes: 'Patient onboard, en route ROLE2' },
    ],
    createdAt: isoStr(0, -7.5),
    updatedAt: isoStr(0, -6),
  },
  {
    id: 5,
    casualtyId: 'CAS-2026-0005',
    unitId: 4,
    personnelId: 21,
    incidentDatetime: isoStr(-1, -4),
    reportedDatetime: isoStr(-1, -3.5),
    locationLat: 33.3550,
    locationLon: 44.3680,
    locationMgrs: '38SMB4515067920',
    locationDescription: 'Training area BRAVO',
    precedence: CASEVACPrecedence.PRIORITY,
    numberOfPatients: 1,
    specialEquipmentRequired: 'NONE',
    securityAtPickup: 'NO_ENEMY',
    patientType: 'US_MILITARY',
    markingMethod: 'VS_17_PANEL',
    nationalityStatus: 'US',
    nbcContamination: false,
    mechanismOfInjury: 'Heat casualty — exertional heat stroke',
    injuriesDescription: 'Core temp 105.2F. AMS, diaphoresis, tachycardic. Cooling measures initiated.',
    triageCategory: TriageCategory.DELAYED,
    tcccInterventions: { tourniquet: false, chest_seal: false, npa: false, iv_access: true, txa: false },
    status: CasualtyReportStatus.EVACUATING,
    transportMethod: 'GROUND_AMBULANCE',
    evacuationStatus: EvacuationStatus.IN_TRANSIT,
    receivingFacilityId: 2,
    pickupTime: isoStr(-1, -3),
    arrivalAtFacilityTime: null,
    remarks: 'Core temp trending down with active cooling. Ground evac to STP.',
    logs: [
      { id: 8, casualtyReportId: 5, eventType: 'REPORTED', eventTime: isoStr(-1, -3.5), notes: '9-LINE submitted' },
      { id: 9, casualtyReportId: 5, eventType: 'DISPATCHED', eventTime: isoStr(-1, -3.2), notes: 'Ground ambulance dispatched' },
      { id: 10, casualtyReportId: 5, eventType: 'EVACUATING', eventTime: isoStr(-1, -3), notes: 'Patient loaded, en route STP' },
    ],
    createdAt: isoStr(-1, -3.5),
    updatedAt: isoStr(-1, -3),
  },
  {
    id: 6,
    casualtyId: 'CAS-2026-0006',
    unitId: 4,
    personnelId: 18,
    incidentDatetime: isoStr(-1, -10),
    reportedDatetime: isoStr(-1, -9.5),
    locationLat: 33.3480,
    locationLon: 44.3590,
    locationMgrs: '38SMB4505067850',
    locationDescription: 'FOB WARRIOR, motor pool',
    precedence: CASEVACPrecedence.ROUTINE,
    numberOfPatients: 1,
    specialEquipmentRequired: 'NONE',
    securityAtPickup: 'NO_ENEMY',
    patientType: 'US_MILITARY',
    markingMethod: 'NONE',
    nationalityStatus: 'US',
    nbcContamination: false,
    mechanismOfInjury: 'Crush injury — hand caught in turret mechanism',
    injuriesDescription: 'Crush injury R hand, 3rd-5th metacarpal fractures suspected. Controlled with splint and pain management.',
    triageCategory: TriageCategory.DELAYED,
    tcccInterventions: { tourniquet: false, chest_seal: false, npa: false, iv_access: false, txa: false },
    status: CasualtyReportStatus.AT_MTF,
    transportMethod: 'GROUND_AMBULANCE',
    evacuationStatus: EvacuationStatus.AT_FACILITY,
    receivingFacilityId: 1,
    pickupTime: isoStr(-1, -9),
    arrivalAtFacilityTime: isoStr(-1, -8.5),
    remarks: 'At BAS for X-ray and orthopedic consult. May require ROLE2 transfer.',
    logs: [
      { id: 11, casualtyReportId: 6, eventType: 'REPORTED', eventTime: isoStr(-1, -9.5), notes: '9-LINE submitted' },
      { id: 12, casualtyReportId: 6, eventType: 'AT_MTF', eventTime: isoStr(-1, -8.5), notes: 'Arrived at BAS' },
    ],
    createdAt: isoStr(-1, -9.5),
    updatedAt: isoStr(-1, -8.5),
  },
  {
    id: 7,
    casualtyId: 'CAS-2026-0007',
    unitId: 4,
    personnelId: 16,
    incidentDatetime: isoStr(-3, 0),
    reportedDatetime: isoStr(-3, 0.5),
    locationLat: 33.3300,
    locationLon: 44.3450,
    locationMgrs: '38SMB4480067600',
    locationDescription: 'Range complex CHARLIE',
    precedence: CASEVACPrecedence.PRIORITY,
    numberOfPatients: 1,
    specialEquipmentRequired: 'NONE',
    securityAtPickup: 'NO_ENEMY',
    patientType: 'US_MILITARY',
    markingMethod: 'VS_17_PANEL',
    nationalityStatus: 'US',
    nbcContamination: false,
    mechanismOfInjury: 'Ricochet — fragmentation wound to left arm',
    injuriesDescription: 'Shrapnel wound L forearm. Controlled hemorrhage. Radial pulse intact.',
    triageCategory: TriageCategory.MINIMAL,
    tcccInterventions: { tourniquet: false, chest_seal: false, npa: false, iv_access: false, txa: false },
    status: CasualtyReportStatus.CLOSED,
    transportMethod: 'GROUND_AMBULANCE',
    evacuationStatus: EvacuationStatus.RTD,
    receivingFacilityId: 1,
    pickupTime: isoStr(-3, 1),
    arrivalAtFacilityTime: isoStr(-3, 1.5),
    remarks: 'Wound irrigated, debrided, closed. RTD with 72hr SIQ.',
    logs: [
      { id: 13, casualtyReportId: 7, eventType: 'REPORTED', eventTime: isoStr(-3, 0.5), notes: '9-LINE submitted' },
      { id: 14, casualtyReportId: 7, eventType: 'AT_MTF', eventTime: isoStr(-3, 1.5), notes: 'Arrived at BAS' },
      { id: 15, casualtyReportId: 7, eventType: 'CLOSED', eventTime: isoStr(-3, 3), notes: 'RTD with restrictions' },
    ],
    createdAt: isoStr(-3, 0.5),
    updatedAt: isoStr(-3, 3),
  },
  {
    id: 8,
    casualtyId: 'CAS-2026-0008',
    unitId: 4,
    personnelId: 25,
    incidentDatetime: isoStr(-5, -2),
    reportedDatetime: isoStr(-5, -1.5),
    locationLat: 33.3620,
    locationLon: 44.3720,
    locationMgrs: '38SMB4525068110',
    locationDescription: 'PB ECHO, defensive perimeter',
    precedence: CASEVACPrecedence.URGENT,
    numberOfPatients: 1,
    specialEquipmentRequired: 'NONE',
    securityAtPickup: 'POSSIBLE_ENEMY',
    patientType: 'US_MILITARY',
    markingMethod: 'SMOKE_SIGNAL',
    nationalityStatus: 'US',
    nbcContamination: false,
    mechanismOfInjury: 'GSW — left thigh, femoral artery suspected',
    injuriesDescription: 'High CAT L thigh. Pulse distal to TQ absent. Significant blood loss pre-TQ.',
    triageCategory: TriageCategory.IMMEDIATE,
    tcccInterventions: { tourniquet: true, chest_seal: false, npa: false, iv_access: true, txa: true },
    status: CasualtyReportStatus.CLOSED,
    transportMethod: 'MEDEVAC_ROTARY',
    evacuationStatus: EvacuationStatus.TREATED,
    receivingFacilityId: 4,
    pickupTime: isoStr(-5, -1),
    arrivalAtFacilityTime: isoStr(-5, -0.5),
    remarks: 'Surgical repair at ROLE2. Patient stable, awaiting ROLE3 transfer.',
    logs: [
      { id: 16, casualtyReportId: 8, eventType: 'REPORTED', eventTime: isoStr(-5, -1.5), notes: '9-LINE submitted' },
      { id: 17, casualtyReportId: 8, eventType: 'DISPATCHED', eventTime: isoStr(-5, -1.2), notes: 'MEDEVAC dispatched' },
      { id: 18, casualtyReportId: 8, eventType: 'EVACUATING', eventTime: isoStr(-5, -1), notes: 'Patient onboard' },
      { id: 19, casualtyReportId: 8, eventType: 'AT_MTF', eventTime: isoStr(-5, -0.5), notes: 'Arrived ROLE2' },
      { id: 20, casualtyReportId: 8, eventType: 'CLOSED', eventTime: isoStr(-4, 0), notes: 'Surgical repair complete. Stable.' },
    ],
    createdAt: isoStr(-5, -1.5),
    updatedAt: isoStr(-4, 0),
  },
];

// ---------------------------------------------------------------------------
// Mock Medical Facilities (5 records)
// ---------------------------------------------------------------------------

const MOCK_FACILITIES: MedicalFacility[] = [
  {
    id: 1,
    name: 'BAS 1/1',
    facilityType: MTFType.BAS,
    callsign: 'CORPSMAN 6',
    unitId: 4,
    locationLat: 33.3500,
    locationLon: 44.3600,
    locationMgrs: '38SMB4500067860',
    capacity: 8,
    currentCensus: 3,
    status: MTFStatus.OPERATIONAL,
    surgicalCapability: false,
    bloodBank: false,
    ventCapacity: 0,
    contactFreq: '42.500 MHz',
    physicianStaffing: 0,
    paStaffing: 1,
    medicStaffing: 6,
    surgicalTechStaffing: 0,
  },
  {
    id: 2,
    name: 'STP BRAVO',
    facilityType: MTFType.STP,
    callsign: 'SURGEON 2',
    unitId: 4,
    locationLat: 33.3550,
    locationLon: 44.3650,
    locationMgrs: '38SMB4510067910',
    capacity: 20,
    currentCensus: 7,
    status: MTFStatus.OPERATIONAL,
    surgicalCapability: true,
    bloodBank: true,
    ventCapacity: 2,
    contactFreq: '42.750 MHz',
    physicianStaffing: 2,
    paStaffing: 2,
    medicStaffing: 8,
    surgicalTechStaffing: 2,
  },
  {
    id: 3,
    name: 'FRSS ALPHA',
    facilityType: MTFType.FRSS,
    callsign: 'SCALPEL 1',
    unitId: null,
    locationLat: 33.3650,
    locationLon: 44.3700,
    locationMgrs: '38SMB4520068000',
    capacity: 16,
    currentCensus: 5,
    status: MTFStatus.DEGRADED,
    surgicalCapability: true,
    bloodBank: true,
    ventCapacity: 4,
    contactFreq: '43.000 MHz',
    physicianStaffing: 3,
    paStaffing: 1,
    medicStaffing: 10,
    surgicalTechStaffing: 3,
  },
  {
    id: 4,
    name: 'CSH ROLE2 WARRIOR',
    facilityType: MTFType.ROLE2,
    callsign: 'MERCY 6',
    unitId: null,
    locationLat: 33.3800,
    locationLon: 44.3900,
    locationMgrs: '38SMB4545068350',
    capacity: 60,
    currentCensus: 22,
    status: MTFStatus.OPERATIONAL,
    surgicalCapability: true,
    bloodBank: true,
    ventCapacity: 12,
    contactFreq: '44.250 MHz',
    physicianStaffing: 8,
    paStaffing: 4,
    medicStaffing: 20,
    surgicalTechStaffing: 6,
  },
  {
    id: 5,
    name: 'ROLE3 LNMC',
    facilityType: MTFType.ROLE3,
    callsign: 'NIGHTINGALE',
    unitId: null,
    locationLat: 33.4200,
    locationLon: 44.4100,
    locationMgrs: '38SMB4575068800',
    capacity: 200,
    currentCensus: 84,
    status: MTFStatus.OPERATIONAL,
    surgicalCapability: true,
    bloodBank: true,
    ventCapacity: 40,
    contactFreq: '45.000 MHz',
    physicianStaffing: 25,
    paStaffing: 10,
    medicStaffing: 50,
    surgicalTechStaffing: 12,
  },
];

// ---------------------------------------------------------------------------
// Mock Blood Products (12 records)
// ---------------------------------------------------------------------------

const MOCK_BLOOD_PRODUCTS: BloodProductRecord[] = [
  { id: 1, facilityId: 2, productType: BloodProductType.WHOLE_BLOOD, bloodType: BloodTypeEnum.O_NEG, unitsOnHand: 4, unitsUsed24h: 2, expirationDate: dateStr(14), walkingBloodBankDonors: 8 },
  { id: 2, facilityId: 2, productType: BloodProductType.WHOLE_BLOOD, bloodType: BloodTypeEnum.O_POS, unitsOnHand: 8, unitsUsed24h: 1, expirationDate: dateStr(12), walkingBloodBankDonors: 15 },
  { id: 3, facilityId: 2, productType: BloodProductType.PRBC, bloodType: BloodTypeEnum.A_POS, unitsOnHand: 6, unitsUsed24h: 0, expirationDate: dateStr(21), walkingBloodBankDonors: 12 },
  { id: 4, facilityId: 4, productType: BloodProductType.WHOLE_BLOOD, bloodType: BloodTypeEnum.O_NEG, unitsOnHand: 12, unitsUsed24h: 3, expirationDate: dateStr(10), walkingBloodBankDonors: 22 },
  { id: 5, facilityId: 4, productType: BloodProductType.WHOLE_BLOOD, bloodType: BloodTypeEnum.O_POS, unitsOnHand: 18, unitsUsed24h: 2, expirationDate: dateStr(11), walkingBloodBankDonors: 30 },
  { id: 6, facilityId: 4, productType: BloodProductType.PRBC, bloodType: BloodTypeEnum.A_POS, unitsOnHand: 10, unitsUsed24h: 1, expirationDate: dateStr(18), walkingBloodBankDonors: 20 },
  { id: 7, facilityId: 4, productType: BloodProductType.FFP, bloodType: BloodTypeEnum.AB_POS, unitsOnHand: 8, unitsUsed24h: 0, expirationDate: dateStr(25), walkingBloodBankDonors: 5 },
  { id: 8, facilityId: 4, productType: BloodProductType.PLATELETS, bloodType: BloodTypeEnum.O_POS, unitsOnHand: 2, unitsUsed24h: 1, expirationDate: dateStr(3), walkingBloodBankDonors: 30 },
  { id: 9, facilityId: 5, productType: BloodProductType.WHOLE_BLOOD, bloodType: BloodTypeEnum.O_NEG, unitsOnHand: 30, unitsUsed24h: 5, expirationDate: dateStr(9), walkingBloodBankDonors: 50 },
  { id: 10, facilityId: 5, productType: BloodProductType.PRBC, bloodType: BloodTypeEnum.B_POS, unitsOnHand: 14, unitsUsed24h: 2, expirationDate: dateStr(16), walkingBloodBankDonors: 18 },
  { id: 11, facilityId: 5, productType: BloodProductType.CRYO, bloodType: BloodTypeEnum.AB_POS, unitsOnHand: 6, unitsUsed24h: 0, expirationDate: dateStr(30), walkingBloodBankDonors: 5 },
  { id: 12, facilityId: 5, productType: BloodProductType.FFP, bloodType: BloodTypeEnum.A_NEG, unitsOnHand: 1, unitsUsed24h: 2, expirationDate: dateStr(5), walkingBloodBankDonors: 8 },
];

// ---------------------------------------------------------------------------
// Mock Burn Rates (6 Class VIII supplies)
// ---------------------------------------------------------------------------

const MOCK_BURN_RATES: MedicalBurnRate[] = [
  { id: 1, unitId: 4, supplyCatalogItemId: 801, supplyName: 'CAT Tourniquet (Gen 7)', periodStart: dateStr(-30), periodEnd: dateStr(0), quantityUsed: 14, quantityOnHand: 42, daysOfSupply: 90, burnRatePerDay: 0.47, projectedExhaustionDate: dateStr(90) },
  { id: 2, unitId: 4, supplyCatalogItemId: 802, supplyName: 'Hyfin Chest Seal (Twin Pack)', periodStart: dateStr(-30), periodEnd: dateStr(0), quantityUsed: 6, quantityOnHand: 8, daysOfSupply: 40, burnRatePerDay: 0.20, projectedExhaustionDate: dateStr(40) },
  { id: 3, unitId: 4, supplyCatalogItemId: 803, supplyName: 'NPA (28Fr)', periodStart: dateStr(-30), periodEnd: dateStr(0), quantityUsed: 3, quantityOnHand: 5, daysOfSupply: 50, burnRatePerDay: 0.10, projectedExhaustionDate: dateStr(50) },
  { id: 4, unitId: 4, supplyCatalogItemId: 804, supplyName: 'IV Start Kit (18ga)', periodStart: dateStr(-30), periodEnd: dateStr(0), quantityUsed: 22, quantityOnHand: 15, daysOfSupply: 20, burnRatePerDay: 0.73, projectedExhaustionDate: dateStr(20) },
  { id: 5, unitId: 4, supplyCatalogItemId: 805, supplyName: 'Combat Gauze (Z-Fold)', periodStart: dateStr(-30), periodEnd: dateStr(0), quantityUsed: 18, quantityOnHand: 6, daysOfSupply: 10, burnRatePerDay: 0.60, projectedExhaustionDate: dateStr(10) },
  { id: 6, unitId: 4, supplyCatalogItemId: 806, supplyName: 'Celox Hemostatic Granules', periodStart: dateStr(-30), periodEnd: dateStr(0), quantityUsed: 8, quantityOnHand: 3, daysOfSupply: 11, burnRatePerDay: 0.27, projectedExhaustionDate: dateStr(11) },
];

// ---------------------------------------------------------------------------
// Mock PERSTAT Medical
// ---------------------------------------------------------------------------

const MOCK_PERSTAT: PERSTATMedical = {
  unitId: 4,
  totalStrength: 162,
  effectiveStrength: 150,
  medicalHolds: 2,
  activeCasualties: 6,
  triageBreakdown: { IMMEDIATE: 3, DELAYED: 2, MINIMAL: 1, EXPECTANT: 0 },
  tcccCertRatePct: 87.5,
  bloodTypeDistribution: { O_POS: 58, O_NEG: 12, A_POS: 42, A_NEG: 8, B_POS: 22, B_NEG: 4, AB_POS: 12, AB_NEG: 4 },
  timestamp: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getCasualties(unitId?: number): Promise<CasualtyReport[]> {
  if (isDemoMode) {
    await mockDelay();
    if (unitId) return MOCK_CASUALTIES.filter((c) => c.unitId === unitId);
    return [...MOCK_CASUALTIES];
  }
  const response = await apiClient.get<{ data: CasualtyReport[] }>('/medical/casualties', {
    params: unitId ? { unitId: unitId } : undefined,
  });
  return response.data.data;
}

export async function getCasualty(casualtyId: number): Promise<CasualtyReport | null> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_CASUALTIES.find((c) => c.id === casualtyId) ?? null;
  }
  const response = await apiClient.get<{ data: CasualtyReport }>(`/medical/casualties/${casualtyId}`);
  return response.data.data;
}

export async function getFacilities(): Promise<MedicalFacility[]> {
  if (isDemoMode) {
    await mockDelay();
    return [...MOCK_FACILITIES];
  }
  const response = await apiClient.get<{ data: MedicalFacility[] }>('/medical/facilities');
  return response.data.data;
}

export async function getFacility(id: number): Promise<MedicalFacility | null> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_FACILITIES.find((f) => f.id === id) ?? null;
  }
  const response = await apiClient.get<{ data: MedicalFacility }>(`/medical/facilities/${id}`);
  return response.data.data;
}

export async function getBloodProducts(facilityId?: number): Promise<BloodProductRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    if (facilityId) return MOCK_BLOOD_PRODUCTS.filter((bp) => bp.facilityId === facilityId);
    return [...MOCK_BLOOD_PRODUCTS];
  }
  const response = await apiClient.get<{ data: BloodProductRecord[] }>('/medical/blood-products', {
    params: facilityId ? { facilityId: facilityId } : undefined,
  });
  return response.data.data;
}

export async function getBurnRates(unitId?: number): Promise<MedicalBurnRate[]> {
  if (isDemoMode) {
    await mockDelay();
    if (unitId) return MOCK_BURN_RATES.filter((br) => br.unitId === unitId);
    return [...MOCK_BURN_RATES];
  }
  const response = await apiClient.get<{ data: MedicalBurnRate[] }>('/medical/burn-rates', {
    params: unitId ? { unitId: unitId } : undefined,
  });
  return response.data.data;
}

export async function getPERSTATMedical(unitId: number): Promise<PERSTATMedical> {
  if (isDemoMode) {
    await mockDelay();
    return { ...MOCK_PERSTAT, unitId: unitId };
  }
  const response = await apiClient.get<{ data: PERSTATMedical }>(`/units/${unitId}/perstat-medical`);
  return response.data.data;
}
