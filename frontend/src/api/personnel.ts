// =============================================================================
// KEYSTONE Personnel & Manning — API functions
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';
import type {
  PersonnelRecord,
  BilletRecord,
  ManningSnapshotRecord,
  UnitStrengthData,
  MOSFillData,
  QualStatusData,
  PersonnelReadinessData,
  EASRecord,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Helper: date string N days from now (ISO short form)
// ---------------------------------------------------------------------------

function dateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Mock delay
// ---------------------------------------------------------------------------

const mockDelay = (ms = 150 + Math.random() * 150): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Mock Personnel Data (~25 records)
// ---------------------------------------------------------------------------

const MOCK_PERSONNEL: PersonnelRecord[] = [
  { id: 1, edipi: '1234567890', first_name: 'James', last_name: 'Richardson', rank: 'LtCol', unit_id: 4, mos: '0302', pay_grade: 'O5', billet: 'BN CDR', date_of_rank: '2024-06-01', eaos: '2028-06-01', pme_complete: true, rifle_qual: 'EXPERT', rifle_qual_date: '2025-09-15', pft_score: 285, pft_date: '2025-10-01', cft_score: 290, cft_date: '2025-10-01', swim_qual: 'CWS1', security_clearance: 'SECRET', clearance_expiry: '2030-01-01', drivers_license_military: true, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 2, edipi: '1234567891', first_name: 'Michael', last_name: 'Torres', rank: 'Maj', unit_id: 4, mos: '0302', pay_grade: 'O4', billet: 'XO', date_of_rank: '2023-08-01', eaos: '2027-08-01', pme_complete: true, rifle_qual: 'EXPERT', rifle_qual_date: '2025-09-15', pft_score: 278, pft_date: '2025-10-01', cft_score: 275, cft_date: '2025-10-01', swim_qual: 'CWS1', security_clearance: 'SECRET', clearance_expiry: '2029-05-01', drivers_license_military: true, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 3, edipi: '1234567892', first_name: 'Robert', last_name: 'Jenkins', rank: 'SgtMaj', unit_id: 4, mos: '0369', pay_grade: 'E9', billet: 'BN SGTMAJ', date_of_rank: '2023-01-01', eaos: '2027-01-01', pme_complete: true, rifle_qual: 'EXPERT', rifle_qual_date: '2025-09-10', pft_score: 270, pft_date: '2025-10-01', cft_score: 268, cft_date: '2025-10-01', swim_qual: 'CWS1', security_clearance: 'SECRET', clearance_expiry: '2029-03-01', drivers_license_military: true, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 4, edipi: '1234567893', first_name: 'David', last_name: 'Nguyen', rank: 'Capt', unit_id: 4, mos: '0302', pay_grade: 'O3', billet: 'ALPHA CO CDR', date_of_rank: '2024-02-01', eaos: '2026-06-15', pme_complete: true, rifle_qual: 'SHARPSHOOTER', rifle_qual_date: '2025-09-15', pft_score: 265, pft_date: '2025-10-01', cft_score: 270, cft_date: '2025-10-01', swim_qual: 'CWS2', security_clearance: 'SECRET', clearance_expiry: '2030-02-01', drivers_license_military: true, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 5, edipi: '1234567894', first_name: 'Kevin', last_name: 'Martinez', rank: 'Capt', unit_id: 4, mos: '0802', pay_grade: 'O3', billet: 'BRAVO CO CDR', date_of_rank: '2024-04-01', eaos: '2027-04-01', pme_complete: true, rifle_qual: 'EXPERT', rifle_qual_date: '2025-09-15', pft_score: 290, pft_date: '2025-10-01', cft_score: 285, cft_date: '2025-10-01', swim_qual: 'CWS1', security_clearance: 'SECRET', clearance_expiry: '2029-11-01', drivers_license_military: true, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 6, edipi: '1234567895', first_name: 'Anthony', last_name: 'Brooks', rank: '1stLt', unit_id: 4, mos: '0302', pay_grade: 'O2', billet: '1ST PLT CDR', date_of_rank: '2025-01-01', eaos: '2028-01-01', pme_complete: true, rifle_qual: 'SHARPSHOOTER', rifle_qual_date: '2025-09-15', pft_score: 272, pft_date: '2025-10-01', cft_score: 280, cft_date: '2025-10-01', swim_qual: 'CWS2', security_clearance: 'SECRET', clearance_expiry: '2030-06-01', drivers_license_military: false, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 7, edipi: '1234567896', first_name: 'Marcus', last_name: 'Washington', rank: '2ndLt', unit_id: 4, mos: '0302', pay_grade: 'O1', billet: '2ND PLT CDR', date_of_rank: '2025-06-01', eaos: '2029-06-01', pme_complete: false, rifle_qual: 'MARKSMAN', rifle_qual_date: '2025-09-15', pft_score: 258, pft_date: '2025-10-01', cft_score: 262, cft_date: '2025-10-01', swim_qual: 'CWS3', security_clearance: 'SECRET', clearance_expiry: '2031-01-01', drivers_license_military: false, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 8, edipi: '1234567897', first_name: 'Carlos', last_name: 'Garcia', rank: 'GySgt', unit_id: 4, mos: '0369', pay_grade: 'E7', billet: 'OPS CHIEF', date_of_rank: '2024-07-01', eaos: '2026-04-20', pme_complete: true, rifle_qual: 'EXPERT', rifle_qual_date: '2025-09-10', pft_score: 262, pft_date: '2025-10-01', cft_score: 258, cft_date: '2025-10-01', swim_qual: 'CWS1', security_clearance: 'SECRET', clearance_expiry: '2029-07-01', drivers_license_military: true, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 9, edipi: '1234567898', first_name: 'Brian', last_name: 'Thompson', rank: 'SSgt', unit_id: 4, mos: '0311', pay_grade: 'E6', billet: '1ST PLT SGT', date_of_rank: '2024-01-01', eaos: '2026-05-10', pme_complete: true, rifle_qual: 'EXPERT', rifle_qual_date: '2025-09-10', pft_score: 275, pft_date: '2025-10-01', cft_score: 280, cft_date: '2025-10-01', swim_qual: 'CWS2', security_clearance: 'SECRET', clearance_expiry: '2029-01-01', drivers_license_military: true, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 10, edipi: '1234567899', first_name: 'Jason', last_name: 'Lee', rank: 'SSgt', unit_id: 4, mos: '0311', pay_grade: 'E6', billet: '2ND PLT SGT', date_of_rank: '2024-03-01', eaos: '2027-03-01', pme_complete: true, rifle_qual: 'SHARPSHOOTER', rifle_qual_date: '2025-09-10', pft_score: 268, pft_date: '2025-10-01', cft_score: 265, cft_date: '2025-10-01', swim_qual: 'CWS2', security_clearance: 'CONFIDENTIAL', clearance_expiry: '2028-09-01', drivers_license_military: true, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 11, edipi: '1234567900', first_name: 'Derek', last_name: 'Williams', rank: 'Sgt', unit_id: 4, mos: '0311', pay_grade: 'E5', billet: '1ST SQD LDR', date_of_rank: '2025-01-01', eaos: '2026-08-15', pme_complete: true, rifle_qual: 'EXPERT', rifle_qual_date: '2025-09-10', pft_score: 285, pft_date: '2025-10-01', cft_score: 288, cft_date: '2025-10-01', swim_qual: 'CWS2', security_clearance: 'CONFIDENTIAL', clearance_expiry: '2028-06-01', drivers_license_military: true, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 12, edipi: '1234567901', first_name: 'Tyler', last_name: 'Davis', rank: 'Sgt', unit_id: 4, mos: '0341', pay_grade: 'E5', billet: 'ASSAULTMAN SQD LDR', date_of_rank: '2025-03-01', eaos: '2027-01-15', pme_complete: true, rifle_qual: 'SHARPSHOOTER', rifle_qual_date: '2025-09-10', pft_score: 255, pft_date: '2025-10-01', cft_score: 260, cft_date: '2025-10-01', swim_qual: 'CWS3', security_clearance: 'CONFIDENTIAL', clearance_expiry: '2028-03-01', drivers_license_military: false, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 13, edipi: '1234567902', first_name: 'Eric', last_name: 'Robinson', rank: 'Sgt', unit_id: 4, mos: '0811', pay_grade: 'E5', billet: 'FDC CHIEF', date_of_rank: '2024-11-01', eaos: dateStr(25), pme_complete: true, rifle_qual: 'MARKSMAN', rifle_qual_date: '2025-09-10', pft_score: 248, pft_date: '2025-10-01', cft_score: 252, cft_date: '2025-10-01', swim_qual: 'CWS3', security_clearance: 'SECRET', clearance_expiry: '2029-11-01', drivers_license_military: true, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 14, edipi: '1234567903', first_name: 'Steven', last_name: 'Clark', rank: 'Cpl', unit_id: 4, mos: '0311', pay_grade: 'E4', billet: 'FIRE TM LDR', date_of_rank: '2025-05-01', eaos: dateStr(45), pme_complete: true, rifle_qual: 'EXPERT', rifle_qual_date: '2025-09-10', pft_score: 292, pft_date: '2025-10-01', cft_score: 295, cft_date: '2025-10-01', swim_qual: 'CWS2', security_clearance: 'CONFIDENTIAL', clearance_expiry: '2028-05-01', drivers_license_military: false, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 15, edipi: '1234567904', first_name: 'Ryan', last_name: 'Lewis', rank: 'Cpl', unit_id: 4, mos: '0621', pay_grade: 'E4', billet: 'RADIO OPER', date_of_rank: '2025-04-01', eaos: dateStr(60), pme_complete: true, rifle_qual: 'SHARPSHOOTER', rifle_qual_date: '2025-09-10', pft_score: 260, pft_date: '2025-10-01', cft_score: 255, cft_date: '2025-10-01', swim_qual: 'CWS3', security_clearance: 'SECRET', clearance_expiry: '2029-04-01', drivers_license_military: false, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 16, edipi: '1234567905', first_name: 'Brandon', last_name: 'Walker', rank: 'Cpl', unit_id: 4, mos: '3531', pay_grade: 'E4', billet: 'MVR OPER', date_of_rank: '2025-02-01', eaos: dateStr(75), pme_complete: true, rifle_qual: 'MARKSMAN', rifle_qual_date: '2025-09-10', pft_score: 245, pft_date: '2025-10-01', cft_score: 250, cft_date: '2025-10-01', swim_qual: 'CWS4', security_clearance: 'CONFIDENTIAL', clearance_expiry: '2028-02-01', drivers_license_military: true, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 17, edipi: '1234567906', first_name: 'Justin', last_name: 'Hall', rank: 'LCpl', unit_id: 4, mos: '0311', pay_grade: 'E3', billet: 'RIFLEMAN', date_of_rank: '2025-08-01', eaos: dateStr(15), pme_complete: false, rifle_qual: 'SHARPSHOOTER', rifle_qual_date: '2025-09-10', pft_score: 270, pft_date: '2025-10-01', cft_score: 275, cft_date: '2025-10-01', swim_qual: 'CWS3', security_clearance: 'NONE', clearance_expiry: null, drivers_license_military: false, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 18, edipi: '1234567907', first_name: 'Andrew', last_name: 'Young', rank: 'LCpl', unit_id: 4, mos: '0311', pay_grade: 'E3', billet: 'RIFLEMAN', date_of_rank: '2025-07-01', eaos: '2028-07-01', pme_complete: false, rifle_qual: 'MARKSMAN', rifle_qual_date: '2025-09-10', pft_score: 235, pft_date: '2025-10-01', cft_score: 240, cft_date: '2025-10-01', swim_qual: 'CWS4', security_clearance: 'NONE', clearance_expiry: null, drivers_license_military: false, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 19, edipi: '1234567908', first_name: 'Daniel', last_name: 'King', rank: 'LCpl', unit_id: 4, mos: '0351', pay_grade: 'E3', billet: 'ANTI-ARMOR', date_of_rank: '2025-06-01', eaos: '2028-06-01', pme_complete: false, rifle_qual: 'SHARPSHOOTER', rifle_qual_date: '2025-09-10', pft_score: 265, pft_date: '2025-10-01', cft_score: 268, cft_date: '2025-10-01', swim_qual: 'CWS3', security_clearance: 'CONFIDENTIAL', clearance_expiry: '2028-06-01', drivers_license_military: false, duty_status: 'LIMDU', status: 'MEDICAL' },
  { id: 20, edipi: '1234567909', first_name: 'William', last_name: 'Wright', rank: 'PFC', unit_id: 4, mos: '0311', pay_grade: 'E2', billet: 'RIFLEMAN', date_of_rank: '2025-10-01', eaos: '2029-10-01', pme_complete: false, rifle_qual: 'UNQUAL', rifle_qual_date: null, pft_score: 220, pft_date: '2025-10-01', cft_score: 225, cft_date: '2025-10-01', swim_qual: 'UNQUAL', security_clearance: 'NONE', clearance_expiry: null, drivers_license_military: false, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 21, edipi: '1234567910', first_name: 'Christopher', last_name: 'Scott', rank: 'PFC', unit_id: 4, mos: '0311', pay_grade: 'E2', billet: 'RIFLEMAN', date_of_rank: '2025-09-01', eaos: '2029-09-01', pme_complete: false, rifle_qual: 'MARKSMAN', rifle_qual_date: '2025-11-01', pft_score: 230, pft_date: '2025-10-01', cft_score: 228, cft_date: '2025-10-01', swim_qual: 'CWS4', security_clearance: 'NONE', clearance_expiry: null, drivers_license_military: false, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 22, edipi: '1234567911', first_name: 'Joshua', last_name: 'Adams', rank: 'Sgt', unit_id: 4, mos: '5502', pay_grade: 'E5', billet: 'SUPPLY SGT', date_of_rank: '2024-09-01', eaos: dateStr(55), pme_complete: true, rifle_qual: 'SHARPSHOOTER', rifle_qual_date: '2025-09-10', pft_score: 250, pft_date: '2025-10-01', cft_score: 248, cft_date: '2025-10-01', swim_qual: 'CWS3', security_clearance: 'SECRET', clearance_expiry: '2029-09-01', drivers_license_military: true, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 23, edipi: '1234567912', first_name: 'Matthew', last_name: 'Baker', rank: 'Cpl', unit_id: 4, mos: '0311', pay_grade: 'E4', billet: 'FIRE TM LDR', date_of_rank: '2025-06-01', eaos: dateStr(85), pme_complete: true, rifle_qual: 'EXPERT', rifle_qual_date: '2025-09-10', pft_score: 280, pft_date: '2025-10-01', cft_score: 282, cft_date: '2025-10-01', swim_qual: 'CWS2', security_clearance: 'CONFIDENTIAL', clearance_expiry: '2028-06-01', drivers_license_military: false, duty_status: 'PRESENT', status: 'ACTIVE' },
  { id: 24, edipi: '1234567913', first_name: 'Patrick', last_name: 'Green', rank: 'LCpl', unit_id: 4, mos: '0621', pay_grade: 'E3', billet: 'RADIO OPER', date_of_rank: '2025-09-01', eaos: '2028-09-01', pme_complete: false, rifle_qual: 'SHARPSHOOTER', rifle_qual_date: '2025-09-10', pft_score: 255, pft_date: '2025-10-01', cft_score: 260, cft_date: '2025-10-01', swim_qual: 'CWS3', security_clearance: 'SECRET', clearance_expiry: '2029-09-01', drivers_license_military: false, duty_status: 'PTAD', status: 'TDY' },
  { id: 25, edipi: '1234567914', first_name: 'Nicholas', last_name: 'Hill', rank: 'Pvt', unit_id: 4, mos: '0311', pay_grade: 'E1', billet: 'RIFLEMAN', date_of_rank: '2025-11-01', eaos: '2029-11-01', pme_complete: false, rifle_qual: 'UNQUAL', rifle_qual_date: null, pft_score: 210, pft_date: '2025-10-01', cft_score: 215, cft_date: '2025-10-01', swim_qual: 'UNQUAL', security_clearance: 'NONE', clearance_expiry: null, drivers_license_military: false, duty_status: 'PRESENT', status: 'ACTIVE' },
];

// ---------------------------------------------------------------------------
// Mock Billet Data (~15 records)
// ---------------------------------------------------------------------------

const MOCK_BILLETS: BilletRecord[] = [
  { id: 1, unit_id: 4, billet_id_code: 'BN-001', billet_title: 'BATTALION COMMANDER', mos_required: '0302', rank_required: 'LtCol', is_key_billet: true, is_filled: true, filled_by_id: 1, filled_by_name: 'LtCol Richardson', filled_date: '2024-06-15' },
  { id: 2, unit_id: 4, billet_id_code: 'BN-002', billet_title: 'EXECUTIVE OFFICER', mos_required: '0302', rank_required: 'Maj', is_key_billet: true, is_filled: true, filled_by_id: 2, filled_by_name: 'Maj Torres', filled_date: '2023-09-01' },
  { id: 3, unit_id: 4, billet_id_code: 'BN-003', billet_title: 'BN SERGEANT MAJOR', mos_required: '0369', rank_required: 'SgtMaj', is_key_billet: true, is_filled: true, filled_by_id: 3, filled_by_name: 'SgtMaj Jenkins', filled_date: '2023-02-01' },
  { id: 4, unit_id: 4, billet_id_code: 'BN-004', billet_title: 'S-3 OPERATIONS OFFICER', mos_required: '0302', rank_required: 'Maj', is_key_billet: true, is_filled: false, filled_by_id: null, filled_by_name: undefined, filled_date: null },
  { id: 5, unit_id: 4, billet_id_code: 'BN-005', billet_title: 'S-4 LOGISTICS OFFICER', mos_required: '0402', rank_required: 'Capt', is_key_billet: true, is_filled: false, filled_by_id: null, filled_by_name: undefined, filled_date: null },
  { id: 6, unit_id: 4, billet_id_code: 'A-001', billet_title: 'ALPHA CO COMMANDER', mos_required: '0302', rank_required: 'Capt', is_key_billet: true, is_filled: true, filled_by_id: 4, filled_by_name: 'Capt Nguyen', filled_date: '2024-03-01' },
  { id: 7, unit_id: 4, billet_id_code: 'B-001', billet_title: 'BRAVO CO COMMANDER', mos_required: '0802', rank_required: 'Capt', is_key_billet: true, is_filled: true, filled_by_id: 5, filled_by_name: 'Capt Martinez', filled_date: '2024-05-01' },
  { id: 8, unit_id: 4, billet_id_code: 'A-002', billet_title: '1ST PLATOON COMMANDER', mos_required: '0302', rank_required: '1stLt', is_key_billet: false, is_filled: true, filled_by_id: 6, filled_by_name: '1stLt Brooks', filled_date: '2025-02-01' },
  { id: 9, unit_id: 4, billet_id_code: 'A-003', billet_title: '2ND PLATOON COMMANDER', mos_required: '0302', rank_required: '2ndLt', is_key_billet: false, is_filled: true, filled_by_id: 7, filled_by_name: '2ndLt Washington', filled_date: '2025-07-01' },
  { id: 10, unit_id: 4, billet_id_code: 'BN-006', billet_title: 'OPERATIONS CHIEF', mos_required: '0369', rank_required: 'GySgt', is_key_billet: true, is_filled: true, filled_by_id: 8, filled_by_name: 'GySgt Garcia', filled_date: '2024-08-01' },
  { id: 11, unit_id: 4, billet_id_code: 'A-004', billet_title: '1ST PLATOON SERGEANT', mos_required: '0311', rank_required: 'SSgt', is_key_billet: false, is_filled: true, filled_by_id: 9, filled_by_name: 'SSgt Thompson', filled_date: '2024-02-01' },
  { id: 12, unit_id: 4, billet_id_code: 'A-005', billet_title: '2ND PLATOON SERGEANT', mos_required: '0311', rank_required: 'SSgt', is_key_billet: false, is_filled: true, filled_by_id: 10, filled_by_name: 'SSgt Lee', filled_date: '2024-04-01' },
  { id: 13, unit_id: 4, billet_id_code: 'A-006', billet_title: '1ST SQUAD LEADER', mos_required: '0311', rank_required: 'Sgt', is_key_billet: false, is_filled: true, filled_by_id: 11, filled_by_name: 'Sgt Williams', filled_date: '2025-02-01' },
  { id: 14, unit_id: 4, billet_id_code: 'BN-007', billet_title: 'SUPPLY CHIEF', mos_required: '5502', rank_required: 'GySgt', is_key_billet: true, is_filled: false, filled_by_id: null, filled_by_name: undefined, filled_date: null },
  { id: 15, unit_id: 4, billet_id_code: 'BN-008', billet_title: 'COMMS CHIEF', mos_required: '0621', rank_required: 'SSgt', is_key_billet: true, is_filled: false, filled_by_id: null, filled_by_name: undefined, filled_date: null },
];

// ---------------------------------------------------------------------------
// Mock Manning Snapshots
// ---------------------------------------------------------------------------

const MOCK_SNAPSHOTS: ManningSnapshotRecord[] = [
  { id: 1, unit_id: 4, snapshot_date: dateStr(-90), authorized_total: 180, assigned_total: 155, present_for_duty: 142, fill_rate_pct: 86.1, mos_shortfalls: { '0302': 1, '0402': 1, '0621': 2 }, rank_distribution: { E1: 3, E2: 8, E3: 25, E4: 22, E5: 18, E6: 10, E7: 5, E8: 1, E9: 1, O1: 2, O2: 3, O3: 4, O4: 1, O5: 1 } },
  { id: 2, unit_id: 4, snapshot_date: dateStr(-60), authorized_total: 180, assigned_total: 158, present_for_duty: 145, fill_rate_pct: 87.8, mos_shortfalls: { '0302': 1, '0402': 1, '0621': 1 }, rank_distribution: { E1: 3, E2: 8, E3: 26, E4: 23, E5: 18, E6: 10, E7: 5, E8: 1, E9: 1, O1: 2, O2: 3, O3: 4, O4: 1, O5: 1 } },
  { id: 3, unit_id: 4, snapshot_date: dateStr(-30), authorized_total: 180, assigned_total: 160, present_for_duty: 148, fill_rate_pct: 88.9, mos_shortfalls: { '0402': 1, '0621': 1, '5502': 1 }, rank_distribution: { E1: 2, E2: 8, E3: 27, E4: 24, E5: 18, E6: 10, E7: 5, E8: 1, E9: 1, O1: 2, O2: 3, O3: 4, O4: 1, O5: 1 } },
  { id: 4, unit_id: 4, snapshot_date: dateStr(0), authorized_total: 180, assigned_total: 162, present_for_duty: 150, fill_rate_pct: 90.0, mos_shortfalls: { '0402': 1, '0621': 1, '5502': 1, '0302': 1 }, rank_distribution: { E1: 2, E2: 7, E3: 28, E4: 25, E5: 18, E6: 10, E7: 5, E8: 1, E9: 1, O1: 2, O2: 3, O3: 4, O4: 1, O5: 1 } },
];

// ---------------------------------------------------------------------------
// Mock Unit Strength
// ---------------------------------------------------------------------------

const MOCK_UNIT_STRENGTH: UnitStrengthData = {
  total_authorized: 180,
  total_assigned: 162,
  present_for_duty: 150,
  deployed: 0,
  tdy: 5,
  leave: 3,
  medical: 2,
  inactive: 2,
  fill_rate_pct: 90.0,
};

// ---------------------------------------------------------------------------
// Mock MOS Fill
// ---------------------------------------------------------------------------

const MOCK_MOS_FILL: Record<string, MOSFillData> = {
  '0311 — Infantry': { required: 80, assigned: 74, shortfall: 6 },
  '0341 — Mortarman': { required: 12, assigned: 10, shortfall: 2 },
  '0351 — Anti-Armor': { required: 8, assigned: 7, shortfall: 1 },
  '0811 — Cannoneer': { required: 16, assigned: 14, shortfall: 2 },
  '0621 — Radio Oper': { required: 10, assigned: 8, shortfall: 2 },
  '3531 — MVR Oper': { required: 12, assigned: 11, shortfall: 1 },
  '5502 — Supply': { required: 6, assigned: 4, shortfall: 2 },
  '0302 — Inf Officer': { required: 8, assigned: 7, shortfall: 1 },
  '0402 — Log Officer': { required: 2, assigned: 1, shortfall: 1 },
  '0369 — Inf Unit Ldr': { required: 4, assigned: 4, shortfall: 0 },
  '0802 — Arty Officer': { required: 2, assigned: 2, shortfall: 0 },
};

// ---------------------------------------------------------------------------
// Mock Qualification Status
// ---------------------------------------------------------------------------

const MOCK_QUAL_STATUS: Record<string, QualStatusData> = {
  'Rifle Range': { total: 162, current: 148, percent: 91.4 },
  PFT: { total: 162, current: 155, percent: 95.7 },
  CFT: { total: 162, current: 155, percent: 95.7 },
  'Swim Qual': { total: 162, current: 130, percent: 80.2 },
};

// ---------------------------------------------------------------------------
// Mock Personnel Readiness
// ---------------------------------------------------------------------------

const MOCK_READINESS: PersonnelReadinessData = {
  p_rating: 'P2',
  percent_ready: 88.5,
  fill_rate_pct: 90.0,
  qualification_pct: 90.8,
  fitness_pct: 95.7,
};

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getPersonnelList(unitId?: number): Promise<PersonnelRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    if (unitId) {
      return MOCK_PERSONNEL.filter((p) => p.unit_id === unitId);
    }
    return [...MOCK_PERSONNEL];
  }
  const response = await apiClient.get<{ data: PersonnelRecord[] }>('/personnel', {
    params: unitId ? { unit_id: unitId } : undefined,
  });
  return response.data.data;
}

