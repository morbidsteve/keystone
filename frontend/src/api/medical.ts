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
    casualty_id: 'CAS-2026-0001',
    unit_id: 4,
    personnel_id: 17,
    incident_datetime: isoStr(0, -2),
    reported_datetime: isoStr(0, -1.5),
    location_lat: 33.3528,
    location_lon: 44.3661,
    location_mgrs: '38SMB4512067890',
    location_description: 'MSR TAMPA, 2km S of CP ALPHA',
    precedence: CASEVACPrecedence.URGENT_SURGICAL,
    number_of_patients: 1,
    special_equipment_required: 'HOIST',
    security_at_pickup: 'NO_ENEMY',
    patient_type: 'US_MILITARY',
    marking_method: 'VS_17_PANEL',
    nationality_status: 'US',
    nbc_contamination: false,
    mechanism_of_injury: 'IED blast — bilateral lower extremity amputation',
    injuries_description: 'Traumatic bilateral BKA, massive hemorrhage controlled with bilateral CAT tourniquets. TQ time 0845Z.',
    triage_category: TriageCategory.IMMEDIATE,
    tccc_interventions: { tourniquet: true, chest_seal: false, npa: false, iv_access: true, txa: true },
    status: CasualtyReportStatus.REPORTED,
    transport_method: null,
    evacuation_status: EvacuationStatus.PENDING,
    receiving_facility_id: null,
    pickup_time: null,
    arrival_at_facility_time: null,
    remarks: 'Requires surgical intervention within 2 hours. Walking blood bank activated.',
    logs: [
      { id: 1, casualty_report_id: 1, event_type: 'REPORTED', event_time: isoStr(0, -1.5), notes: '9-LINE submitted by 1st PLT' },
    ],
    created_at: isoStr(0, -1.5),
    updated_at: isoStr(0, -1.5),
  },
  {
    id: 2,
    casualty_id: 'CAS-2026-0002',
    unit_id: 4,
    personnel_id: 19,
    incident_datetime: isoStr(0, -3),
    reported_datetime: isoStr(0, -2.5),
    location_lat: 33.3610,
    location_lon: 44.3750,
    location_mgrs: '38SMB4520068100',
    location_description: 'PB DELTA, main entrance',
    precedence: CASEVACPrecedence.URGENT,
    number_of_patients: 2,
    special_equipment_required: 'NONE',
    security_at_pickup: 'NO_ENEMY',
    patient_type: 'US_MILITARY',
    marking_method: 'SMOKE_SIGNAL',
    nationality_status: 'US',
    nbc_contamination: false,
    mechanism_of_injury: 'GSW — right thorax penetrating',
    injuries_description: 'Sucking chest wound R anterior chest. Chest seal applied. Decreased breath sounds R lung.',
    triage_category: TriageCategory.IMMEDIATE,
    tccc_interventions: { tourniquet: false, chest_seal: true, npa: false, iv_access: true, txa: false },
    status: CasualtyReportStatus.REPORTED,
    transport_method: null,
    evacuation_status: EvacuationStatus.PENDING,
    receiving_facility_id: null,
    pickup_time: null,
    arrival_at_facility_time: null,
    remarks: 'Second patient has minor shrapnel wounds — MINIMAL triage.',
    logs: [
      { id: 2, casualty_report_id: 2, event_type: 'REPORTED', event_time: isoStr(0, -2.5), notes: '9-LINE submitted by 2nd PLT' },
    ],
    created_at: isoStr(0, -2.5),
    updated_at: isoStr(0, -2.5),
  },
  {
    id: 3,
    casualty_id: 'CAS-2026-0003',
    unit_id: 4,
    personnel_id: 14,
    incident_datetime: isoStr(0, -5),
    reported_datetime: isoStr(0, -4.8),
    location_lat: 33.3400,
    location_lon: 44.3500,
    location_mgrs: '38SMB4490067700',
    location_description: 'OP NORTH, observation post',
    precedence: CASEVACPrecedence.PRIORITY,
    number_of_patients: 1,
    special_equipment_required: 'NONE',
    security_at_pickup: 'NO_ENEMY',
    patient_type: 'US_MILITARY',
    marking_method: 'VS_17_PANEL',
    nationality_status: 'US',
    nbc_contamination: false,
    mechanism_of_injury: 'Fall from height — suspected spinal injury',
    injuries_description: 'C-spine precautions in place. GCS 14. Pain in lumbar region. No neuro deficit noted.',
    triage_category: TriageCategory.DELAYED,
    tccc_interventions: { tourniquet: false, chest_seal: false, npa: false, iv_access: true, txa: false },
    status: CasualtyReportStatus.DISPATCHED,
    transport_method: 'GROUND_AMBULANCE',
    evacuation_status: EvacuationStatus.PENDING,
    receiving_facility_id: 2,
    pickup_time: null,
    arrival_at_facility_time: null,
    remarks: 'Ground CASEVAC dispatched. ETA 15 min to pickup.',
    logs: [
      { id: 3, casualty_report_id: 3, event_type: 'REPORTED', event_time: isoStr(0, -4.8), notes: '9-LINE submitted' },
      { id: 4, casualty_report_id: 3, event_type: 'DISPATCHED', event_time: isoStr(0, -4.5), notes: 'Ground ambulance dispatched from BAS' },
    ],
    created_at: isoStr(0, -4.8),
    updated_at: isoStr(0, -4.5),
  },
  {
    id: 4,
    casualty_id: 'CAS-2026-0004',
    unit_id: 4,
    personnel_id: 20,
    incident_datetime: isoStr(0, -8),
    reported_datetime: isoStr(0, -7.5),
    location_lat: 33.3700,
    location_lon: 44.3800,
    location_mgrs: '38SMB4530068200',
    location_description: 'Route IRON, convoy halt position',
    precedence: CASEVACPrecedence.URGENT,
    number_of_patients: 1,
    special_equipment_required: 'VENTILATOR',
    security_at_pickup: 'POSSIBLE_ENEMY',
    patient_type: 'US_MILITARY',
    marking_method: 'SMOKE_SIGNAL',
    nationality_status: 'US',
    nbc_contamination: false,
    mechanism_of_injury: 'Blast injury — TBI, bilateral TM rupture',
    injuries_description: 'GCS 10. Bilateral hemotympanum. Battle signs present. Intermittent seizure activity.',
    triage_category: TriageCategory.IMMEDIATE,
    tccc_interventions: { tourniquet: false, chest_seal: false, npa: true, iv_access: true, txa: true },
    status: CasualtyReportStatus.EVACUATING,
    transport_method: 'MEDEVAC_ROTARY',
    evacuation_status: EvacuationStatus.IN_TRANSIT,
    receiving_facility_id: 4,
    pickup_time: isoStr(0, -6),
    arrival_at_facility_time: null,
    remarks: 'DUSTOFF en route to ROLE2. ETA 20 min.',
    logs: [
      { id: 5, casualty_report_id: 4, event_type: 'REPORTED', event_time: isoStr(0, -7.5), notes: '9-LINE submitted' },
      { id: 6, casualty_report_id: 4, event_type: 'DISPATCHED', event_time: isoStr(0, -7), notes: 'MEDEVAC dispatched' },
      { id: 7, casualty_report_id: 4, event_type: 'EVACUATING', event_time: isoStr(0, -6), notes: 'Patient onboard, en route ROLE2' },
    ],
    created_at: isoStr(0, -7.5),
    updated_at: isoStr(0, -6),
  },
  {
    id: 5,
    casualty_id: 'CAS-2026-0005',
    unit_id: 4,
    personnel_id: 21,
    incident_datetime: isoStr(-1, -4),
    reported_datetime: isoStr(-1, -3.5),
    location_lat: 33.3550,
    location_lon: 44.3680,
    location_mgrs: '38SMB4515067920',
    location_description: 'Training area BRAVO',
    precedence: CASEVACPrecedence.PRIORITY,
    number_of_patients: 1,
    special_equipment_required: 'NONE',
    security_at_pickup: 'NO_ENEMY',
    patient_type: 'US_MILITARY',
    marking_method: 'VS_17_PANEL',
    nationality_status: 'US',
    nbc_contamination: false,
    mechanism_of_injury: 'Heat casualty — exertional heat stroke',
    injuries_description: 'Core temp 105.2F. AMS, diaphoresis, tachycardic. Cooling measures initiated.',
    triage_category: TriageCategory.DELAYED,
    tccc_interventions: { tourniquet: false, chest_seal: false, npa: false, iv_access: true, txa: false },
    status: CasualtyReportStatus.EVACUATING,
    transport_method: 'GROUND_AMBULANCE',
    evacuation_status: EvacuationStatus.IN_TRANSIT,
    receiving_facility_id: 2,
    pickup_time: isoStr(-1, -3),
    arrival_at_facility_time: null,
    remarks: 'Core temp trending down with active cooling. Ground evac to STP.',
    logs: [
      { id: 8, casualty_report_id: 5, event_type: 'REPORTED', event_time: isoStr(-1, -3.5), notes: '9-LINE submitted' },
      { id: 9, casualty_report_id: 5, event_type: 'DISPATCHED', event_time: isoStr(-1, -3.2), notes: 'Ground ambulance dispatched' },
      { id: 10, casualty_report_id: 5, event_type: 'EVACUATING', event_time: isoStr(-1, -3), notes: 'Patient loaded, en route STP' },
    ],
    created_at: isoStr(-1, -3.5),
    updated_at: isoStr(-1, -3),
  },
  {
    id: 6,
    casualty_id: 'CAS-2026-0006',
    unit_id: 4,
    personnel_id: 18,
    incident_datetime: isoStr(-1, -10),
    reported_datetime: isoStr(-1, -9.5),
    location_lat: 33.3480,
    location_lon: 44.3590,
    location_mgrs: '38SMB4505067850',
    location_description: 'FOB WARRIOR, motor pool',
    precedence: CASEVACPrecedence.ROUTINE,
    number_of_patients: 1,
    special_equipment_required: 'NONE',
    security_at_pickup: 'NO_ENEMY',
    patient_type: 'US_MILITARY',
    marking_method: 'NONE',
    nationality_status: 'US',
    nbc_contamination: false,
    mechanism_of_injury: 'Crush injury — hand caught in turret mechanism',
    injuries_description: 'Crush injury R hand, 3rd-5th metacarpal fractures suspected. Controlled with splint and pain management.',
    triage_category: TriageCategory.DELAYED,
    tccc_interventions: { tourniquet: false, chest_seal: false, npa: false, iv_access: false, txa: false },
    status: CasualtyReportStatus.AT_MTF,
    transport_method: 'GROUND_AMBULANCE',
    evacuation_status: EvacuationStatus.AT_FACILITY,
    receiving_facility_id: 1,
    pickup_time: isoStr(-1, -9),
    arrival_at_facility_time: isoStr(-1, -8.5),
    remarks: 'At BAS for X-ray and orthopedic consult. May require ROLE2 transfer.',
    logs: [
      { id: 11, casualty_report_id: 6, event_type: 'REPORTED', event_time: isoStr(-1, -9.5), notes: '9-LINE submitted' },
      { id: 12, casualty_report_id: 6, event_type: 'AT_MTF', event_time: isoStr(-1, -8.5), notes: 'Arrived at BAS' },
    ],
    created_at: isoStr(-1, -9.5),
    updated_at: isoStr(-1, -8.5),
  },
  {
    id: 7,
    casualty_id: 'CAS-2026-0007',
    unit_id: 4,
    personnel_id: 16,
    incident_datetime: isoStr(-3, 0),
    reported_datetime: isoStr(-3, 0.5),
    location_lat: 33.3300,
    location_lon: 44.3450,
    location_mgrs: '38SMB4480067600',
    location_description: 'Range complex CHARLIE',
    precedence: CASEVACPrecedence.PRIORITY,
    number_of_patients: 1,
    special_equipment_required: 'NONE',
    security_at_pickup: 'NO_ENEMY',
    patient_type: 'US_MILITARY',
    marking_method: 'VS_17_PANEL',
    nationality_status: 'US',
    nbc_contamination: false,
    mechanism_of_injury: 'Ricochet — fragmentation wound to left arm',
    injuries_description: 'Shrapnel wound L forearm. Controlled hemorrhage. Radial pulse intact.',
    triage_category: TriageCategory.MINIMAL,
    tccc_interventions: { tourniquet: false, chest_seal: false, npa: false, iv_access: false, txa: false },
    status: CasualtyReportStatus.CLOSED,
    transport_method: 'GROUND_AMBULANCE',
    evacuation_status: EvacuationStatus.RTD,
    receiving_facility_id: 1,
    pickup_time: isoStr(-3, 1),
    arrival_at_facility_time: isoStr(-3, 1.5),
    remarks: 'Wound irrigated, debrided, closed. RTD with 72hr SIQ.',
    logs: [
      { id: 13, casualty_report_id: 7, event_type: 'REPORTED', event_time: isoStr(-3, 0.5), notes: '9-LINE submitted' },
      { id: 14, casualty_report_id: 7, event_type: 'AT_MTF', event_time: isoStr(-3, 1.5), notes: 'Arrived at BAS' },
      { id: 15, casualty_report_id: 7, event_type: 'CLOSED', event_time: isoStr(-3, 3), notes: 'RTD with restrictions' },
    ],
    created_at: isoStr(-3, 0.5),
    updated_at: isoStr(-3, 3),
  },
  {
    id: 8,
    casualty_id: 'CAS-2026-0008',
    unit_id: 4,
    personnel_id: 25,
    incident_datetime: isoStr(-5, -2),
    reported_datetime: isoStr(-5, -1.5),
    location_lat: 33.3620,
    location_lon: 44.3720,
    location_mgrs: '38SMB4525068110',
    location_description: 'PB ECHO, defensive perimeter',
    precedence: CASEVACPrecedence.URGENT,
    number_of_patients: 1,
    special_equipment_required: 'NONE',
    security_at_pickup: 'POSSIBLE_ENEMY',
    patient_type: 'US_MILITARY',
    marking_method: 'SMOKE_SIGNAL',
    nationality_status: 'US',
    nbc_contamination: false,
    mechanism_of_injury: 'GSW — left thigh, femoral artery suspected',
    injuries_description: 'High CAT L thigh. Pulse distal to TQ absent. Significant blood loss pre-TQ.',
    triage_category: TriageCategory.IMMEDIATE,
    tccc_interventions: { tourniquet: true, chest_seal: false, npa: false, iv_access: true, txa: true },
    status: CasualtyReportStatus.CLOSED,
    transport_method: 'MEDEVAC_ROTARY',
    evacuation_status: EvacuationStatus.TREATED,
    receiving_facility_id: 4,
    pickup_time: isoStr(-5, -1),
    arrival_at_facility_time: isoStr(-5, -0.5),
    remarks: 'Surgical repair at ROLE2. Patient stable, awaiting ROLE3 transfer.',
    logs: [
      { id: 16, casualty_report_id: 8, event_type: 'REPORTED', event_time: isoStr(-5, -1.5), notes: '9-LINE submitted' },
      { id: 17, casualty_report_id: 8, event_type: 'DISPATCHED', event_time: isoStr(-5, -1.2), notes: 'MEDEVAC dispatched' },
      { id: 18, casualty_report_id: 8, event_type: 'EVACUATING', event_time: isoStr(-5, -1), notes: 'Patient onboard' },
      { id: 19, casualty_report_id: 8, event_type: 'AT_MTF', event_time: isoStr(-5, -0.5), notes: 'Arrived ROLE2' },
      { id: 20, casualty_report_id: 8, event_type: 'CLOSED', event_time: isoStr(-4, 0), notes: 'Surgical repair complete. Stable.' },
    ],
    created_at: isoStr(-5, -1.5),
    updated_at: isoStr(-4, 0),
  },
];

