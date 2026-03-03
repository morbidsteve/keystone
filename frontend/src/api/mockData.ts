// =============================================================================
// KEYSTONE Demo Mode — Mock Data
// Realistic USMC logistics data for static site / GitHub Pages deployment
// =============================================================================

import type {
  User,
  SupplyRecord,
  EquipmentRecord,
  Movement,
  Alert,
  DashboardSummary,
  SupplyClassSummary,
  ReadinessSummary,
  SustainabilityProjection,
  Report,
  RawData,
  ParsedRecord,
  ConsumptionDataPoint,
} from '@/lib/types';
import {
  SupplyClass,
  SupplyStatus,
  MovementStatus,
  AlertType,
  AlertSeverity,
  ReportType,
  ReportStatus,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Helper: generate date strings relative to "now"
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

function hoursFromNow(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() + n);
  return d.toISOString();
}

function dateStr(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Demo Users — any of these usernames work with any password
// ---------------------------------------------------------------------------

export const DEMO_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    full_name: 'System Administrator',
    role: 'ADMIN',
    unit_id: 1,
    email: 'admin@keystone.usmc.mil',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'commander',
    full_name: 'COL James R. Mitchell',
    role: 'COMMANDER',
    unit_id: 2,
    email: 'j.mitchell@keystone.usmc.mil',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    username: 's4officer',
    full_name: 'MAJ Sarah K. Johnson',
    role: 'S4',
    unit_id: 3,
    email: 's4@keystone.usmc.mil',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 4,
    username: 's3officer',
    full_name: 'MAJ David L. Chen',
    role: 'S3',
    unit_id: 3,
    email: 's3@keystone.usmc.mil',
    is_active: true,
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 5,
    username: 'operator',
    full_name: 'SSgt Marcus T. Williams',
    role: 'OPERATOR',
    unit_id: 4,
    email: 'operator@keystone.usmc.mil',
    is_active: true,
    created_at: '2026-02-01T00:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Unit hierarchy
// ---------------------------------------------------------------------------

export interface DemoUnit {
  id: string;
  name: string;
  abbreviation: string;
  echelon: string;
  parentId: string | null;
  uic: string;
}

export const DEMO_UNITS: DemoUnit[] = [
  { id: '1', name: 'I Marine Expeditionary Force', abbreviation: 'I MEF', echelon: 'MEF', parentId: null, uic: 'M00001' },
  { id: '2', name: '1st Marine Division', abbreviation: '1st MarDiv', echelon: 'DIVISION', parentId: '1', uic: 'M01000' },
  { id: '3', name: '1st Marine Regiment', abbreviation: '1st Marines', echelon: 'REGIMENT', parentId: '2', uic: 'M01100' },
  { id: '4', name: '1st Battalion 1st Marines', abbreviation: '1/1', echelon: 'BATTALION', parentId: '3', uic: 'M01110' },
  { id: '5', name: '2nd Battalion 1st Marines', abbreviation: '2/1', echelon: 'BATTALION', parentId: '3', uic: 'M01120' },
  { id: '6', name: '3rd Battalion 1st Marines', abbreviation: '3/1', echelon: 'BATTALION', parentId: '3', uic: 'M01130' },
  { id: '7', name: 'Alpha Company 1/1', abbreviation: 'A Co 1/1', echelon: 'COMPANY', parentId: '4', uic: 'M01111' },
  { id: '8', name: 'Bravo Company 1/1', abbreviation: 'B Co 1/1', echelon: 'COMPANY', parentId: '4', uic: 'M01112' },
  { id: '9', name: 'Charlie Company 1/1', abbreviation: 'C Co 1/1', echelon: 'COMPANY', parentId: '4', uic: 'M01113' },
  { id: '10', name: 'Weapons Company 1/1', abbreviation: 'Wpns Co 1/1', echelon: 'COMPANY', parentId: '4', uic: 'M01114' },
  { id: '11', name: '5th Marine Regiment', abbreviation: '5th Marines', echelon: 'REGIMENT', parentId: '2', uic: 'M01500' },
  { id: '12', name: '1st Battalion 5th Marines', abbreviation: '1/5', echelon: 'BATTALION', parentId: '11', uic: 'M01510' },
  { id: '13', name: '2nd Battalion 5th Marines', abbreviation: '2/5', echelon: 'BATTALION', parentId: '11', uic: 'M01520' },
  { id: '14', name: '11th Marine Regiment', abbreviation: '11th Marines', echelon: 'REGIMENT', parentId: '2', uic: 'M01A00' },
  { id: '15', name: '1st Battalion 11th Marines', abbreviation: '1/11', echelon: 'BATTALION', parentId: '14', uic: 'M01A10' },
  { id: '16', name: '1st Combat Engineer Battalion', abbreviation: '1st CEB', echelon: 'BATTALION', parentId: '2', uic: 'M01E00' },
];

// ---------------------------------------------------------------------------
// Supply Records — 60 records across classes and units
// ---------------------------------------------------------------------------

export const DEMO_SUPPLY_RECORDS: SupplyRecord[] = [
  // Class I — Subsistence
  { id: 'sup-001', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.I, item: 'MRE Case (12ct)', niin: '8970-01-517-7831', onHand: 2400, authorized: 3000, required: 3000, dueIn: 600, consumptionRate: 480, dos: 5.0, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(2) },
  { id: 'sup-002', unitId: '5', unitName: '2/1', supplyClass: SupplyClass.I, item: 'MRE Case (12ct)', niin: '8970-01-517-7831', onHand: 2800, authorized: 3000, required: 3000, dueIn: 0, consumptionRate: 460, dos: 6.1, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(3) },
  { id: 'sup-003', unitId: '6', unitName: '3/1', supplyClass: SupplyClass.I, item: 'MRE Case (12ct)', niin: '8970-01-517-7831', onHand: 1200, authorized: 3000, required: 3000, dueIn: 1000, consumptionRate: 490, dos: 2.4, status: SupplyStatus.RED, lastUpdated: hoursAgo(1) },
  { id: 'sup-004', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.I, item: 'UGR-A Rations', niin: '8970-01-E58-5291', onHand: 800, authorized: 1200, required: 1200, dueIn: 200, consumptionRate: 120, dos: 6.7, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(4) },
  { id: 'sup-005', unitId: '12', unitName: '1/5', supplyClass: SupplyClass.I, item: 'Potable Water (gal)', niin: '8960-00-926-0644', onHand: 15000, authorized: 20000, required: 20000, dueIn: 3000, consumptionRate: 4500, dos: 3.3, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(1) },

  // Class II — Clothing & Equipment
  { id: 'sup-006', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.II, item: 'FROG Combat Ensemble', niin: '8415-01-588-3456', onHand: 750, authorized: 800, required: 800, dueIn: 50, consumptionRate: 8, dos: 93.8, status: SupplyStatus.GREEN, lastUpdated: daysAgo(2) },
  { id: 'sup-007', unitId: '5', unitName: '2/1', supplyClass: SupplyClass.II, item: 'Ballistic Helmet IHPS', niin: '8470-01-649-0535', onHand: 620, authorized: 780, required: 780, dueIn: 100, consumptionRate: 3, dos: 206.7, status: SupplyStatus.GREEN, lastUpdated: daysAgo(3) },
  { id: 'sup-008', unitId: '6', unitName: '3/1', supplyClass: SupplyClass.II, item: 'SAPI Plate Set', niin: '8470-01-520-7373', onHand: 680, authorized: 800, required: 800, dueIn: 0, consumptionRate: 2, dos: 340.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(1) },
  { id: 'sup-009', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.II, item: 'MOLLE Pack ILBE', niin: '8465-01-515-8634', onHand: 680, authorized: 800, required: 800, dueIn: 40, consumptionRate: 5, dos: 136.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(5) },

  // Class III — POL (Bulk)
  { id: 'sup-010', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.III, item: 'JP-8 Fuel (gal)', niin: '9130-01-286-5295', onHand: 8500, authorized: 15000, required: 15000, dueIn: 4000, consumptionRate: 3200, dos: 2.7, status: SupplyStatus.RED, lastUpdated: hoursAgo(1) },
  { id: 'sup-011', unitId: '5', unitName: '2/1', supplyClass: SupplyClass.III, item: 'JP-8 Fuel (gal)', niin: '9130-01-286-5295', onHand: 12000, authorized: 15000, required: 15000, dueIn: 0, consumptionRate: 3100, dos: 3.9, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(2) },
  { id: 'sup-012', unitId: '6', unitName: '3/1', supplyClass: SupplyClass.III, item: 'JP-8 Fuel (gal)', niin: '9130-01-286-5295', onHand: 11200, authorized: 15000, required: 15000, dueIn: 2000, consumptionRate: 2900, dos: 3.9, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(3) },
  { id: 'sup-013', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.III, item: 'DF-2 Diesel (gal)', niin: '9140-00-286-5295', onHand: 6200, authorized: 10000, required: 10000, dueIn: 2000, consumptionRate: 1800, dos: 3.4, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(2) },
  { id: 'sup-014', unitId: '12', unitName: '1/5', supplyClass: SupplyClass.III, item: 'JP-8 Fuel (gal)', niin: '9130-01-286-5295', onHand: 9800, authorized: 15000, required: 15000, dueIn: 5000, consumptionRate: 3000, dos: 3.3, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(1) },
  { id: 'sup-015', unitId: '15', unitName: '1/11', supplyClass: SupplyClass.III, item: 'JP-8 Fuel (gal)', niin: '9130-01-286-5295', onHand: 7500, authorized: 12000, required: 12000, dueIn: 3000, consumptionRate: 2500, dos: 3.0, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(4) },

  // Class IIIA — POL (Packaged)
  { id: 'sup-016', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.IIIA, item: 'OE/HDO 15W40 Motor Oil', niin: '9150-01-152-4117', onHand: 360, authorized: 480, required: 480, dueIn: 60, consumptionRate: 40, dos: 9.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(1) },
  { id: 'sup-017', unitId: '5', unitName: '2/1', supplyClass: SupplyClass.IIIA, item: 'CLP Weapons Lube (qt)', niin: '9150-01-054-6453', onHand: 180, authorized: 300, required: 300, dueIn: 50, consumptionRate: 30, dos: 6.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(2) },

  // Class IV — Construction
  { id: 'sup-018', unitId: '16', unitName: '1st CEB', supplyClass: SupplyClass.IV, item: 'Sandbags (bundle 100)', niin: '5680-00-266-6503', onHand: 450, authorized: 800, required: 800, dueIn: 200, consumptionRate: 60, dos: 7.5, status: SupplyStatus.GREEN, lastUpdated: daysAgo(1) },
  { id: 'sup-019', unitId: '16', unitName: '1st CEB', supplyClass: SupplyClass.IV, item: 'Concertina Wire (roll)', niin: '5660-00-262-3890', onHand: 120, authorized: 300, required: 300, dueIn: 80, consumptionRate: 15, dos: 8.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(3) },
  { id: 'sup-020', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.IV, item: 'HESCO Barrier', niin: '5680-01-524-8764', onHand: 45, authorized: 80, required: 80, dueIn: 20, consumptionRate: 5, dos: 9.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(2) },

  // Class V — Ammunition
  { id: 'sup-021', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.V, item: '5.56mm Ball M855A1 (1000rd)', niin: '1305-01-617-1598', onHand: 280, authorized: 400, required: 400, dueIn: 80, consumptionRate: 40, dos: 7.0, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(6) },
  { id: 'sup-022', unitId: '5', unitName: '2/1', supplyClass: SupplyClass.V, item: '5.56mm Ball M855A1 (1000rd)', niin: '1305-01-617-1598', onHand: 320, authorized: 400, required: 400, dueIn: 0, consumptionRate: 38, dos: 8.4, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(8) },
  { id: 'sup-023', unitId: '6', unitName: '3/1', supplyClass: SupplyClass.V, item: '5.56mm Ball M855A1 (1000rd)', niin: '1305-01-617-1598', onHand: 160, authorized: 400, required: 400, dueIn: 120, consumptionRate: 42, dos: 3.8, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(4) },
  { id: 'sup-024', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.V, item: '7.62mm Ball M80A1 (200rd)', niin: '1305-01-633-3950', onHand: 190, authorized: 250, required: 250, dueIn: 30, consumptionRate: 22, dos: 8.6, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(6) },
  { id: 'sup-025', unitId: '15', unitName: '1/11', supplyClass: SupplyClass.V, item: '155mm HE M795 (round)', niin: '1320-01-539-4230', onHand: 420, authorized: 600, required: 600, dueIn: 100, consumptionRate: 80, dos: 5.3, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(2) },
  { id: 'sup-026', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.V, item: '40mm HE M433 (48rd)', niin: '1310-01-025-3461', onHand: 95, authorized: 150, required: 150, dueIn: 30, consumptionRate: 12, dos: 7.9, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(10) },
  { id: 'sup-027', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.V, item: '81mm HE M821A3 (round)', niin: '1315-01-464-5509', onHand: 60, authorized: 120, required: 120, dueIn: 40, consumptionRate: 10, dos: 6.0, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(5) },

  // Class VII — Major End Items
  { id: 'sup-028', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.VII, item: 'HMMWV M1151 (ea)', niin: '2320-01-531-1025', onHand: 38, authorized: 42, required: 42, dueIn: 2, consumptionRate: 0.1, dos: 380.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(1) },
  { id: 'sup-029', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.VII, item: 'MTVR MK23 7-ton (ea)', niin: '2320-01-455-9591', onHand: 22, authorized: 28, required: 28, dueIn: 0, consumptionRate: 0.05, dos: 440.0, status: SupplyStatus.AMBER, lastUpdated: daysAgo(1) },
  { id: 'sup-030', unitId: '5', unitName: '2/1', supplyClass: SupplyClass.VII, item: 'HMMWV M1151 (ea)', niin: '2320-01-531-1025', onHand: 40, authorized: 42, required: 42, dueIn: 0, consumptionRate: 0.1, dos: 400.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(2) },

  // Class VIII — Medical
  { id: 'sup-031', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.VIII, item: 'IFAK Resupply Kit', niin: '6545-01-586-7693', onHand: 380, authorized: 500, required: 500, dueIn: 60, consumptionRate: 15, dos: 25.3, status: SupplyStatus.GREEN, lastUpdated: daysAgo(1) },
  { id: 'sup-032', unitId: '5', unitName: '2/1', supplyClass: SupplyClass.VIII, item: 'IFAK Resupply Kit', niin: '6545-01-586-7693', onHand: 420, authorized: 500, required: 500, dueIn: 0, consumptionRate: 14, dos: 30.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(2) },
  { id: 'sup-033', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.VIII, item: 'Combat Gauze (case)', niin: '6510-01-562-3325', onHand: 60, authorized: 100, required: 100, dueIn: 20, consumptionRate: 5, dos: 12.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(3) },
  { id: 'sup-034', unitId: '6', unitName: '3/1', supplyClass: SupplyClass.VIII, item: 'Whole Blood (unit)', niin: '6505-01-651-8762', onHand: 18, authorized: 40, required: 40, dueIn: 10, consumptionRate: 6, dos: 3.0, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(6) },

  // Class IX — Repair Parts
  { id: 'sup-035', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.IX, item: 'HMMWV Brake Assembly', niin: '2530-01-536-3620', onHand: 12, authorized: 20, required: 20, dueIn: 6, consumptionRate: 2, dos: 6.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(2) },
  { id: 'sup-036', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.IX, item: 'MTVR Alternator', niin: '2920-01-497-1293', onHand: 4, authorized: 8, required: 8, dueIn: 2, consumptionRate: 1, dos: 4.0, status: SupplyStatus.AMBER, lastUpdated: daysAgo(1) },
  { id: 'sup-037', unitId: '5', unitName: '2/1', supplyClass: SupplyClass.IX, item: 'HMMWV Starter Motor', niin: '2920-01-533-0048', onHand: 6, authorized: 10, required: 10, dueIn: 4, consumptionRate: 1, dos: 6.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(3) },
  { id: 'sup-038', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.IX, item: 'HMMWV CV Joint', niin: '2520-01-536-4127', onHand: 8, authorized: 12, required: 12, dueIn: 0, consumptionRate: 2, dos: 4.0, status: SupplyStatus.AMBER, lastUpdated: daysAgo(1) },
  { id: 'sup-039', unitId: '6', unitName: '3/1', supplyClass: SupplyClass.IX, item: 'LAV-25 Track Pad Kit', niin: '2530-01-362-9415', onHand: 3, authorized: 8, required: 8, dueIn: 3, consumptionRate: 2, dos: 1.5, status: SupplyStatus.RED, lastUpdated: hoursAgo(8) },

  // Additional records for diversity
  { id: 'sup-040', unitId: '12', unitName: '1/5', supplyClass: SupplyClass.I, item: 'MRE Case (12ct)', niin: '8970-01-517-7831', onHand: 2600, authorized: 3000, required: 3000, dueIn: 0, consumptionRate: 470, dos: 5.5, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(3) },
  { id: 'sup-041', unitId: '13', unitName: '2/5', supplyClass: SupplyClass.I, item: 'MRE Case (12ct)', niin: '8970-01-517-7831', onHand: 2900, authorized: 3000, required: 3000, dueIn: 200, consumptionRate: 450, dos: 6.4, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(5) },
  { id: 'sup-042', unitId: '12', unitName: '1/5', supplyClass: SupplyClass.V, item: '5.56mm Ball M855A1 (1000rd)', niin: '1305-01-617-1598', onHand: 250, authorized: 400, required: 400, dueIn: 50, consumptionRate: 35, dos: 7.1, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(6) },
  { id: 'sup-043', unitId: '13', unitName: '2/5', supplyClass: SupplyClass.III, item: 'JP-8 Fuel (gal)', niin: '9130-01-286-5295', onHand: 10500, authorized: 15000, required: 15000, dueIn: 2000, consumptionRate: 2800, dos: 3.8, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(2) },
  { id: 'sup-044', unitId: '15', unitName: '1/11', supplyClass: SupplyClass.IX, item: 'M777 Recoil Mechanism', niin: '1005-01-518-7250', onHand: 2, authorized: 4, required: 4, dueIn: 1, consumptionRate: 0.5, dos: 4.0, status: SupplyStatus.AMBER, lastUpdated: daysAgo(2) },
  { id: 'sup-045', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.VI, item: 'Personal Hygiene Kit', niin: '8520-01-566-7723', onHand: 600, authorized: 800, required: 800, dueIn: 100, consumptionRate: 50, dos: 12.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(4) },
  { id: 'sup-046', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.X, item: 'Water Purification Unit', niin: '4610-01-568-3290', onHand: 6, authorized: 8, required: 8, dueIn: 0, consumptionRate: 0.2, dos: 30.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(7) },
  { id: 'sup-047', unitId: '6', unitName: '3/1', supplyClass: SupplyClass.III, item: 'MOGAS (gal)', niin: '9130-00-160-1830', onHand: 1200, authorized: 3000, required: 3000, dueIn: 800, consumptionRate: 600, dos: 2.0, status: SupplyStatus.RED, lastUpdated: hoursAgo(2) },
  { id: 'sup-048', unitId: '5', unitName: '2/1', supplyClass: SupplyClass.IX, item: 'HMMWV Transfer Case', niin: '2520-01-536-3989', onHand: 3, authorized: 6, required: 6, dueIn: 2, consumptionRate: 1, dos: 3.0, status: SupplyStatus.AMBER, lastUpdated: daysAgo(1) },
  { id: 'sup-049', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.V, item: 'AT-4 M136 (ea)', niin: '1340-01-267-2966', onHand: 48, authorized: 72, required: 72, dueIn: 12, consumptionRate: 6, dos: 8.0, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(12) },
  { id: 'sup-050', unitId: '4', unitName: '1/1', supplyClass: SupplyClass.V, item: 'Mk19 40mm HEDP (48rd can)', niin: '1310-01-435-4925', onHand: 32, authorized: 60, required: 60, dueIn: 16, consumptionRate: 8, dos: 4.0, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(8) },
];

// ---------------------------------------------------------------------------
// Equipment Readiness — realistic USMC vehicle/weapons data
// ---------------------------------------------------------------------------

export const DEMO_EQUIPMENT: EquipmentRecord[] = [
  { id: 'eq-001', unitId: '4', unitName: '1/1', type: 'HMMWV M1151', tamcn: 'D1127', authorized: 42, onHand: 38, missionCapable: 34, notMissionCapable: 4, readinessPercent: 89.5, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(4) },
  { id: 'eq-002', unitId: '4', unitName: '1/1', type: 'MTVR MK23', tamcn: 'D0099', authorized: 28, onHand: 22, missionCapable: 19, notMissionCapable: 3, readinessPercent: 86.4, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(4) },
  { id: 'eq-003', unitId: '4', unitName: '1/1', type: 'M1161 Growler ITV', tamcn: 'D1128', authorized: 12, onHand: 12, missionCapable: 11, notMissionCapable: 1, readinessPercent: 91.7, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(6) },
  { id: 'eq-004', unitId: '5', unitName: '2/1', type: 'HMMWV M1151', tamcn: 'D1127', authorized: 42, onHand: 40, missionCapable: 37, notMissionCapable: 3, readinessPercent: 92.5, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(3) },
  { id: 'eq-005', unitId: '5', unitName: '2/1', type: 'MTVR MK23', tamcn: 'D0099', authorized: 28, onHand: 26, missionCapable: 23, notMissionCapable: 3, readinessPercent: 88.5, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(5) },
  { id: 'eq-006', unitId: '6', unitName: '3/1', type: 'LAV-25', tamcn: 'D0071', authorized: 16, onHand: 14, missionCapable: 11, notMissionCapable: 3, readinessPercent: 78.6, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(2) },
  { id: 'eq-007', unitId: '6', unitName: '3/1', type: 'HMMWV M1151', tamcn: 'D1127', authorized: 42, onHand: 39, missionCapable: 32, notMissionCapable: 7, readinessPercent: 82.1, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(3) },
  { id: 'eq-008', unitId: '6', unitName: '3/1', type: 'MTVR MK23', tamcn: 'D0099', authorized: 28, onHand: 24, missionCapable: 20, notMissionCapable: 4, readinessPercent: 83.3, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(2) },
  { id: 'eq-009', unitId: '15', unitName: '1/11', type: 'M777A2 Howitzer', tamcn: 'E0846', authorized: 18, onHand: 18, missionCapable: 16, notMissionCapable: 2, readinessPercent: 88.9, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(6) },
  { id: 'eq-010', unitId: '15', unitName: '1/11', type: 'MTVR MK23', tamcn: 'D0099', authorized: 20, onHand: 18, missionCapable: 16, notMissionCapable: 2, readinessPercent: 88.9, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(5) },
  { id: 'eq-011', unitId: '12', unitName: '1/5', type: 'HMMWV M1151', tamcn: 'D1127', authorized: 42, onHand: 41, missionCapable: 39, notMissionCapable: 2, readinessPercent: 95.1, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(4) },
  { id: 'eq-012', unitId: '13', unitName: '2/5', type: 'HMMWV M1151', tamcn: 'D1127', authorized: 42, onHand: 40, missionCapable: 36, notMissionCapable: 4, readinessPercent: 90.0, status: SupplyStatus.GREEN, lastUpdated: hoursAgo(3) },
  { id: 'eq-013', unitId: '16', unitName: '1st CEB', type: 'D7 Bulldozer', tamcn: 'A0080', authorized: 6, onHand: 5, missionCapable: 4, notMissionCapable: 1, readinessPercent: 80.0, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(8) },
  { id: 'eq-014', unitId: '16', unitName: '1st CEB', type: 'MK36 LCAC Wrecker', tamcn: 'D0094', authorized: 4, onHand: 4, missionCapable: 4, notMissionCapable: 0, readinessPercent: 100.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(1) },
  { id: 'eq-015', unitId: '4', unitName: '1/1', type: 'M2A1 .50 Cal MG', tamcn: 'E0955', authorized: 24, onHand: 24, missionCapable: 23, notMissionCapable: 1, readinessPercent: 95.8, status: SupplyStatus.GREEN, lastUpdated: daysAgo(1) },
  { id: 'eq-016', unitId: '4', unitName: '1/1', type: 'Mk19 Mod3 GMG', tamcn: 'E0985', authorized: 12, onHand: 12, missionCapable: 12, notMissionCapable: 0, readinessPercent: 100.0, status: SupplyStatus.GREEN, lastUpdated: daysAgo(2) },
  { id: 'eq-017', unitId: '4', unitName: '1/1', type: 'M240B MMG', tamcn: 'E0940', authorized: 36, onHand: 36, missionCapable: 34, notMissionCapable: 2, readinessPercent: 94.4, status: SupplyStatus.GREEN, lastUpdated: daysAgo(1) },
  { id: 'eq-018', unitId: '4', unitName: '1/1', type: 'AN/PRC-117G Radio', tamcn: 'F0080', authorized: 48, onHand: 46, missionCapable: 44, notMissionCapable: 2, readinessPercent: 95.7, status: SupplyStatus.GREEN, lastUpdated: daysAgo(2) },
  { id: 'eq-019', unitId: '5', unitName: '2/1', type: 'AN/PAS-13 TWS', tamcn: 'E5200', authorized: 36, onHand: 34, missionCapable: 30, notMissionCapable: 4, readinessPercent: 88.2, status: SupplyStatus.AMBER, lastUpdated: daysAgo(1) },
  { id: 'eq-020', unitId: '6', unitName: '3/1', type: 'JLTV M1280A1', tamcn: 'D1144', authorized: 20, onHand: 18, missionCapable: 15, notMissionCapable: 3, readinessPercent: 83.3, status: SupplyStatus.AMBER, lastUpdated: hoursAgo(3) },
];

// ---------------------------------------------------------------------------
// Active Movements / Convoys
// ---------------------------------------------------------------------------

export const DEMO_MOVEMENTS: Movement[] = [
  {
    id: 'mov-001',
    name: 'LOGPAC Charlie-1',
    originUnit: 'CLB-1 (Camp Pendleton)',
    destinationUnit: '1/1 BN (OP Forward)',
    status: MovementStatus.EN_ROUTE,
    cargo: 'CL I, CL III, CL V resupply',
    priority: 'ROUTINE',
    departureTime: hoursAgo(6),
    eta: hoursFromNow(4),
    vehicles: 12,
    personnel: 18,
    notes: 'Primary MSR open. MTVR convoy w/ gun truck escort.',
    lastUpdated: hoursAgo(1),
  },
  {
    id: 'mov-002',
    name: 'MEDEVAC Relay Echo',
    originUnit: '3/1 BN Aid Station',
    destinationUnit: 'Naval Hospital (Camp Pendleton)',
    status: MovementStatus.EN_ROUTE,
    cargo: 'CL VIII casualty evacuation',
    priority: 'PRIORITY',
    departureTime: hoursAgo(2),
    eta: hoursFromNow(1),
    vehicles: 3,
    personnel: 8,
    notes: '2x ambulance + 1x escort. Route Purple cleared.',
    lastUpdated: hoursAgo(0.5),
  },
  {
    id: 'mov-003',
    name: 'Equipment Recovery 7-2',
    originUnit: 'MWSS-372',
    destinationUnit: '3/1 BN Motor-T',
    status: MovementStatus.DELAYED,
    cargo: 'CL IX repair parts + wrecker',
    priority: 'URGENT',
    departureTime: hoursAgo(8),
    eta: hoursFromNow(6),
    vehicles: 4,
    personnel: 6,
    notes: 'Delayed 4hrs due to route clearance ops on MSR Tampa. ETA revised.',
    lastUpdated: hoursAgo(2),
  },
  {
    id: 'mov-004',
    name: 'Ammo Resupply Delta-3',
    originUnit: 'ASP Camp Pendleton',
    destinationUnit: '1/11 Marines (Firebase)',
    status: MovementStatus.PLANNED,
    cargo: '155mm HE M795, Illum, WP',
    priority: 'PRIORITY',
    departureTime: hoursFromNow(8),
    vehicles: 8,
    personnel: 14,
    notes: 'Awaiting route clearance confirmation. 1x PLS + 7x MTVR.',
    lastUpdated: hoursAgo(1),
  },
  {
    id: 'mov-005',
    name: 'Retrograde Convoy Alpha',
    originUnit: '2/1 BN (FOB Falcon)',
    destinationUnit: 'Camp Pendleton MCLB',
    status: MovementStatus.ARRIVED,
    cargo: 'NMCS equipment for 4th echelon repair',
    priority: 'ROUTINE',
    departureTime: hoursAgo(18),
    arrivalTime: hoursAgo(2),
    vehicles: 6,
    personnel: 10,
    notes: 'All vehicles accounted for. FLIPL initiated for 2x damaged HMMWV.',
    lastUpdated: hoursAgo(2),
  },
  {
    id: 'mov-006',
    name: 'Water Resupply Bravo-4',
    originUnit: 'BSSG-1 Water Point',
    destinationUnit: '1/5 Marines (FOB Eagle)',
    status: MovementStatus.EN_ROUTE,
    cargo: 'CL I potable water — 8000 gal',
    priority: 'ROUTINE',
    departureTime: hoursAgo(3),
    eta: hoursFromNow(5),
    vehicles: 4,
    personnel: 6,
    notes: '2x M970 fuel tanker + 2x MTVR water buffalo.',
    lastUpdated: hoursAgo(1),
  },
  {
    id: 'mov-007',
    name: 'BULK Fuel Convoy Foxtrot',
    originUnit: 'DLA DFSP Pendleton',
    destinationUnit: '1st CEB FARP',
    status: MovementStatus.CANCELLED,
    cargo: 'CL III JP-8 Bulk — 12000 gal',
    priority: 'ROUTINE',
    departureTime: hoursAgo(4),
    vehicles: 6,
    personnel: 10,
    notes: 'Cancelled — receiving unit FARP not established. Reschedule pending.',
    lastUpdated: hoursAgo(3),
  },
];

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export const DEMO_ALERTS: Alert[] = [
  {
    id: 'alt-001',
    type: AlertType.SUPPLY_CRITICAL,
    severity: AlertSeverity.CRITICAL,
    unitId: '6',
    unitName: '3/1',
    title: 'CRITICAL: CL III POL Below 2 DOS',
    message: '3/1 MOGAS at 2.0 DOS. Immediate resupply required. Current on-hand: 1,200 gal of 3,000 gal authorized. Consumption rate: 600 gal/day.',
    acknowledged: false,
    createdAt: hoursAgo(2),
    metadata: { supplyClass: 'III', dos: 2.0, threshold: 3 },
  },
  {
    id: 'alt-002',
    type: AlertType.SUPPLY_CRITICAL,
    severity: AlertSeverity.CRITICAL,
    unitId: '4',
    unitName: '1/1',
    title: 'CRITICAL: CL III JP-8 Below 3 DOS',
    message: '1/1 JP-8 fuel at 2.7 DOS. On-hand: 8,500 gal. Authorized: 15,000 gal. Due-in: 4,000 gal (LOGPAC Charlie-1 ETA 4hrs).',
    acknowledged: false,
    createdAt: hoursAgo(3),
    metadata: { supplyClass: 'III', dos: 2.7, threshold: 3 },
  },
  {
    id: 'alt-003',
    type: AlertType.SUPPLY_LOW,
    severity: AlertSeverity.WARNING,
    unitId: '6',
    unitName: '3/1',
    title: 'WARNING: CL I MRE Below 3 DOS',
    message: '3/1 MRE stocks at 2.4 DOS. Resupply convoy requested. Due-in: 1,000 cases.',
    acknowledged: false,
    createdAt: hoursAgo(4),
    metadata: { supplyClass: 'I', dos: 2.4, threshold: 3 },
  },
  {
    id: 'alt-004',
    type: AlertType.MOVEMENT_DELAYED,
    severity: AlertSeverity.WARNING,
    unitId: '6',
    unitName: '3/1',
    title: 'Convoy Delayed: Equipment Recovery 7-2',
    message: 'Equipment Recovery 7-2 delayed 4 hours due to route clearance operations on MSR Tampa. Revised ETA in 6 hours.',
    acknowledged: false,
    createdAt: hoursAgo(2),
    metadata: { movementId: 'mov-003', delayHours: 4 },
  },
  {
    id: 'alt-005',
    type: AlertType.EQUIPMENT_DOWN,
    severity: AlertSeverity.WARNING,
    unitId: '6',
    unitName: '3/1',
    title: 'Readiness Drop: LAV-25 Fleet Below 80%',
    message: '3/1 LAV-25 fleet readiness at 78.6%. 3 of 14 vehicles NMC. Awaiting CL IX parts (ERC 7-2).',
    acknowledged: false,
    createdAt: hoursAgo(6),
    metadata: { equipmentType: 'LAV-25', readiness: 78.6 },
  },
  {
    id: 'alt-006',
    type: AlertType.SUPPLY_LOW,
    severity: AlertSeverity.WARNING,
    unitId: '6',
    unitName: '3/1',
    title: 'WARNING: CL IX LAV Track Pads Critical',
    message: 'LAV-25 Track Pad Kit at 1.5 DOS for 3/1. Only 3 of 8 authorized on-hand. 3 due-in.',
    acknowledged: true,
    acknowledgedBy: 'MAJ Johnson',
    acknowledgedAt: hoursAgo(1),
    createdAt: hoursAgo(8),
    metadata: { supplyClass: 'IX', dos: 1.5 },
  },
  {
    id: 'alt-007',
    type: AlertType.READINESS_DROP,
    severity: AlertSeverity.INFO,
    unitId: '4',
    unitName: '1/1',
    title: 'MTVR Fleet Readiness Trending Down',
    message: '1/1 MTVR fleet readiness dropped from 92% to 86.4% over 7 days. 3 vehicles NMC pending CL IX repair parts.',
    acknowledged: true,
    acknowledgedBy: 'SSgt Williams',
    acknowledgedAt: hoursAgo(3),
    createdAt: hoursAgo(12),
    metadata: { equipmentType: 'MTVR MK23', readiness: 86.4, previousReadiness: 92.0 },
  },
  {
    id: 'alt-008',
    type: AlertType.SYSTEM,
    severity: AlertSeverity.INFO,
    unitId: '1',
    unitName: 'I MEF',
    title: 'Automated LOGSTAT Generated',
    message: 'Daily LOGSTAT for 1st Marine Regiment generated at 0600. All subordinate units reported.',
    acknowledged: true,
    acknowledgedBy: 'System',
    acknowledgedAt: hoursAgo(5),
    createdAt: hoursAgo(6),
  },
];

// ---------------------------------------------------------------------------
// Dashboard Summary
// ---------------------------------------------------------------------------

export const DEMO_DASHBOARD_SUMMARY: DashboardSummary = {
  unitId: '3',
  unitName: '1st Marines',
  overallReadiness: 87.3,
  overallStatus: SupplyStatus.AMBER,
  supplyStatus: [
    { supplyClass: SupplyClass.I, name: 'Subsistence', percentage: 72, dos: 4.5, status: SupplyStatus.AMBER, trend: 'DOWN', onHand: 9800, authorized: 13500 },
    { supplyClass: SupplyClass.II, name: 'Clothing & Equipment', percentage: 88, dos: 45.0, status: SupplyStatus.GREEN, trend: 'STABLE', onHand: 2730, authorized: 3100 },
    { supplyClass: SupplyClass.III, name: 'POL (Bulk)', percentage: 58, dos: 3.2, status: SupplyStatus.RED, trend: 'DOWN', onHand: 31700, authorized: 55000 },
    { supplyClass: SupplyClass.V, name: 'Ammunition', percentage: 76, dos: 6.2, status: SupplyStatus.GREEN, trend: 'STABLE', onHand: 1125, authorized: 1482 },
    { supplyClass: SupplyClass.VII, name: 'Major End Items', percentage: 89, dos: 350.0, status: SupplyStatus.GREEN, trend: 'STABLE', onHand: 100, authorized: 112 },
    { supplyClass: SupplyClass.VIII, name: 'Medical', percentage: 82, dos: 18.5, status: SupplyStatus.GREEN, trend: 'STABLE', onHand: 878, authorized: 1140 },
    { supplyClass: SupplyClass.IX, name: 'Repair Parts', percentage: 62, dos: 4.2, status: SupplyStatus.AMBER, trend: 'DOWN', onHand: 36, authorized: 64 },
  ],
  equipmentReadiness: {
    overall: 87.3,
    byType: [
      { type: 'HMMWV M1151', authorized: 126, missionCapable: 103, readinessPercent: 87.9, status: SupplyStatus.AMBER },
      { type: 'MTVR MK23', authorized: 84, missionCapable: 62, readinessPercent: 85.9, status: SupplyStatus.AMBER },
      { type: 'LAV-25', authorized: 16, missionCapable: 11, readinessPercent: 78.6, status: SupplyStatus.AMBER },
      { type: 'M777A2 Howitzer', authorized: 18, missionCapable: 16, readinessPercent: 88.9, status: SupplyStatus.AMBER },
      { type: 'AN/PRC-117G Radio', authorized: 48, missionCapable: 44, readinessPercent: 95.7, status: SupplyStatus.GREEN },
    ],
    status: SupplyStatus.AMBER,
    trend: 'DOWN',
  },
  activeMovements: 5,
  pendingRequisitions: 14,
  criticalAlerts: 2,
  warningAlerts: 4,
  sustainabilityDays: 3,
  lastUpdated: hoursAgo(0.5),
};

// ---------------------------------------------------------------------------
// Sustainability Projections
// ---------------------------------------------------------------------------

export const DEMO_SUSTAINABILITY: SustainabilityProjection[] = [
  { supplyClass: SupplyClass.I, name: 'Subsistence', currentDOS: 4.5, projectedDOS: 3.2, criticalThreshold: 3, status: SupplyStatus.AMBER },
  { supplyClass: SupplyClass.II, name: 'Clothing & Equipment', currentDOS: 45.0, projectedDOS: 42.0, criticalThreshold: 7, status: SupplyStatus.GREEN },
  { supplyClass: SupplyClass.III, name: 'POL (Bulk)', currentDOS: 3.2, projectedDOS: 1.8, criticalThreshold: 3, status: SupplyStatus.RED },
  { supplyClass: SupplyClass.IV, name: 'Construction', currentDOS: 7.8, projectedDOS: 6.5, criticalThreshold: 5, status: SupplyStatus.GREEN },
  { supplyClass: SupplyClass.V, name: 'Ammunition', currentDOS: 6.2, projectedDOS: 5.0, criticalThreshold: 3, status: SupplyStatus.GREEN },
  { supplyClass: SupplyClass.VII, name: 'Major End Items', currentDOS: 350.0, projectedDOS: 348.0, criticalThreshold: 30, status: SupplyStatus.GREEN },
  { supplyClass: SupplyClass.VIII, name: 'Medical', currentDOS: 18.5, projectedDOS: 15.0, criticalThreshold: 5, status: SupplyStatus.GREEN },
  { supplyClass: SupplyClass.IX, name: 'Repair Parts', currentDOS: 4.2, projectedDOS: 2.5, criticalThreshold: 3, status: SupplyStatus.AMBER },
];

// ---------------------------------------------------------------------------
// Consumption Rate Trends — 30 data points per supply class
// ---------------------------------------------------------------------------

function generateTrend(
  baseRate: number,
  variance: number,
  count = 30,
): ConsumptionDataPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const jitter = (Math.random() - 0.5) * 2 * variance;
    const trend = i > 20 ? baseRate * 1.05 : baseRate; // slight uptick last 10 days
    return {
      date: dateStr(count - 1 - i),
      rate: Math.round((trend + jitter) * 10) / 10,
      projected: i > count - 8 ? Math.round((trend * 1.08 + jitter * 0.5) * 10) / 10 : undefined,
    };
  });
}

