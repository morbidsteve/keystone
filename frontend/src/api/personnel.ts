// =============================================================================
// KEYSTONE Personnel & Manning — API functions
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';
import type {
  PersonnelRecord,
  BilletRecord,
  QualificationRecord,
  ManningSnapshotRecord,
  UnitStrengthData,
  MOSFillData,
  QualStatusData,
  PersonnelReadinessData,
  EASRecord,
  QualifiedPersonnelItem,
  QualifiedPersonnelResponse,
  ValidateAssignmentRequest,
  ValidateAssignmentResponse,
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

let MOCK_PERSONNEL: PersonnelRecord[] = [
  { id: 1, edipi: '1234567890', firstName: 'James', lastName: 'Richardson', rank: 'LtCol', unitId: 4, mos: '0302', payGrade: 'O5', billet: 'BN CDR', dateOfRank: '2024-06-01', eaos: '2028-06-01', pmeComplete: true, rifleQual: 'EXPERT', rifleQualDate: '2025-09-15', pftScore: 285, pftDate: '2025-10-01', cftScore: 290, cftDate: '2025-10-01', swimQual: 'CWS1', securityClearance: 'SECRET', clearanceExpiry: '2030-01-01', driversLicenseMilitary: true, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 2, edipi: '1234567891', firstName: 'Michael', lastName: 'Torres', rank: 'Maj', unitId: 4, mos: '0302', payGrade: 'O4', billet: 'XO', dateOfRank: '2023-08-01', eaos: '2027-08-01', pmeComplete: true, rifleQual: 'EXPERT', rifleQualDate: '2025-09-15', pftScore: 278, pftDate: '2025-10-01', cftScore: 275, cftDate: '2025-10-01', swimQual: 'CWS1', securityClearance: 'SECRET', clearanceExpiry: '2029-05-01', driversLicenseMilitary: true, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 3, edipi: '1234567892', firstName: 'Robert', lastName: 'Jenkins', rank: 'SgtMaj', unitId: 4, mos: '0369', payGrade: 'E9', billet: 'BN SGTMAJ', dateOfRank: '2023-01-01', eaos: '2027-01-01', pmeComplete: true, rifleQual: 'EXPERT', rifleQualDate: '2025-09-10', pftScore: 270, pftDate: '2025-10-01', cftScore: 268, cftDate: '2025-10-01', swimQual: 'CWS1', securityClearance: 'SECRET', clearanceExpiry: '2029-03-01', driversLicenseMilitary: true, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 4, edipi: '1234567893', firstName: 'David', lastName: 'Nguyen', rank: 'Capt', unitId: 4, mos: '0302', payGrade: 'O3', billet: 'ALPHA CO CDR', dateOfRank: '2024-02-01', eaos: '2026-06-15', pmeComplete: true, rifleQual: 'SHARPSHOOTER', rifleQualDate: '2025-09-15', pftScore: 265, pftDate: '2025-10-01', cftScore: 270, cftDate: '2025-10-01', swimQual: 'CWS2', securityClearance: 'SECRET', clearanceExpiry: '2030-02-01', driversLicenseMilitary: true, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 5, edipi: '1234567894', firstName: 'Kevin', lastName: 'Martinez', rank: 'Capt', unitId: 4, mos: '0802', payGrade: 'O3', billet: 'BRAVO CO CDR', dateOfRank: '2024-04-01', eaos: '2027-04-01', pmeComplete: true, rifleQual: 'EXPERT', rifleQualDate: '2025-09-15', pftScore: 290, pftDate: '2025-10-01', cftScore: 285, cftDate: '2025-10-01', swimQual: 'CWS1', securityClearance: 'SECRET', clearanceExpiry: '2029-11-01', driversLicenseMilitary: true, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 6, edipi: '1234567895', firstName: 'Anthony', lastName: 'Brooks', rank: '1stLt', unitId: 4, mos: '0302', payGrade: 'O2', billet: '1ST PLT CDR', dateOfRank: '2025-01-01', eaos: '2028-01-01', pmeComplete: true, rifleQual: 'SHARPSHOOTER', rifleQualDate: '2025-09-15', pftScore: 272, pftDate: '2025-10-01', cftScore: 280, cftDate: '2025-10-01', swimQual: 'CWS2', securityClearance: 'SECRET', clearanceExpiry: '2030-06-01', driversLicenseMilitary: false, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 7, edipi: '1234567896', firstName: 'Marcus', lastName: 'Washington', rank: '2ndLt', unitId: 4, mos: '0302', payGrade: 'O1', billet: '2ND PLT CDR', dateOfRank: '2025-06-01', eaos: '2029-06-01', pmeComplete: false, rifleQual: 'MARKSMAN', rifleQualDate: '2025-09-15', pftScore: 258, pftDate: '2025-10-01', cftScore: 262, cftDate: '2025-10-01', swimQual: 'CWS3', securityClearance: 'SECRET', clearanceExpiry: '2031-01-01', driversLicenseMilitary: false, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 8, edipi: '1234567897', firstName: 'Carlos', lastName: 'Garcia', rank: 'GySgt', unitId: 4, mos: '0369', payGrade: 'E7', billet: 'OPS CHIEF', dateOfRank: '2024-07-01', eaos: '2026-04-20', pmeComplete: true, rifleQual: 'EXPERT', rifleQualDate: '2025-09-10', pftScore: 262, pftDate: '2025-10-01', cftScore: 258, cftDate: '2025-10-01', swimQual: 'CWS1', securityClearance: 'SECRET', clearanceExpiry: '2029-07-01', driversLicenseMilitary: true, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 9, edipi: '1234567898', firstName: 'Brian', lastName: 'Thompson', rank: 'SSgt', unitId: 4, mos: '0311', payGrade: 'E6', billet: '1ST PLT SGT', dateOfRank: '2024-01-01', eaos: '2026-05-10', pmeComplete: true, rifleQual: 'EXPERT', rifleQualDate: '2025-09-10', pftScore: 275, pftDate: '2025-10-01', cftScore: 280, cftDate: '2025-10-01', swimQual: 'CWS2', securityClearance: 'SECRET', clearanceExpiry: '2029-01-01', driversLicenseMilitary: true, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 10, edipi: '1234567899', firstName: 'Jason', lastName: 'Lee', rank: 'SSgt', unitId: 4, mos: '0311', payGrade: 'E6', billet: '2ND PLT SGT', dateOfRank: '2024-03-01', eaos: '2027-03-01', pmeComplete: true, rifleQual: 'SHARPSHOOTER', rifleQualDate: '2025-09-10', pftScore: 268, pftDate: '2025-10-01', cftScore: 265, cftDate: '2025-10-01', swimQual: 'CWS2', securityClearance: 'CONFIDENTIAL', clearanceExpiry: '2028-09-01', driversLicenseMilitary: true, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 11, edipi: '1234567900', firstName: 'Derek', lastName: 'Williams', rank: 'Sgt', unitId: 4, mos: '0311', payGrade: 'E5', billet: '1ST SQD LDR', dateOfRank: '2025-01-01', eaos: '2026-08-15', pmeComplete: true, rifleQual: 'EXPERT', rifleQualDate: '2025-09-10', pftScore: 285, pftDate: '2025-10-01', cftScore: 288, cftDate: '2025-10-01', swimQual: 'CWS2', securityClearance: 'CONFIDENTIAL', clearanceExpiry: '2028-06-01', driversLicenseMilitary: true, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 12, edipi: '1234567901', firstName: 'Tyler', lastName: 'Davis', rank: 'Sgt', unitId: 4, mos: '0341', payGrade: 'E5', billet: 'ASSAULTMAN SQD LDR', dateOfRank: '2025-03-01', eaos: '2027-01-15', pmeComplete: true, rifleQual: 'SHARPSHOOTER', rifleQualDate: '2025-09-10', pftScore: 255, pftDate: '2025-10-01', cftScore: 260, cftDate: '2025-10-01', swimQual: 'CWS3', securityClearance: 'CONFIDENTIAL', clearanceExpiry: '2028-03-01', driversLicenseMilitary: false, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 13, edipi: '1234567902', firstName: 'Eric', lastName: 'Robinson', rank: 'Sgt', unitId: 4, mos: '0811', payGrade: 'E5', billet: 'FDC CHIEF', dateOfRank: '2024-11-01', eaos: dateStr(25), pmeComplete: true, rifleQual: 'MARKSMAN', rifleQualDate: '2025-09-10', pftScore: 248, pftDate: '2025-10-01', cftScore: 252, cftDate: '2025-10-01', swimQual: 'CWS3', securityClearance: 'SECRET', clearanceExpiry: '2029-11-01', driversLicenseMilitary: true, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 14, edipi: '1234567903', firstName: 'Steven', lastName: 'Clark', rank: 'Cpl', unitId: 4, mos: '0311', payGrade: 'E4', billet: 'FIRE TM LDR', dateOfRank: '2025-05-01', eaos: dateStr(45), pmeComplete: true, rifleQual: 'EXPERT', rifleQualDate: '2025-09-10', pftScore: 292, pftDate: '2025-10-01', cftScore: 295, cftDate: '2025-10-01', swimQual: 'CWS2', securityClearance: 'CONFIDENTIAL', clearanceExpiry: '2028-05-01', driversLicenseMilitary: false, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 15, edipi: '1234567904', firstName: 'Ryan', lastName: 'Lewis', rank: 'Cpl', unitId: 4, mos: '0621', payGrade: 'E4', billet: 'RADIO OPER', dateOfRank: '2025-04-01', eaos: dateStr(60), pmeComplete: true, rifleQual: 'SHARPSHOOTER', rifleQualDate: '2025-09-10', pftScore: 260, pftDate: '2025-10-01', cftScore: 255, cftDate: '2025-10-01', swimQual: 'CWS3', securityClearance: 'SECRET', clearanceExpiry: '2029-04-01', driversLicenseMilitary: false, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 16, edipi: '1234567905', firstName: 'Brandon', lastName: 'Walker', rank: 'Cpl', unitId: 4, mos: '3531', payGrade: 'E4', billet: 'MVR OPER', dateOfRank: '2025-02-01', eaos: dateStr(75), pmeComplete: true, rifleQual: 'MARKSMAN', rifleQualDate: '2025-09-10', pftScore: 245, pftDate: '2025-10-01', cftScore: 250, cftDate: '2025-10-01', swimQual: 'CWS4', securityClearance: 'CONFIDENTIAL', clearanceExpiry: '2028-02-01', driversLicenseMilitary: true, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 17, edipi: '1234567906', firstName: 'Justin', lastName: 'Hall', rank: 'LCpl', unitId: 4, mos: '0311', payGrade: 'E3', billet: 'RIFLEMAN', dateOfRank: '2025-08-01', eaos: dateStr(15), pmeComplete: false, rifleQual: 'SHARPSHOOTER', rifleQualDate: '2025-09-10', pftScore: 270, pftDate: '2025-10-01', cftScore: 275, cftDate: '2025-10-01', swimQual: 'CWS3', securityClearance: 'NONE', clearanceExpiry: null, driversLicenseMilitary: false, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 18, edipi: '1234567907', firstName: 'Andrew', lastName: 'Young', rank: 'LCpl', unitId: 4, mos: '0311', payGrade: 'E3', billet: 'RIFLEMAN', dateOfRank: '2025-07-01', eaos: '2028-07-01', pmeComplete: false, rifleQual: 'MARKSMAN', rifleQualDate: '2025-09-10', pftScore: 235, pftDate: '2025-10-01', cftScore: 240, cftDate: '2025-10-01', swimQual: 'CWS4', securityClearance: 'NONE', clearanceExpiry: null, driversLicenseMilitary: false, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 19, edipi: '1234567908', firstName: 'Daniel', lastName: 'King', rank: 'LCpl', unitId: 4, mos: '0351', payGrade: 'E3', billet: 'ANTI-ARMOR', dateOfRank: '2025-06-01', eaos: '2028-06-01', pmeComplete: false, rifleQual: 'SHARPSHOOTER', rifleQualDate: '2025-09-10', pftScore: 265, pftDate: '2025-10-01', cftScore: 268, cftDate: '2025-10-01', swimQual: 'CWS3', securityClearance: 'CONFIDENTIAL', clearanceExpiry: '2028-06-01', driversLicenseMilitary: false, dutyStatus: 'LIMDU', status: 'MEDICAL' },
  { id: 20, edipi: '1234567909', firstName: 'William', lastName: 'Wright', rank: 'PFC', unitId: 4, mos: '0311', payGrade: 'E2', billet: 'RIFLEMAN', dateOfRank: '2025-10-01', eaos: '2029-10-01', pmeComplete: false, rifleQual: 'UNQUAL', rifleQualDate: null, pftScore: 220, pftDate: '2025-10-01', cftScore: 225, cftDate: '2025-10-01', swimQual: 'UNQUAL', securityClearance: 'NONE', clearanceExpiry: null, driversLicenseMilitary: false, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 21, edipi: '1234567910', firstName: 'Christopher', lastName: 'Scott', rank: 'PFC', unitId: 4, mos: '0311', payGrade: 'E2', billet: 'RIFLEMAN', dateOfRank: '2025-09-01', eaos: '2029-09-01', pmeComplete: false, rifleQual: 'MARKSMAN', rifleQualDate: '2025-11-01', pftScore: 230, pftDate: '2025-10-01', cftScore: 228, cftDate: '2025-10-01', swimQual: 'CWS4', securityClearance: 'NONE', clearanceExpiry: null, driversLicenseMilitary: false, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 22, edipi: '1234567911', firstName: 'Joshua', lastName: 'Adams', rank: 'Sgt', unitId: 4, mos: '5502', payGrade: 'E5', billet: 'SUPPLY SGT', dateOfRank: '2024-09-01', eaos: dateStr(55), pmeComplete: true, rifleQual: 'SHARPSHOOTER', rifleQualDate: '2025-09-10', pftScore: 250, pftDate: '2025-10-01', cftScore: 248, cftDate: '2025-10-01', swimQual: 'CWS3', securityClearance: 'SECRET', clearanceExpiry: '2029-09-01', driversLicenseMilitary: true, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 23, edipi: '1234567912', firstName: 'Matthew', lastName: 'Baker', rank: 'Cpl', unitId: 4, mos: '0311', payGrade: 'E4', billet: 'FIRE TM LDR', dateOfRank: '2025-06-01', eaos: dateStr(85), pmeComplete: true, rifleQual: 'EXPERT', rifleQualDate: '2025-09-10', pftScore: 280, pftDate: '2025-10-01', cftScore: 282, cftDate: '2025-10-01', swimQual: 'CWS2', securityClearance: 'CONFIDENTIAL', clearanceExpiry: '2028-06-01', driversLicenseMilitary: false, dutyStatus: 'PRESENT', status: 'ACTIVE' },
  { id: 24, edipi: '1234567913', firstName: 'Patrick', lastName: 'Green', rank: 'LCpl', unitId: 4, mos: '0621', payGrade: 'E3', billet: 'RADIO OPER', dateOfRank: '2025-09-01', eaos: '2028-09-01', pmeComplete: false, rifleQual: 'SHARPSHOOTER', rifleQualDate: '2025-09-10', pftScore: 255, pftDate: '2025-10-01', cftScore: 260, cftDate: '2025-10-01', swimQual: 'CWS3', securityClearance: 'SECRET', clearanceExpiry: '2029-09-01', driversLicenseMilitary: false, dutyStatus: 'PTAD', status: 'TDY' },
  { id: 25, edipi: '1234567914', firstName: 'Nicholas', lastName: 'Hill', rank: 'Pvt', unitId: 4, mos: '0311', payGrade: 'E1', billet: 'RIFLEMAN', dateOfRank: '2025-11-01', eaos: '2029-11-01', pmeComplete: false, rifleQual: 'UNQUAL', rifleQualDate: null, pftScore: 210, pftDate: '2025-10-01', cftScore: 215, cftDate: '2025-10-01', swimQual: 'UNQUAL', securityClearance: 'NONE', clearanceExpiry: null, driversLicenseMilitary: false, dutyStatus: 'PRESENT', status: 'ACTIVE' },
];

// ---------------------------------------------------------------------------
// Mock Billet Data (~15 records)
// ---------------------------------------------------------------------------

let MOCK_BILLETS: BilletRecord[] = [
  { id: 1, unitId: 4, billetIdCode: 'BN-001', billetTitle: 'BATTALION COMMANDER', mosRequired: '0302', rankRequired: 'LtCol', isKeyBillet: true, isFilled: true, filledById: 1, filledByName: 'LtCol Richardson', filledDate: '2024-06-15' },
  { id: 2, unitId: 4, billetIdCode: 'BN-002', billetTitle: 'EXECUTIVE OFFICER', mosRequired: '0302', rankRequired: 'Maj', isKeyBillet: true, isFilled: true, filledById: 2, filledByName: 'Maj Torres', filledDate: '2023-09-01' },
  { id: 3, unitId: 4, billetIdCode: 'BN-003', billetTitle: 'BN SERGEANT MAJOR', mosRequired: '0369', rankRequired: 'SgtMaj', isKeyBillet: true, isFilled: true, filledById: 3, filledByName: 'SgtMaj Jenkins', filledDate: '2023-02-01' },
  { id: 4, unitId: 4, billetIdCode: 'BN-004', billetTitle: 'S-3 OPERATIONS OFFICER', mosRequired: '0302', rankRequired: 'Maj', isKeyBillet: true, isFilled: false, filledById: null, filledByName: undefined, filledDate: null },
  { id: 5, unitId: 4, billetIdCode: 'BN-005', billetTitle: 'S-4 LOGISTICS OFFICER', mosRequired: '0402', rankRequired: 'Capt', isKeyBillet: true, isFilled: false, filledById: null, filledByName: undefined, filledDate: null },
  { id: 6, unitId: 4, billetIdCode: 'A-001', billetTitle: 'ALPHA CO COMMANDER', mosRequired: '0302', rankRequired: 'Capt', isKeyBillet: true, isFilled: true, filledById: 4, filledByName: 'Capt Nguyen', filledDate: '2024-03-01' },
  { id: 7, unitId: 4, billetIdCode: 'B-001', billetTitle: 'BRAVO CO COMMANDER', mosRequired: '0802', rankRequired: 'Capt', isKeyBillet: true, isFilled: true, filledById: 5, filledByName: 'Capt Martinez', filledDate: '2024-05-01' },
  { id: 8, unitId: 4, billetIdCode: 'A-002', billetTitle: '1ST PLATOON COMMANDER', mosRequired: '0302', rankRequired: '1stLt', isKeyBillet: false, isFilled: true, filledById: 6, filledByName: '1stLt Brooks', filledDate: '2025-02-01' },
  { id: 9, unitId: 4, billetIdCode: 'A-003', billetTitle: '2ND PLATOON COMMANDER', mosRequired: '0302', rankRequired: '2ndLt', isKeyBillet: false, isFilled: true, filledById: 7, filledByName: '2ndLt Washington', filledDate: '2025-07-01' },
  { id: 10, unitId: 4, billetIdCode: 'BN-006', billetTitle: 'OPERATIONS CHIEF', mosRequired: '0369', rankRequired: 'GySgt', isKeyBillet: true, isFilled: true, filledById: 8, filledByName: 'GySgt Garcia', filledDate: '2024-08-01' },
  { id: 11, unitId: 4, billetIdCode: 'A-004', billetTitle: '1ST PLATOON SERGEANT', mosRequired: '0311', rankRequired: 'SSgt', isKeyBillet: false, isFilled: true, filledById: 9, filledByName: 'SSgt Thompson', filledDate: '2024-02-01' },
  { id: 12, unitId: 4, billetIdCode: 'A-005', billetTitle: '2ND PLATOON SERGEANT', mosRequired: '0311', rankRequired: 'SSgt', isKeyBillet: false, isFilled: true, filledById: 10, filledByName: 'SSgt Lee', filledDate: '2024-04-01' },
  { id: 13, unitId: 4, billetIdCode: 'A-006', billetTitle: '1ST SQUAD LEADER', mosRequired: '0311', rankRequired: 'Sgt', isKeyBillet: false, isFilled: true, filledById: 11, filledByName: 'Sgt Williams', filledDate: '2025-02-01' },
  { id: 14, unitId: 4, billetIdCode: 'BN-007', billetTitle: 'SUPPLY CHIEF', mosRequired: '5502', rankRequired: 'GySgt', isKeyBillet: true, isFilled: false, filledById: null, filledByName: undefined, filledDate: null },
  { id: 15, unitId: 4, billetIdCode: 'BN-008', billetTitle: 'COMMS CHIEF', mosRequired: '0621', rankRequired: 'SSgt', isKeyBillet: true, isFilled: false, filledById: null, filledByName: undefined, filledDate: null },
];

// ---------------------------------------------------------------------------
// Mock Manning Snapshots
// ---------------------------------------------------------------------------

const MOCK_SNAPSHOTS: ManningSnapshotRecord[] = [
  { id: 1, unitId: 4, snapshotDate: dateStr(-90), authorizedTotal: 180, assignedTotal: 155, presentForDuty: 142, fillRatePct: 86.1, mosShortfalls: { '0302': 1, '0402': 1, '0621': 2 }, rankDistribution: { E1: 3, E2: 8, E3: 25, E4: 22, E5: 18, E6: 10, E7: 5, E8: 1, E9: 1, O1: 2, O2: 3, O3: 4, O4: 1, O5: 1 } },
  { id: 2, unitId: 4, snapshotDate: dateStr(-60), authorizedTotal: 180, assignedTotal: 158, presentForDuty: 145, fillRatePct: 87.8, mosShortfalls: { '0302': 1, '0402': 1, '0621': 1 }, rankDistribution: { E1: 3, E2: 8, E3: 26, E4: 23, E5: 18, E6: 10, E7: 5, E8: 1, E9: 1, O1: 2, O2: 3, O3: 4, O4: 1, O5: 1 } },
  { id: 3, unitId: 4, snapshotDate: dateStr(-30), authorizedTotal: 180, assignedTotal: 160, presentForDuty: 148, fillRatePct: 88.9, mosShortfalls: { '0402': 1, '0621': 1, '5502': 1 }, rankDistribution: { E1: 2, E2: 8, E3: 27, E4: 24, E5: 18, E6: 10, E7: 5, E8: 1, E9: 1, O1: 2, O2: 3, O3: 4, O4: 1, O5: 1 } },
  { id: 4, unitId: 4, snapshotDate: dateStr(0), authorizedTotal: 180, assignedTotal: 162, presentForDuty: 150, fillRatePct: 90.0, mosShortfalls: { '0402': 1, '0621': 1, '5502': 1, '0302': 1 }, rankDistribution: { E1: 2, E2: 7, E3: 28, E4: 25, E5: 18, E6: 10, E7: 5, E8: 1, E9: 1, O1: 2, O2: 3, O3: 4, O4: 1, O5: 1 } },
];

// ---------------------------------------------------------------------------
// Mock Unit Strength
// ---------------------------------------------------------------------------

const MOCK_UNIT_STRENGTH: UnitStrengthData = {
  totalAuthorized: 180,
  totalAssigned: 162,
  presentForDuty: 150,
  deployed: 0,
  tdy: 5,
  leave: 3,
  medical: 2,
  inactive: 2,
  fillRatePct: 90.0,
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
  pRating: 'P2',
  percentReady: 88.5,
  fillRatePct: 90.0,
  qualificationPct: 90.8,
  fitnessPct: 95.7,
};

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getPersonnelList(unitId?: number): Promise<PersonnelRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    if (unitId) {
      return MOCK_PERSONNEL.filter((p) => p.unitId === unitId);
    }
    return [...MOCK_PERSONNEL];
  }
  const response = await apiClient.get<{ data: PersonnelRecord[] }>('/personnel', {
    params: unitId ? { unitId: unitId } : undefined,
  });
  return response.data.data;
}