// ---------------------------------------------------------------------------
// Mock Medical Facilities (5 records)
// ---------------------------------------------------------------------------

const MOCK_FACILITIES: MedicalFacility[] = [
  {
    id: 1,
    name: 'BAS 1/1',
    facility_type: MTFType.BAS,
    callsign: 'CORPSMAN 6',
    unit_id: 4,
    location_lat: 33.3500,
    location_lon: 44.3600,
    location_mgrs: '38SMB4500067860',
    capacity: 8,
    current_census: 3,
    status: MTFStatus.OPERATIONAL,
    surgical_capability: false,
    blood_bank: false,
    vent_capacity: 0,
    contact_freq: '42.500 MHz',
    physician_staffing: 0,
    pa_staffing: 1,
    medic_staffing: 6,
    surgical_tech_staffing: 0,
  },
  {
    id: 2,
    name: 'STP BRAVO',
    facility_type: MTFType.STP,
    callsign: 'SURGEON 2',
    unit_id: 4,
    location_lat: 33.3550,
    location_lon: 44.3650,
    location_mgrs: '38SMB4510067910',
    capacity: 20,
    current_census: 7,
    status: MTFStatus.OPERATIONAL,
    surgical_capability: true,
    blood_bank: true,
    vent_capacity: 2,
    contact_freq: '42.750 MHz',
    physician_staffing: 2,
    pa_staffing: 2,
    medic_staffing: 8,
    surgical_tech_staffing: 2,
  },
  {
    id: 3,
    name: 'FRSS ALPHA',
    facility_type: MTFType.FRSS,
    callsign: 'SCALPEL 1',
    unit_id: null,
    location_lat: 33.3650,
    location_lon: 44.3700,
    location_mgrs: '38SMB4520068000',
    capacity: 16,
    current_census: 5,
    status: MTFStatus.DEGRADED,
    surgical_capability: true,
    blood_bank: true,
    vent_capacity: 4,
    contact_freq: '43.000 MHz',
    physician_staffing: 3,
    pa_staffing: 1,
    medic_staffing: 10,
    surgical_tech_staffing: 3,
  },
  {
    id: 4,
    name: 'CSH ROLE2 WARRIOR',
    facility_type: MTFType.ROLE2,
    callsign: 'MERCY 6',
    unit_id: null,
    location_lat: 33.3800,
    location_lon: 44.3900,
    location_mgrs: '38SMB4545068350',
    capacity: 60,
    current_census: 22,
    status: MTFStatus.OPERATIONAL,
    surgical_capability: true,
    blood_bank: true,
    vent_capacity: 12,
    contact_freq: '44.250 MHz',
    physician_staffing: 8,
    pa_staffing: 4,
    medic_staffing: 20,
    surgical_tech_staffing: 6,
  },
  {
    id: 5,
    name: 'ROLE3 LNMC',
    facility_type: MTFType.ROLE3,
    callsign: 'NIGHTINGALE',
    unit_id: null,
    location_lat: 33.4200,
    location_lon: 44.4100,
    location_mgrs: '38SMB4575068800',
    capacity: 200,
    current_census: 84,
    status: MTFStatus.OPERATIONAL,
    surgical_capability: true,
    blood_bank: true,
    vent_capacity: 40,
    contact_freq: '45.000 MHz',
    physician_staffing: 25,
    pa_staffing: 10,
    medic_staffing: 50,
    surgical_tech_staffing: 12,
  },
];