export const DEMO_CONSUMPTION_TRENDS: Record<string, ConsumptionDataPoint[]> = {
  [SupplyClass.I]: generateTrend(475, 30),
  [SupplyClass.III]: generateTrend(3050, 200),
  [SupplyClass.V]: generateTrend(38, 6),
  [SupplyClass.VIII]: generateTrend(15, 4),
  [SupplyClass.IX]: generateTrend(2, 0.8),
};

// ---------------------------------------------------------------------------
// Readiness Trends — 30 data points
// ---------------------------------------------------------------------------

export const DEMO_READINESS_TRENDS: ConsumptionDataPoint[] = Array.from(
  { length: 30 },
  (_, i) => {
    const base = i < 10 ? 91 : i < 20 ? 89 : 87;
    const jitter = (Math.random() - 0.5) * 3;
    return {
      date: dateStr(29 - i),
      rate: Math.round((base + jitter) * 10) / 10,
    };
  },
);

// ---------------------------------------------------------------------------
// Ingestion History
// ---------------------------------------------------------------------------

export const DEMO_INGESTION_HISTORY: RawData[] = [
  {
    id: 'ing-001',
    source: 'GCSS-MC',
    filename: 'logstat_1stmar_20260301.xlsx',
    rawContent: 'Binary spreadsheet data — 42 rows x 18 columns',
    parsedRecords: 42,
    confidence: 0.96,
    status: 'APPROVED',
    uploadedBy: 'MAJ Johnson',
    uploadedAt: daysAgo(2),
    reviewedBy: 'COL Mitchell',
    reviewedAt: daysAgo(1),
  },
  {
    id: 'ing-002',
    source: 'GCSS-MC',
    filename: 'equip_readiness_1-1_20260228.csv',
    rawContent: 'CSV — 20 equipment records',
    parsedRecords: 20,
    confidence: 0.98,
    status: 'APPROVED',
    uploadedBy: 'SSgt Williams',
    uploadedAt: daysAgo(3),
    reviewedBy: 'MAJ Johnson',
    reviewedAt: daysAgo(2),
  },
  {
    id: 'ing-003',
    source: 'Manual Entry',
    filename: 'spot_report_3-1_supply.txt',
    rawContent: 'SPOT RPT: 3/1 BN reports CL III MOGAS critical. On-hand 1200 gal, auth 3000 gal. Consumption rate 600 gal/day. Request immediate resupply.',
    parsedRecords: 1,
    confidence: 0.82,
    status: 'PARSED',
    uploadedBy: 'SSgt Williams',
    uploadedAt: hoursAgo(6),
  },
  {
    id: 'ing-004',
    source: 'TAK Server',
    filename: 'cot_feed_20260303_0600.xml',
    rawContent: 'CoT XML feed — 15 position reports, 3 logistics markers',
    parsedRecords: 18,
    confidence: 0.91,
    status: 'PARSED',
    uploadedBy: 'System (TAK)',
    uploadedAt: hoursAgo(4),
  },
  {
    id: 'ing-005',
    source: 'Email',
    filename: 'sitrep_2-1_20260302.eml',
    rawContent: 'SITREP: 2/1 operations normal. CL I adequate. CL III at 80%. All vehicles MC except 3x NMC HMMWV pending parts.',
    parsedRecords: 5,
    confidence: 0.75,
    status: 'PENDING',
    uploadedBy: 'MAJ Chen',
    uploadedAt: hoursAgo(8),
    errors: ['Low confidence on CL III quantity extraction'],
  },
  {
    id: 'ing-006',
    source: 'GCSS-MC',
    filename: 'ammo_status_regiment_20260301.xlsx',
    rawContent: 'Binary spreadsheet — ammunition status by DODIC',
    parsedRecords: 35,
    confidence: 0.94,
    status: 'REVIEWED',
    uploadedBy: 'MAJ Johnson',
    uploadedAt: daysAgo(1),
    reviewedBy: 'MAJ Johnson',
    reviewedAt: hoursAgo(10),
  },
  {
    id: 'ing-007',
    source: 'Manual Entry',
    filename: 'convoy_status_update.txt',
    rawContent: 'UPDATE: LOGPAC Charlie-1 departed 0600. 12 veh, 18 pax. Cargo: CL I/III/V resupply for 1/1. ETA 1000.',
    parsedRecords: 1,
    confidence: 0.88,
    status: 'APPROVED',
    uploadedBy: 'SSgt Williams',
    uploadedAt: hoursAgo(10),
    reviewedBy: 'MAJ Johnson',
    reviewedAt: hoursAgo(9),
  },
];