export async function getUnitStrength(_unitId: number): Promise<UnitStrengthData> {
  if (isDemoMode) {
    await mockDelay();
    return { ...MOCK_UNIT_STRENGTH };
  }
  const response = await apiClient.get<{ data: UnitStrengthData }>(`/units/${_unitId}/strength`);
  return response.data.data;
}

export async function getMOSFill(_unitId: number): Promise<Record<string, MOSFillData>> {
  if (isDemoMode) {
    await mockDelay();
    return { ...MOCK_MOS_FILL };
  }
  const response = await apiClient.get<{ data: Record<string, MOSFillData> }>(`/units/${_unitId}/mos-fill`);
  return response.data.data;
}

export async function getQualificationStatus(_unitId: number): Promise<Record<string, QualStatusData>> {
  if (isDemoMode) {
    await mockDelay();
    return { ...MOCK_QUAL_STATUS };
  }
  const response = await apiClient.get<{ data: Record<string, QualStatusData> }>(`/units/${_unitId}/qual-status`);
  return response.data.data;
}

export async function getPersonnelReadiness(_unitId: number): Promise<PersonnelReadinessData> {
  if (isDemoMode) {
    await mockDelay();
    return { ...MOCK_READINESS };
  }
  const response = await apiClient.get<{ data: PersonnelReadinessData }>(`/units/${_unitId}/personnel-readiness`);
  return response.data.data;
}