// ---------------------------------------------------------------------------
// Mock Blood Products (12 records)
// ---------------------------------------------------------------------------

const MOCK_BLOOD_PRODUCTS: BloodProductRecord[] = [
  { id: 1, facility_id: 2, product_type: BloodProductType.WHOLE_BLOOD, blood_type: BloodTypeEnum.O_NEG, units_on_hand: 4, units_used_24h: 2, expiration_date: dateStr(14), walking_blood_bank_donors: 8 },
  { id: 2, facility_id: 2, product_type: BloodProductType.WHOLE_BLOOD, blood_type: BloodTypeEnum.O_POS, units_on_hand: 8, units_used_24h: 1, expiration_date: dateStr(12), walking_blood_bank_donors: 15 },
  { id: 3, facility_id: 2, product_type: BloodProductType.PRBC, blood_type: BloodTypeEnum.A_POS, units_on_hand: 6, units_used_24h: 0, expiration_date: dateStr(21), walking_blood_bank_donors: 12 },
  { id: 4, facility_id: 4, product_type: BloodProductType.WHOLE_BLOOD, blood_type: BloodTypeEnum.O_NEG, units_on_hand: 12, units_used_24h: 3, expiration_date: dateStr(10), walking_blood_bank_donors: 22 },
  { id: 5, facility_id: 4, product_type: BloodProductType.WHOLE_BLOOD, blood_type: BloodTypeEnum.O_POS, units_on_hand: 18, units_used_24h: 2, expiration_date: dateStr(11), walking_blood_bank_donors: 30 },
  { id: 6, facility_id: 4, product_type: BloodProductType.PRBC, blood_type: BloodTypeEnum.A_POS, units_on_hand: 10, units_used_24h: 1, expiration_date: dateStr(18), walking_blood_bank_donors: 20 },
  { id: 7, facility_id: 4, product_type: BloodProductType.FFP, blood_type: BloodTypeEnum.AB_POS, units_on_hand: 8, units_used_24h: 0, expiration_date: dateStr(25), walking_blood_bank_donors: 5 },
  { id: 8, facility_id: 4, product_type: BloodProductType.PLATELETS, blood_type: BloodTypeEnum.O_POS, units_on_hand: 2, units_used_24h: 1, expiration_date: dateStr(3), walking_blood_bank_donors: 30 },
  { id: 9, facility_id: 5, product_type: BloodProductType.WHOLE_BLOOD, blood_type: BloodTypeEnum.O_NEG, units_on_hand: 30, units_used_24h: 5, expiration_date: dateStr(9), walking_blood_bank_donors: 50 },
  { id: 10, facility_id: 5, product_type: BloodProductType.PRBC, blood_type: BloodTypeEnum.B_POS, units_on_hand: 14, units_used_24h: 2, expiration_date: dateStr(16), walking_blood_bank_donors: 18 },
  { id: 11, facility_id: 5, product_type: BloodProductType.CRYO, blood_type: BloodTypeEnum.AB_POS, units_on_hand: 6, units_used_24h: 0, expiration_date: dateStr(30), walking_blood_bank_donors: 5 },
  { id: 12, facility_id: 5, product_type: BloodProductType.FFP, blood_type: BloodTypeEnum.A_NEG, units_on_hand: 1, units_used_24h: 2, expiration_date: dateStr(5), walking_blood_bank_donors: 8 },
];