export async function getUnitStrength(_unitId: number): Promise<UnitStrengthData> {
  if (isDemoMode) {
    await mockDelay();
    return { ...MOCK_UNIT_STRENGTH };
  }
  const response = await apiClient.get<{ data: UnitStrengthData }>(`/personnel/strength/${_unitId}`);
  return response.data.data;
}

export async function getMOSFill(_unitId: number): Promise<Record<string, MOSFillData>> {
  if (isDemoMode) {
    await mockDelay();
    return { ...MOCK_MOS_FILL };
  }
  const response = await apiClient.get<{ data: Record<string, MOSFillData> }>(`/personnel/mos-fill/${_unitId}`);
  return response.data.data;
}

export async function getQualificationStatus(_unitId: number): Promise<Record<string, QualStatusData>> {
  if (isDemoMode) {
    await mockDelay();
    return { ...MOCK_QUAL_STATUS };
  }
  // No backend endpoint for qual-status yet — return empty for graceful degradation
  return {};
}

export async function getPersonnelReadiness(_unitId: number): Promise<PersonnelReadinessData> {
  if (isDemoMode) {
    await mockDelay();
    return { ...MOCK_READINESS };
  }
  const response = await apiClient.get<{ data: PersonnelReadinessData }>(`/personnel/readiness/${_unitId}`);
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
          firstName: p.firstName,
          lastName: p.lastName,
          rank: p.rank ?? '',
          mos: p.mos ?? '',
          payGrade: p.payGrade,
          billet: p.billet,
          eaos: p.eaos!,
          daysUntilEas: daysUntil,
        };
      })
      .sort((a, b) => a.daysUntilEas - b.daysUntilEas);
  }
  const response = await apiClient.get<{ data: EASRecord[] }>(`/personnel/upcoming-losses/${_unitId}`, {
    params: { days },
  });
  return response.data.data;
}