// ---------------------------------------------------------------------------
// Review Queue
// ---------------------------------------------------------------------------

export const DEMO_REVIEW_QUEUE: ParsedRecord[] = [
  {
    id: 'rev-001',
    rawDataId: 'ing-003',
    originalText: '3/1 BN reports CL III MOGAS critical. On-hand 1200 gal, auth 3000 gal. Consumption rate 600 gal/day.',
    parsedFields: {
      unit: '3/1',
      supply_class: 'III',
      item: 'MOGAS',
      on_hand: 1200,
      authorized: 3000,
      consumption_rate: 600,
      unit_of_measure: 'gallons',
      status: 'RED',
    },
    confidence: 0.82,
    status: 'PENDING',
  },
  {
    id: 'rev-002',
    rawDataId: 'ing-005',
    originalText: '2/1 operations normal. CL I adequate. CL III at 80%. All vehicles MC except 3x NMC HMMWV pending parts.',
    parsedFields: {
      unit: '2/1',
      supply_class_I_status: 'GREEN',
      supply_class_III_pct: 80,
      hmmwv_nmc: 3,
    },
    confidence: 0.75,
    status: 'PENDING',
  },
  {
    id: 'rev-003',
    rawDataId: 'ing-004',
    originalText: '<event><point lat="33.3935" lon="-117.5698"/><detail><logpoint type="FARP" status="NOT_ESTABLISHED"/></detail></event>',
    parsedFields: {
      type: 'logistics_marker',
      subtype: 'FARP',
      lat: 33.3935,
      lon: -117.5698,
      status: 'NOT_ESTABLISHED',
    },
    confidence: 0.91,
    status: 'PENDING',
  },
  {
    id: 'rev-004',
    rawDataId: 'ing-005',
    originalText: 'CL III at 80%',
    parsedFields: {
      unit: '2/1',
      supply_class: 'III',
      fill_rate_pct: 80,
    },
    confidence: 0.70,
    status: 'PENDING',
  },
];

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export const DEMO_REPORTS: Report[] = [
  {
    id: 'rpt-001',
    type: ReportType.LOGSTAT,
    title: 'Daily LOGSTAT — 1st Marines',
    unitId: '3',
    unitName: '1st Marines',
    dateRange: { start: daysAgo(1), end: daysAgo(0) },
    status: ReportStatus.FINALIZED,
    content: 'LOGSTAT as of 030600Z MAR 2026\n\nCL I: AMBER — 4.5 DOS (9,800 of 13,500 auth)\nCL III: RED — 3.2 DOS (31,700 of 55,000 auth)\nCL V: GREEN — 6.2 DOS\nCL IX: AMBER — 4.2 DOS\n\nEquipment Readiness: 87.3%\nActive Convoys: 5\nCritical Alerts: 2\n\nCRITICAL: CL III resupply required within 24hrs for 1/1 and 3/1.\nRECOMMENDATION: Prioritize CL III bulk fuel convoy.',
    generatedBy: 'System',
    generatedAt: hoursAgo(6),
    finalizedAt: hoursAgo(5),
    finalizedBy: 'COL Mitchell',
  },
  {
    id: 'rpt-002',
    type: ReportType.READINESS,
    title: 'Weekly Equipment Readiness — 1st Marines',
    unitId: '3',
    unitName: '1st Marines',
    dateRange: { start: daysAgo(7), end: daysAgo(0) },
    status: ReportStatus.FINALIZED,
    content: 'EQUIPMENT READINESS REPORT\nPeriod: 24 FEB — 03 MAR 2026\n\nOverall: 87.3% (DOWN from 91.2%)\n\nHMMWV M1151: 87.9% (103/126 MC) — 3 units below threshold\nMTVR MK23: 85.9% (62/84 MC) — CL IX parts backlog\nLAV-25: 78.6% (11/14 MC) — CRITICAL: track pad shortage\nM777A2: 88.9% (16/18 MC)\n\nTrend: Declining. Root cause: CL IX supply chain delay.\nAction: Expedite ERC 7-2. Coordinate with MCLB Albany for LAV parts.',
    generatedBy: 'MAJ Johnson',
    generatedAt: daysAgo(1),
    finalizedAt: daysAgo(1),
    finalizedBy: 'COL Mitchell',
  },
  {
    id: 'rpt-003',
    type: ReportType.SUPPLY_STATUS,
    title: 'CL III Status Report — 1st Marines',
    unitId: '3',
    unitName: '1st Marines',
    dateRange: { start: daysAgo(3), end: daysAgo(0) },
    status: ReportStatus.READY,
    content: 'CLASS III POL STATUS\n\n1/1: JP-8 2.7 DOS — RED\n2/1: JP-8 3.9 DOS — AMBER\n3/1: JP-8 3.9 DOS — AMBER\n3/1: MOGAS 2.0 DOS — RED\n1/5: JP-8 3.3 DOS — AMBER\n1/11: JP-8 3.0 DOS — AMBER\n\nOverall regiment at 58% fill rate.\nProjected to BLACK in 48hrs without resupply.\n\nResupply scheduled:\n- LOGPAC Charlie-1 (4,000 gal JP-8) ETA 4hrs\n- BULK Fuel Foxtrot (12,000 gal) — CANCELLED, reschedule pending',
    generatedBy: 'MAJ Johnson',
    generatedAt: hoursAgo(3),
  },
  {
    id: 'rpt-004',
    type: ReportType.MOVEMENT_SUMMARY,
    title: 'Movement Summary — 03 MAR 2026',
    unitId: '3',
    unitName: '1st Marines',
    dateRange: { start: daysAgo(0), end: daysAgo(0) },
    status: ReportStatus.DRAFT,
    content: 'MOVEMENT SUMMARY\n\nActive: 3\nPlanned: 1\nCompleted: 1\nCancelled: 1\n\nDELAYED: Equipment Recovery 7-2 — 4hr delay due to route clearance.\nCANCELLED: BULK Fuel Convoy Foxtrot — FARP not established.',
    generatedBy: 'System',
    generatedAt: hoursAgo(1),
  },
  {
    id: 'rpt-005',
    type: ReportType.CUSTOM,
    title: 'Sustainment Assessment — Pre-Operation',
    unitId: '3',
    unitName: '1st Marines',
    dateRange: { start: daysAgo(7), end: hoursFromNow(168) },
    status: ReportStatus.GENERATING,
    generatedBy: 'COL Mitchell',
    generatedAt: hoursAgo(0.5),
  },
];