// ---------------------------------------------------------------------------
// Mock Burn Rates (6 Class VIII supplies)
// ---------------------------------------------------------------------------

const MOCK_BURN_RATES: MedicalBurnRate[] = [
  { id: 1, unit_id: 4, supply_catalog_item_id: 801, supply_name: 'CAT Tourniquet (Gen 7)', period_start: dateStr(-30), period_end: dateStr(0), quantity_used: 14, quantity_on_hand: 42, days_of_supply: 90, burn_rate_per_day: 0.47, projected_exhaustion_date: dateStr(90) },
  { id: 2, unit_id: 4, supply_catalog_item_id: 802, supply_name: 'Hyfin Chest Seal (Twin Pack)', period_start: dateStr(-30), period_end: dateStr(0), quantity_used: 6, quantity_on_hand: 8, days_of_supply: 40, burn_rate_per_day: 0.20, projected_exhaustion_date: dateStr(40) },
  { id: 3, unit_id: 4, supply_catalog_item_id: 803, supply_name: 'NPA (28Fr)', period_start: dateStr(-30), period_end: dateStr(0), quantity_used: 3, quantity_on_hand: 5, days_of_supply: 50, burn_rate_per_day: 0.10, projected_exhaustion_date: dateStr(50) },
  { id: 4, unit_id: 4, supply_catalog_item_id: 804, supply_name: 'IV Start Kit (18ga)', period_start: dateStr(-30), period_end: dateStr(0), quantity_used: 22, quantity_on_hand: 15, days_of_supply: 20, burn_rate_per_day: 0.73, projected_exhaustion_date: dateStr(20) },
  { id: 5, unit_id: 4, supply_catalog_item_id: 805, supply_name: 'Combat Gauze (Z-Fold)', period_start: dateStr(-30), period_end: dateStr(0), quantity_used: 18, quantity_on_hand: 6, days_of_supply: 10, burn_rate_per_day: 0.60, projected_exhaustion_date: dateStr(10) },
  { id: 6, unit_id: 4, supply_catalog_item_id: 806, supply_name: 'Celox Hemostatic Granules', period_start: dateStr(-30), period_end: dateStr(0), quantity_used: 8, quantity_on_hand: 3, days_of_supply: 11, burn_rate_per_day: 0.27, projected_exhaustion_date: dateStr(11) },
];