export async function getBillets(unitId: number): Promise<BilletRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_BILLETS.filter((b) => b.unitId === unitId);
  }
  const response = await apiClient.get<{ data: BilletRecord[] }>(`/manning/billets/${unitId}`);
  return response.data.data;
}

export async function getBilletVacancies(unitId: number): Promise<BilletRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_BILLETS.filter((b) => b.unitId === unitId && !b.isFilled && b.isKeyBillet);
  }
  const response = await apiClient.get<{ data: BilletRecord[] }>(`/manning/billets/${unitId}/vacancies`);
  return response.data.data;
}

export async function getManningSnapshots(unitId: number): Promise<ManningSnapshotRecord[]> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_SNAPSHOTS.filter((s) => s.unitId === unitId);
  }
  const response = await apiClient.get<{ data: ManningSnapshotRecord[] }>(`/manning/snapshots/${unitId}`);
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Personnel CRUD
// ---------------------------------------------------------------------------

let mockQualifications: QualificationRecord[] = [];

export async function getPersonnelDetail(id: number): Promise<PersonnelRecord> {
  if (isDemoMode) {
    await mockDelay();
    const found = MOCK_PERSONNEL.find((p) => p.id === id);
    if (!found) throw new Error(`Personnel ${id} not found`);
    return { ...found };
  }
  const response = await apiClient.get<{ data: PersonnelRecord }>(`/personnel/${id}`);
  return response.data.data;
}