export async function getUpcomingLosses(_unitId: number, days = 90): Promise<EASRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    return MOCK_PERSONNEL
      .filter((p) => {
        if (!p.eaos) return false;
        const eaosDate = new Date(p.eaos);
        return eaosDate >= now && eaosDate <= cutoff;
      })
      .map((p) => {
        const eaosDate = new Date(p.eaos!);
        const diffMs = eaosDate.getTime() - now.getTime();
        const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
          id: p.id,
          edipi: p.edipi,
          first_name: p.first_name,
          last_name: p.last_name,
          rank: p.rank ?? '',
          mos: p.mos ?? '',
          pay_grade: p.pay_grade,
          billet: p.billet,
          eaos: p.eaos!,
          days_until_eas: daysUntil,
        };
      })
      .sort((a, b) => a.days_until_eas - b.days_until_eas);
  }
  const response = await apiClient.get<{ data: EASRecord[] }>(`/units/${_unitId}/upcoming-losses`, {
    params: { days },
  });
  return response.data.data;
}

export async function getBillets(unitId: number): Promise<BilletRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_BILLETS.filter((b) => b.unit_id === unitId);
  }
  const response = await apiClient.get<{ data: BilletRecord[] }>(`/units/${unitId}/billets`);
  return response.data.data;
}

export async function getBilletVacancies(unitId: number): Promise<BilletRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_BILLETS.filter((b) => b.unit_id === unitId && !b.is_filled && b.is_key_billet);
  }
  const response = await apiClient.get<{ data: BilletRecord[] }>(`/units/${unitId}/billets/vacancies`);
  return response.data.data;
}

export async function getManningSnapshots(unitId: number): Promise<ManningSnapshotRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_SNAPSHOTS.filter((s) => s.unit_id === unitId);
  }
  const response = await apiClient.get<{ data: ManningSnapshotRecord[] }>(`/units/${unitId}/manning-snapshots`);
  return response.data.data;
}