// ---------------------------------------------------------------------------
// Mock PERSTAT Medical
// ---------------------------------------------------------------------------

const MOCK_PERSTAT: PERSTATMedical = {
  unit_id: 4,
  total_strength: 162,
  effective_strength: 150,
  medical_holds: 2,
  active_casualties: 6,
  triage_breakdown: { IMMEDIATE: 3, DELAYED: 2, MINIMAL: 1, EXPECTANT: 0 },
  tccc_cert_rate_pct: 87.5,
  blood_type_distribution: { O_POS: 58, O_NEG: 12, A_POS: 42, A_NEG: 8, B_POS: 22, B_NEG: 4, AB_POS: 12, AB_NEG: 4 },
  timestamp: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getCasualties(unitId?: number): Promise<CasualtyReport[]> {
  if (isDemoMode) {
    await mockDelay();
    if (unitId) return MOCK_CASUALTIES.filter((c) => c.unit_id === unitId);
    return [...MOCK_CASUALTIES];
  }
  const response = await apiClient.get<{ data: CasualtyReport[] }>('/medical/casualties', {
    params: unitId ? { unit_id: unitId } : undefined,
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
    if (facilityId) return MOCK_BLOOD_PRODUCTS.filter((bp) => bp.facility_id === facilityId);
    return [...MOCK_BLOOD_PRODUCTS];
  }
  const response = await apiClient.get<{ data: BloodProductRecord[] }>('/medical/blood-products', {
    params: facilityId ? { facility_id: facilityId } : undefined,
  });
  return response.data.data;
}

export async function getBurnRates(unitId?: number): Promise<MedicalBurnRate[]> {
  if (isDemoMode) {
    await mockDelay();
    if (unitId) return MOCK_BURN_RATES.filter((br) => br.unit_id === unitId);
    return [...MOCK_BURN_RATES];
  }
  const response = await apiClient.get<{ data: MedicalBurnRate[] }>('/medical/burn-rates', {
    params: unitId ? { unit_id: unitId } : undefined,
  });
  return response.data.data;
}

export async function getPERSTATMedical(unitId: number): Promise<PERSTATMedical> {
  if (isDemoMode) {
    await mockDelay();
    return { ...MOCK_PERSTAT, unit_id: unitId };
  }
  const response = await apiClient.get<{ data: PERSTATMedical }>(`/units/${unitId}/perstat-medical`);
  return response.data.data;
}