export async function createPersonnel(data: Partial<PersonnelRecord>): Promise<PersonnelRecord> {
  if (isDemoMode) {
    await mockDelay();
    const maxId = MOCK_PERSONNEL.reduce((m, p) => Math.max(m, p.id), 0);
    const record: PersonnelRecord = {
      id: maxId + 1,
      edipi: data.edipi ?? '',
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      rank: data.rank ?? null,
      unitId: data.unitId ?? null,
      mos: data.mos ?? null,
      payGrade: data.payGrade ?? null,
      billet: data.billet ?? null,
      dateOfRank: data.dateOfRank ?? null,
      eaos: data.eaos ?? null,
      pmeComplete: data.pmeComplete ?? false,
      rifleQual: data.rifleQual ?? null,
      rifleQualDate: data.rifleQualDate ?? null,
      pftScore: data.pftScore ?? null,
      pftDate: data.pftDate ?? null,
      cftScore: data.cftScore ?? null,
      cftDate: data.cftDate ?? null,
      swimQual: data.swimQual ?? null,
      securityClearance: data.securityClearance ?? null,
      clearanceExpiry: data.clearanceExpiry ?? null,
      driversLicenseMilitary: data.driversLicenseMilitary ?? false,
      dutyStatus: data.dutyStatus ?? 'PRESENT',
      status: data.status ?? 'ACTIVE',
    };
    MOCK_PERSONNEL = [...MOCK_PERSONNEL, record];
    return record;
  }
  const response = await apiClient.post<{ data: PersonnelRecord }>('/personnel', data);
  return response.data.data;
}

