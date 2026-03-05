import apiClient from './client';
import { isDemoMode } from './mockClient';
import type {
  MaintenanceDeadline,
  PMScheduleItem,
  MaintenanceAnalytics,
  DeadlineReason,
  PMType,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const MOCK_DEADLINES: MaintenanceDeadline[] = [
  {
    id: 1, unitId: 4, equipmentId: 101, deadlineDate: '2026-01-18',
    reason: 'AWAITING_PARTS', workOrderId: 1001, liftedDate: null, liftedBy: null,
    notes: 'Awaiting transmission rebuild kit NSN 2520-01-547-2450',
    bumperNumber: 'H-21', nomenclature: 'HMMWV M1151', daysDeadlined: 46,
  },
  {
    id: 2, unitId: 4, equipmentId: 102, deadlineDate: '2026-01-25',
    reason: 'SAFETY_ISSUE', workOrderId: 1002, liftedDate: null, liftedBy: null,
    notes: 'Brake system failure — front axle hydraulic lines compromised',
    bumperNumber: 'T-07', nomenclature: 'MTVR MK23', daysDeadlined: 39,
  },
  {
    id: 3, unitId: 4, equipmentId: 103, deadlineDate: '2026-02-02',
    reason: 'DEPOT_OVERHAUL', workOrderId: null, liftedDate: null, liftedBy: null,
    notes: 'Scheduled depot overhaul — turret traverse mechanism',
    bumperNumber: 'L-14', nomenclature: 'LAV-25', daysDeadlined: 31,
  },
  {
    id: 4, unitId: 4, equipmentId: 104, deadlineDate: '2026-02-08',
    reason: 'AWAITING_REPAIR', workOrderId: 1004, liftedDate: null, liftedBy: null,
    notes: 'Engine overheating — coolant system under repair',
    bumperNumber: 'H-33', nomenclature: 'HMMWV M1165', daysDeadlined: 25,
  },
  {
    id: 5, unitId: 4, equipmentId: 105, deadlineDate: '2026-02-14',
    reason: 'MODIFICATION_IN_PROGRESS', workOrderId: 1005, liftedDate: null, liftedBy: null,
    notes: 'CROWS II upgrade installation',
    bumperNumber: 'H-12', nomenclature: 'HMMWV M1151', daysDeadlined: 19,
  },
  {
    id: 6, unitId: 4, equipmentId: 106, deadlineDate: '2026-02-20',
    reason: 'AWAITING_PARTS', workOrderId: 1006, liftedDate: null, liftedBy: null,
    notes: 'Transfer case output shaft bearing — parts on order',
    bumperNumber: 'T-15', nomenclature: 'MTVR MK25', daysDeadlined: 13,
  },
  {
    id: 7, unitId: 4, equipmentId: 107, deadlineDate: '2026-02-25',
    reason: 'PENDING_INSPECTION', workOrderId: null, liftedDate: null, liftedBy: null,
    notes: 'Annual safety inspection overdue — scheduling with IMA',
    bumperNumber: 'A-03', nomenclature: 'AAV-P7A1', daysDeadlined: 8,
  },
  {
    id: 8, unitId: 4, equipmentId: 108, deadlineDate: '2026-02-27',
    reason: 'UNSCHEDULED_MAINTENANCE', workOrderId: 1008, liftedDate: null, liftedBy: null,
    notes: 'Steering gear box failure during convoy operations',
    bumperNumber: 'H-45', nomenclature: 'HMMWV M1152', daysDeadlined: 6,
  },
  {
    id: 9, unitId: 4, equipmentId: 109, deadlineDate: '2026-03-01',
    reason: 'AWAITING_REPAIR', workOrderId: 1009, liftedDate: null, liftedBy: null,
    notes: 'Alternator replacement — awaiting bench testing',
    bumperNumber: 'T-22', nomenclature: 'MTVR MK23', daysDeadlined: 4,
  },
  {
    id: 10, unitId: 4, equipmentId: 110, deadlineDate: '2026-03-03',
    reason: 'SAFETY_ISSUE', workOrderId: 1010, liftedDate: null, liftedBy: null,
    notes: 'Cracked windshield — ballistic glass on order',
    bumperNumber: 'H-09', nomenclature: 'HMMWV M1151', daysDeadlined: 2,
  },
];

const MOCK_PM_SCHEDULE: PMScheduleItem[] = [
  { id: 1, unitId: 4, equipmentId: 101, pmType: 'QUARTERLY', intervalValue: 90, lastPerformed: '2025-11-10', nextDue: '2026-02-08', isOverdue: true, bumperNumber: 'H-21', nomenclature: 'HMMWV M1151', daysOverdue: 25 },
  { id: 2, unitId: 4, equipmentId: 102, pmType: 'ANNUAL', intervalValue: 365, lastPerformed: '2025-02-15', nextDue: '2026-02-15', isOverdue: true, bumperNumber: 'T-07', nomenclature: 'MTVR MK23', daysOverdue: 18 },
  { id: 3, unitId: 4, equipmentId: 103, pmType: 'MONTHLY', intervalValue: 30, lastPerformed: '2026-01-20', nextDue: '2026-02-19', isOverdue: true, bumperNumber: 'L-14', nomenclature: 'LAV-25', daysOverdue: 14 },
  { id: 4, unitId: 4, equipmentId: 104, pmType: 'MILEAGE', intervalValue: 3000, lastPerformed: '2026-01-05', nextDue: '2026-02-28', isOverdue: true, bumperNumber: 'H-33', nomenclature: 'HMMWV M1165', daysOverdue: 5 },
  { id: 5, unitId: 4, equipmentId: 105, pmType: 'WEEKLY', intervalValue: 7, lastPerformed: '2026-02-26', nextDue: '2026-03-05', isOverdue: false, bumperNumber: 'H-12', nomenclature: 'HMMWV M1151', daysOverdue: 0 },
  { id: 6, unitId: 4, equipmentId: 106, pmType: 'DAILY', intervalValue: 1, lastPerformed: '2026-03-04', nextDue: '2026-03-05', isOverdue: false, bumperNumber: 'T-15', nomenclature: 'MTVR MK25', daysOverdue: 0 },
  { id: 7, unitId: 4, equipmentId: 107, pmType: 'QUARTERLY', intervalValue: 90, lastPerformed: '2025-12-15', nextDue: '2026-03-15', isOverdue: false, bumperNumber: 'A-03', nomenclature: 'AAV-P7A1', daysOverdue: 0 },
  { id: 8, unitId: 4, equipmentId: 108, pmType: 'MONTHLY', intervalValue: 30, lastPerformed: '2026-02-20', nextDue: '2026-03-22', isOverdue: false, bumperNumber: 'H-45', nomenclature: 'HMMWV M1152', daysOverdue: 0 },
  { id: 9, unitId: 4, equipmentId: 109, pmType: 'ANNUAL', intervalValue: 365, lastPerformed: '2025-04-10', nextDue: '2026-04-10', isOverdue: false, bumperNumber: 'T-22', nomenclature: 'MTVR MK23', daysOverdue: 0 },
  { id: 10, unitId: 4, equipmentId: 110, pmType: 'WEEKLY', intervalValue: 7, lastPerformed: '2026-03-01', nextDue: '2026-03-08', isOverdue: false, bumperNumber: 'H-09', nomenclature: 'HMMWV M1151', daysOverdue: 0 },
  { id: 11, unitId: 4, equipmentId: 111, pmType: 'QUARTERLY', intervalValue: 90, lastPerformed: '2025-12-01', nextDue: '2026-03-01', isOverdue: true, bumperNumber: 'L-08', nomenclature: 'LAV-25', daysOverdue: 4 },
  { id: 12, unitId: 4, equipmentId: 112, pmType: 'DAILY', intervalValue: 1, lastPerformed: '2026-03-04', nextDue: '2026-03-05', isOverdue: false, bumperNumber: 'H-51', nomenclature: 'HMMWV M1151', daysOverdue: 0 },
  { id: 13, unitId: 4, equipmentId: 113, pmType: 'MONTHLY', intervalValue: 30, lastPerformed: '2026-02-10', nextDue: '2026-03-12', isOverdue: false, bumperNumber: 'T-30', nomenclature: 'MTVR MK23', daysOverdue: 0 },
  { id: 14, unitId: 4, equipmentId: 114, pmType: 'MILEAGE', intervalValue: 6000, lastPerformed: '2025-10-15', nextDue: '2026-03-20', isOverdue: false, bumperNumber: 'A-06', nomenclature: 'AAV-P7A1', daysOverdue: 0 },
  { id: 15, unitId: 4, equipmentId: 115, pmType: 'WEEKLY', intervalValue: 7, lastPerformed: '2026-02-22', nextDue: '2026-03-01', isOverdue: true, bumperNumber: 'H-28', nomenclature: 'HMMWV M1165', daysOverdue: 4 },
  { id: 16, unitId: 4, equipmentId: 116, pmType: 'QUARTERLY', intervalValue: 90, lastPerformed: '2026-01-05', nextDue: '2026-04-05', isOverdue: false, bumperNumber: 'L-19', nomenclature: 'LAV-25', daysOverdue: 0 },
  { id: 17, unitId: 4, equipmentId: 117, pmType: 'ANNUAL', intervalValue: 365, lastPerformed: '2025-06-01', nextDue: '2026-06-01', isOverdue: false, bumperNumber: 'T-41', nomenclature: 'MTVR MK25', daysOverdue: 0 },
  { id: 18, unitId: 4, equipmentId: 118, pmType: 'MONTHLY', intervalValue: 30, lastPerformed: '2026-02-25', nextDue: '2026-03-27', isOverdue: false, bumperNumber: 'H-60', nomenclature: 'HMMWV M1152', daysOverdue: 0 },
];

const MOCK_ANALYTICS: MaintenanceAnalytics = {
  deadlineRate: 12.4,
  mttr: 22.3,
  partsFillRate: 87.2,
  cannibalizationRate: 4.8,
  manHoursLast30d: 1847,
  overduePms: MOCK_PM_SCHEDULE.filter((pm) => pm.isOverdue),
  deadlineEquipment: MOCK_DEADLINES,
  topFaults: [
    { faultDescription: 'Transmission malfunction', equipmentType: 'HMMWV', count: 14 },
    { faultDescription: 'Brake system failure', equipmentType: 'MTVR', count: 11 },
    { faultDescription: 'Engine overheating', equipmentType: 'HMMWV', count: 9 },
    { faultDescription: 'Electrical system short', equipmentType: 'LAV-25', count: 8 },
    { faultDescription: 'Hydraulic leak', equipmentType: 'AAV-P7A1', count: 7 },
    { faultDescription: 'Suspension component wear', equipmentType: 'HMMWV', count: 6 },
    { faultDescription: 'Cooling system failure', equipmentType: 'MTVR', count: 5 },
    { faultDescription: 'Turret traverse fault', equipmentType: 'LAV-25', count: 4 },
    { faultDescription: 'Tire/wheel damage', equipmentType: 'HMMWV', count: 4 },
    { faultDescription: 'Fuel system contamination', equipmentType: 'MTVR', count: 3 },
  ],
  weeklyTrend: [
    { weekStart: '2025-12-09', totalHours: 142, workOrderCount: 18 },
    { weekStart: '2025-12-16', totalHours: 168, workOrderCount: 22 },
    { weekStart: '2025-12-23', totalHours: 95, workOrderCount: 12 },
    { weekStart: '2025-12-30', totalHours: 110, workOrderCount: 14 },
    { weekStart: '2026-01-06', totalHours: 185, workOrderCount: 24 },
    { weekStart: '2026-01-13', totalHours: 210, workOrderCount: 28 },
    { weekStart: '2026-01-20', totalHours: 198, workOrderCount: 26 },
    { weekStart: '2026-01-27', totalHours: 175, workOrderCount: 21 },
    { weekStart: '2026-02-03', totalHours: 162, workOrderCount: 19 },
    { weekStart: '2026-02-10', totalHours: 188, workOrderCount: 23 },
    { weekStart: '2026-02-17', totalHours: 205, workOrderCount: 27 },
    { weekStart: '2026-02-24', totalHours: 178, workOrderCount: 22 },
  ],
};

// ---------------------------------------------------------------------------
// Simulate network latency
// ---------------------------------------------------------------------------

const mockDelay = (ms = 200 + Math.random() * 200): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getMaintenanceDeadlines(
  unitId?: number,
): Promise<MaintenanceDeadline[]> {
  if (isDemoMode) {
    await mockDelay();
    if (unitId) return MOCK_DEADLINES.filter((d) => d.unitId === unitId);
    return MOCK_DEADLINES;
  }
  const response = await apiClient.get<MaintenanceDeadline[]>(
    '/maintenance/deadlines',
    { params: unitId ? { unit_id: unitId } : undefined },
  );
  return response.data;
}

export async function createDeadline(data: {
  unitId: number;
  equipmentId: number;
  deadlineDate: string;
  reason: DeadlineReason;
  workOrderId?: number | null;
  notes?: string | null;
}): Promise<MaintenanceDeadline> {
  if (isDemoMode) {
    await mockDelay();
    const newDeadline: MaintenanceDeadline = {
      id: MOCK_DEADLINES.length + 1,
      unitId: data.unitId,
      equipmentId: data.equipmentId,
      deadlineDate: data.deadlineDate,
      reason: data.reason,
      workOrderId: data.workOrderId ?? null,
      liftedDate: null,
      liftedBy: null,
      notes: data.notes ?? null,
      bumperNumber: 'NEW-01',
      nomenclature: 'Equipment',
      daysDeadlined: 0,
    };
    MOCK_DEADLINES.push(newDeadline);
    return newDeadline;
  }
  const response = await apiClient.post<MaintenanceDeadline>(
    '/maintenance/deadlines',
    data,
  );
  return response.data;
}

export async function liftDeadline(
  deadlineId: number,
): Promise<MaintenanceDeadline> {
  if (isDemoMode) {
    await mockDelay();
    const idx = MOCK_DEADLINES.findIndex((d) => d.id === deadlineId);
    if (idx >= 0) {
      MOCK_DEADLINES[idx] = {
        ...MOCK_DEADLINES[idx],
        liftedDate: new Date().toISOString(),
        liftedBy: 'DEMO_USER',
      };
      return MOCK_DEADLINES[idx];
    }
    throw new Error('Deadline not found');
  }
  const response = await apiClient.post<MaintenanceDeadline>(
    `/maintenance/deadlines/${deadlineId}/lift`,
  );
  return response.data;
}

export async function getPMSchedule(
  unitId?: number,
  overdueOnly?: boolean,
): Promise<PMScheduleItem[]> {
  if (isDemoMode) {
    await mockDelay();
    let items = [...MOCK_PM_SCHEDULE];
    if (unitId) items = items.filter((pm) => pm.unitId === unitId);
    if (overdueOnly) items = items.filter((pm) => pm.isOverdue);
    return items;
  }
  const response = await apiClient.get<PMScheduleItem[]>(
    '/maintenance/pm-schedule',
    {
      params: {
        ...(unitId ? { unit_id: unitId } : {}),
        ...(overdueOnly ? { overdue_only: true } : {}),
      },
    },
  );
  return response.data;
}

export async function createPMSchedule(data: {
  unitId: number;
  equipmentId: number;
  pmType: PMType;
  intervalValue: number;
  lastPerformed?: string | null;
  nextDue?: string | null;
}): Promise<PMScheduleItem> {
  if (isDemoMode) {
    await mockDelay();
    const newPM: PMScheduleItem = {
      id: MOCK_PM_SCHEDULE.length + 1,
      unitId: data.unitId,
      equipmentId: data.equipmentId,
      pmType: data.pmType,
      intervalValue: data.intervalValue,
      lastPerformed: data.lastPerformed ?? null,
      nextDue: data.nextDue ?? null,
      isOverdue: false,
      bumperNumber: 'NEW-01',
      nomenclature: 'Equipment',
      daysOverdue: 0,
    };
    MOCK_PM_SCHEDULE.push(newPM);
    return newPM;
  }
  const response = await apiClient.post<PMScheduleItem>(
    '/maintenance/pm-schedule',
    data,
  );
  return response.data;
}

export async function getMaintenanceAnalytics(
  unitId: number,
): Promise<MaintenanceAnalytics> {
  if (isDemoMode) {
    await mockDelay();
    return MOCK_ANALYTICS;
  }
  const response = await apiClient.get<MaintenanceAnalytics>(
    `/maintenance/analytics/${unitId}`,
  );
  return response.data;
}