export async function updatePersonnel(id: number, data: Partial<PersonnelRecord>): Promise<PersonnelRecord> {
  if (isDemoMode) {
    await mockDelay();
    const idx = MOCK_PERSONNEL.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Personnel ${id} not found`);
    const updated = { ...MOCK_PERSONNEL[idx], ...data, id };
    MOCK_PERSONNEL = MOCK_PERSONNEL.map((p) => (p.id === id ? updated : p));
    return updated;
  }
  const response = await apiClient.put<{ data: PersonnelRecord }>(`/personnel/${id}`, data);
  return response.data.data;
}

export async function deletePersonnel(id: number): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    MOCK_PERSONNEL = MOCK_PERSONNEL.filter((p) => p.id !== id);
    return;
  }
  await apiClient.delete(`/personnel/${id}`);
}

// ---------------------------------------------------------------------------
// Billet CRUD
// ---------------------------------------------------------------------------

export async function createBillet(data: Partial<BilletRecord>): Promise<BilletRecord> {
  if (isDemoMode) {
    await mockDelay();
    const maxId = MOCK_BILLETS.reduce((m, b) => Math.max(m, b.id), 0);
    const record: BilletRecord = {
      id: maxId + 1,
      unitId: data.unitId ?? 4,
      billetIdCode: data.billetIdCode ?? '',
      billetTitle: data.billetTitle ?? '',
      mosRequired: data.mosRequired ?? null,
      rankRequired: data.rankRequired ?? null,
      isKeyBillet: data.isKeyBillet ?? false,
      isFilled: data.isFilled ?? false,
      filledById: data.filledById ?? null,
      filledByName: data.filledByName,
      filledDate: data.filledDate ?? null,
    };
    MOCK_BILLETS = [...MOCK_BILLETS, record];
    return record;
  }
  const response = await apiClient.post<{ data: BilletRecord }>('/manning/billets', data);
  return response.data.data;
}

export async function updateBillet(id: number, data: Partial<BilletRecord>): Promise<BilletRecord> {
  if (isDemoMode) {
    await mockDelay();
    const idx = MOCK_BILLETS.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error(`Billet ${id} not found`);
    const updated = { ...MOCK_BILLETS[idx], ...data, id };
    MOCK_BILLETS = MOCK_BILLETS.map((b) => (b.id === id ? updated : b));
    return updated;
  }
  const response = await apiClient.put<{ data: BilletRecord }>(`/manning/billets/${id}`, data);
  return response.data.data;
}

export async function deleteBillet(id: number): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    MOCK_BILLETS = MOCK_BILLETS.filter((b) => b.id !== id);
    return;
  }
  await apiClient.delete(`/manning/billets/${id}`);
}

// ---------------------------------------------------------------------------
// Qualification CRUD
// ---------------------------------------------------------------------------

export async function createQualification(data: {
  personnelId: number;
  qualificationType: string;
  qualificationName: string;
  dateAchieved: string;
  expirationDate?: string;
  isCurrent?: boolean;
}): Promise<QualificationRecord> {
  if (isDemoMode) {
    await mockDelay();
    const maxId = mockQualifications.reduce((m, q) => Math.max(m, q.id), 0);
    const record: QualificationRecord = {
      id: maxId + 1,
      personnelId: data.personnelId,
      qualificationType: data.qualificationType,
      qualificationName: data.qualificationName,
      dateAchieved: data.dateAchieved,
      expirationDate: data.expirationDate ?? null,
      isCurrent: data.isCurrent ?? true,
    };
    mockQualifications = [...mockQualifications, record];
    return record;
  }
  const response = await apiClient.post<{ data: QualificationRecord }>('/personnel/qualifications', data);
  return response.data.data;
}

export async function deleteQualification(id: number): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    mockQualifications = mockQualifications.filter((q) => q.id !== id);
    return;
  }
  await apiClient.delete(`/personnel/qualifications/${id}`);
}

// ---------------------------------------------------------------------------
// Transportation Personnel Assignment & Certification Verification
// ---------------------------------------------------------------------------

// Mock qualification records keyed to MOCK_PERSONNEL ids
const MOCK_QUALIFICATIONS: {
  personnelId: number;
  qualificationType: string;
  qualificationName: string;
  isCurrent: boolean;
  expirationDate: string | null;
}[] = [
  // Officers/SNCOs (ids 1-5): MILITARY_DRIVER + HMMWV_LICENSE + MTVR_LICENSE
  { personnelId: 1, qualificationType: 'MILITARY_DRIVER', qualificationName: 'Military Driver License', isCurrent: true, expirationDate: dateStr(365) },
  { personnelId: 1, qualificationType: 'HMMWV_LICENSE', qualificationName: 'HMMWV Operator License', isCurrent: true, expirationDate: dateStr(365) },
  { personnelId: 1, qualificationType: 'MTVR_LICENSE', qualificationName: 'MTVR Operator License', isCurrent: true, expirationDate: dateStr(300) },

  { personnelId: 2, qualificationType: 'MILITARY_DRIVER', qualificationName: 'Military Driver License', isCurrent: true, expirationDate: dateStr(400) },
  { personnelId: 2, qualificationType: 'HMMWV_LICENSE', qualificationName: 'HMMWV Operator License', isCurrent: true, expirationDate: dateStr(400) },
  { personnelId: 2, qualificationType: 'MTVR_LICENSE', qualificationName: 'MTVR Operator License', isCurrent: true, expirationDate: dateStr(350) },

  { personnelId: 3, qualificationType: 'MILITARY_DRIVER', qualificationName: 'Military Driver License', isCurrent: true, expirationDate: dateStr(320) },
  { personnelId: 3, qualificationType: 'HMMWV_LICENSE', qualificationName: 'HMMWV Operator License', isCurrent: true, expirationDate: dateStr(320) },
  { personnelId: 3, qualificationType: 'MTVR_LICENSE', qualificationName: 'MTVR Operator License', isCurrent: true, expirationDate: dateStr(280) },

  { personnelId: 4, qualificationType: 'MILITARY_DRIVER', qualificationName: 'Military Driver License', isCurrent: true, expirationDate: dateStr(350) },
  { personnelId: 4, qualificationType: 'HMMWV_LICENSE', qualificationName: 'HMMWV Operator License', isCurrent: true, expirationDate: dateStr(350) },
  { personnelId: 4, qualificationType: 'MTVR_LICENSE', qualificationName: 'MTVR Operator License', isCurrent: true, expirationDate: dateStr(310) },

  { personnelId: 5, qualificationType: 'MILITARY_DRIVER', qualificationName: 'Military Driver License', isCurrent: true, expirationDate: dateStr(380) },
  { personnelId: 5, qualificationType: 'HMMWV_LICENSE', qualificationName: 'HMMWV Operator License', isCurrent: true, expirationDate: dateStr(380) },
  { personnelId: 5, qualificationType: 'MTVR_LICENSE', qualificationName: 'MTVR Operator License', isCurrent: true, expirationDate: dateStr(340) },

  // NCOs with driversLicenseMilitary: true (ids 8, 9, 10, 11, 13, 16, 22): MILITARY_DRIVER + HMMWV_LICENSE
  { personnelId: 8, qualificationType: 'MILITARY_DRIVER', qualificationName: 'Military Driver License', isCurrent: true, expirationDate: dateStr(290) },
  { personnelId: 8, qualificationType: 'HMMWV_LICENSE', qualificationName: 'HMMWV Operator License', isCurrent: true, expirationDate: dateStr(290) },

  { personnelId: 9, qualificationType: 'MILITARY_DRIVER', qualificationName: 'Military Driver License', isCurrent: true, expirationDate: dateStr(260) },
  { personnelId: 9, qualificationType: 'HMMWV_LICENSE', qualificationName: 'HMMWV Operator License', isCurrent: true, expirationDate: dateStr(260) },

  { personnelId: 10, qualificationType: 'MILITARY_DRIVER', qualificationName: 'Military Driver License', isCurrent: true, expirationDate: dateStr(270) },
  { personnelId: 10, qualificationType: 'HMMWV_LICENSE', qualificationName: 'HMMWV Operator License', isCurrent: true, expirationDate: dateStr(270) },

  { personnelId: 11, qualificationType: 'MILITARY_DRIVER', qualificationName: 'Military Driver License', isCurrent: true, expirationDate: dateStr(240) },
  { personnelId: 11, qualificationType: 'HMMWV_LICENSE', qualificationName: 'HMMWV Operator License', isCurrent: true, expirationDate: dateStr(240) },

  { personnelId: 13, qualificationType: 'MILITARY_DRIVER', qualificationName: 'Military Driver License', isCurrent: true, expirationDate: dateStr(250) },
  { personnelId: 13, qualificationType: 'HMMWV_LICENSE', qualificationName: 'HMMWV Operator License', isCurrent: true, expirationDate: dateStr(250) },

  { personnelId: 16, qualificationType: 'MILITARY_DRIVER', qualificationName: 'Military Driver License', isCurrent: true, expirationDate: dateStr(230) },
  { personnelId: 16, qualificationType: 'HMMWV_LICENSE', qualificationName: 'HMMWV Operator License', isCurrent: true, expirationDate: dateStr(230) },

  { personnelId: 22, qualificationType: 'MILITARY_DRIVER', qualificationName: 'Military Driver License', isCurrent: true, expirationDate: dateStr(275) },
  { personnelId: 22, qualificationType: 'HMMWV_LICENSE', qualificationName: 'HMMWV Operator License', isCurrent: true, expirationDate: dateStr(275) },

  // WEAPONS_QUAL for E5-E7 (ids 8, 9, 10, 11, 12) and id 13 (FDC Chief)
  { personnelId: 8, qualificationType: 'WEAPONS_QUAL', qualificationName: 'Crew-Served Weapons Qualification', isCurrent: true, expirationDate: dateStr(180) },
  { personnelId: 9, qualificationType: 'WEAPONS_QUAL', qualificationName: 'Crew-Served Weapons Qualification', isCurrent: true, expirationDate: dateStr(200) },
  { personnelId: 10, qualificationType: 'WEAPONS_QUAL', qualificationName: 'Crew-Served Weapons Qualification', isCurrent: true, expirationDate: dateStr(190) },
  { personnelId: 11, qualificationType: 'WEAPONS_QUAL', qualificationName: 'Crew-Served Weapons Qualification', isCurrent: true, expirationDate: dateStr(210) },
  { personnelId: 12, qualificationType: 'WEAPONS_QUAL', qualificationName: 'Crew-Served Weapons Qualification', isCurrent: true, expirationDate: dateStr(195) },
  { personnelId: 13, qualificationType: 'WEAPONS_QUAL', qualificationName: 'Crew-Served Weapons Qualification', isCurrent: true, expirationDate: dateStr(185) },

  // TCCC for personnel 14 (Cpl Clark)
  { personnelId: 14, qualificationType: 'TCCC', qualificationName: 'Tactical Combat Casualty Care', isCurrent: true, expirationDate: dateStr(150) },
];

// Vehicle license requirements by TAMCN
const VEHICLE_LICENSE_REQUIREMENTS: Record<string, string> = {
  'D1100': 'HMMWV_LICENSE', 'D1149': 'HMMWV_LICENSE',
  'D0090': 'MTVR_LICENSE', 'D0091': 'MTVR_LICENSE',
  'E0846': 'JLTV_LICENSE', 'E0847': 'JLTV_LICENSE',
  'E0811': 'LVSR_LICENSE',
  'L0071': 'LAV_LICENSE',
  'P0072': 'ACV_LICENSE',
};

// Pay grade sets for role eligibility
const E5_PLUS = ['E5', 'E6', 'E7', 'E8', 'E9', 'W1', 'W2', 'W3', 'W4', 'W5'];
const E6_PLUS_OR_OFFICER = ['E6', 'E7', 'E8', 'E9', 'W1', 'W2', 'W3', 'W4', 'W5', 'O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8', 'O9', 'O10'];

function getPersonnelQuals(personnelId: number) {
  return MOCK_QUALIFICATIONS.filter((q) => q.personnelId === personnelId);
}

function hasCurrentQual(personnelId: number, qualType: string): boolean {
  const now = new Date();
  return MOCK_QUALIFICATIONS.some(
    (q) =>
      q.personnelId === personnelId &&
      q.qualificationType === qualType &&
      q.isCurrent &&
      (!q.expirationDate || new Date(q.expirationDate) > now),
  );
}

export async function getQualifiedPersonnel(
  role: string,
  vehicleTamcn: string,
  excludeMovementId?: number,
): Promise<QualifiedPersonnelResponse> {
  if (isDemoMode) {
    await mockDelay();

    const requiredLicense = VEHICLE_LICENSE_REQUIREMENTS[vehicleTamcn];
    const requiredQualifications: string[] = [];
    const activePers = MOCK_PERSONNEL.filter((p) => p.status === 'ACTIVE');

    let filtered: typeof MOCK_PERSONNEL;

    switch (role) {
      case 'DRIVER':
      case 'A_DRIVER':
        requiredQualifications.push('MILITARY_DRIVER');
        if (requiredLicense) requiredQualifications.push(requiredLicense);
        filtered = activePers.filter(
          (p) =>
            hasCurrentQual(p.id, 'MILITARY_DRIVER') &&
            (!requiredLicense || hasCurrentQual(p.id, requiredLicense)),
        );
        break;
      case 'TC':
        requiredQualifications.push('MILITARY_DRIVER');
        if (requiredLicense) requiredQualifications.push(requiredLicense);
        filtered = activePers.filter(
          (p) =>
            p.payGrade !== null &&
            E5_PLUS.includes(p.payGrade) &&
            hasCurrentQual(p.id, 'MILITARY_DRIVER') &&
            (!requiredLicense || hasCurrentQual(p.id, requiredLicense)),
        );
        break;
      case 'VC':
        filtered = activePers.filter(
          (p) => p.payGrade !== null && E6_PLUS_OR_OFFICER.includes(p.payGrade),
        );
        break;
      case 'GUNNER':
        requiredQualifications.push('WEAPONS_QUAL');
        filtered = activePers.filter((p) => hasCurrentQual(p.id, 'WEAPONS_QUAL'));
        break;
      case 'MEDIC':
        requiredQualifications.push('TCCC');
        filtered = activePers.filter(
          (p) => p.mos === '8404' || hasCurrentQual(p.id, 'TCCC'),
        );
        break;
      case 'PAX':
      default:
        filtered = [...activePers];
        break;
    }

    const personnel: QualifiedPersonnelItem[] = filtered.map((p) => ({
      id: p.id,
      edipi: p.edipi,
      rank: p.rank,
      firstName: p.firstName,
      lastName: p.lastName,
      mos: p.mos,
      payGrade: p.payGrade,
      isAssignedToMovement: false,
      qualifications: getPersonnelQuals(p.id).map((q) => ({
        qualificationType: q.qualificationType,
        qualificationName: q.qualificationName,
        isCurrent: q.isCurrent,
        expirationDate: q.expirationDate,
      })),
    }));

    return {
      personnel,
      total: personnel.length,
      requiredQualifications: requiredQualifications,
    };
  }

  const response = await apiClient.get<{ data: QualifiedPersonnelResponse }>(
    '/transportation/qualified-personnel',
    { params: { role, vehicle_tamcn: vehicleTamcn, exclude_movement_id: excludeMovementId } },
  );
  return response.data.data;
}

export async function validateAssignment(
  request: ValidateAssignmentRequest,
): Promise<ValidateAssignmentResponse> {
  if (isDemoMode) {
    await mockDelay();

    const person = MOCK_PERSONNEL.find((p) => p.id === request.personnelId);
    if (!person) {
      return { valid: false, reason: 'Personnel not found', missingQualifications: [], assignedToOtherVehicle: false };
    }
    if (person.status !== 'ACTIVE') {
      return { valid: false, reason: `Personnel status is ${person.status}, not ACTIVE`, missingQualifications: [], assignedToOtherVehicle: false };
    }

    const missingQuals: string[] = [];
    const requiredLicense = VEHICLE_LICENSE_REQUIREMENTS[request.vehicle_tamcn];

    switch (request.role) {
      case 'DRIVER':
      case 'A_DRIVER':
        if (!hasCurrentQual(person.id, 'MILITARY_DRIVER')) missingQuals.push('MILITARY_DRIVER');
        if (requiredLicense && !hasCurrentQual(person.id, requiredLicense)) missingQuals.push(requiredLicense);
        break;
      case 'TC':
        if (!person.payGrade || !E5_PLUS.includes(person.payGrade)) {
          return { valid: false, reason: 'TC must be E5 or above', missingQualifications: [], assignedToOtherVehicle: false };
        }
        if (!hasCurrentQual(person.id, 'MILITARY_DRIVER')) missingQuals.push('MILITARY_DRIVER');
        if (requiredLicense && !hasCurrentQual(person.id, requiredLicense)) missingQuals.push(requiredLicense);
        break;
      case 'VC':
        if (!person.payGrade || !E6_PLUS_OR_OFFICER.includes(person.payGrade)) {
          return { valid: false, reason: 'VC must be E6+ or Officer', missingQualifications: [], assignedToOtherVehicle: false };
        }
        break;
      case 'GUNNER':
        if (!hasCurrentQual(person.id, 'WEAPONS_QUAL')) missingQuals.push('WEAPONS_QUAL');
        break;
      case 'MEDIC':
        if (person.mos !== '8404' && !hasCurrentQual(person.id, 'TCCC')) missingQuals.push('TCCC');
        break;
      case 'PAX':
      default:
        break;
    }

    if (missingQuals.length > 0) {
      return {
        valid: false,
        reason: `Missing required qualifications: ${missingQuals.join(', ')}`,
        missingQualifications: missingQuals,
        assignedToOtherVehicle: false,
      };
    }

    return { valid: true, reason: 'Personnel meets all requirements', missingQualifications: [], assignedToOtherVehicle: false };
  }

  const response = await apiClient.post<{ data: ValidateAssignmentResponse }>(
    '/transportation/validate-assignment',
    request,
  );
  return response.data.data;
}
