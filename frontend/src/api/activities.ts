// =============================================================================
// KEYSTONE — Activity Feed API
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';
import type { ApiResponse } from '@/lib/types';

export interface ActivityEvent {
  id: number;
  activityType: 'REQUISITION' | 'WORK_ORDER' | 'CONVOY' | 'SUPPLY' | 'ALERT' | 'PERSONNEL' | 'REPORT';
  userName?: string;
  userRank?: string;
  unitName?: string;
  action: string;
  description: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Mock activity events for demo mode
// ---------------------------------------------------------------------------

function generateMockActivities(): ActivityEvent[] {
  const now = Date.now();
  const events: ActivityEvent[] = [
    { id: 1, activityType: 'REQUISITION', userName: 'Miguel Rodriguez', userRank: 'SSgt', unitName: 'A Btry 1/11', action: 'SUBMITTED', description: 'Submitted REQ-2026-0347 for 500x 5.56mm Ball (ROUTINE)', createdAt: new Date(now - 45000).toISOString() },
    { id: 2, activityType: 'WORK_ORDER', userName: 'Patrick O\'Malley', userRank: 'GySgt', unitName: 'H&S Btry 1/11', action: 'CREATED', description: 'Created WO-1192: Engine oil leak on HMMWV H-12', createdAt: new Date(now - 120000).toISOString() },
    { id: 3, activityType: 'CONVOY', userName: 'Luis Garcia', userRank: 'Sgt', unitName: 'H&S Btry 1/11', action: 'DISPATCHED', description: 'Dispatched Convoy ALPHA-3: Camp Pendleton to 29 Palms', createdAt: new Date(now - 180000).toISOString() },
    { id: 4, activityType: 'ALERT', action: 'TRIGGERED', description: 'LOW SUPPLY — CL III fuel below 3 DOS for B Btry', createdAt: new Date(now - 240000).toISOString() },
    { id: 5, activityType: 'SUPPLY', userName: 'David Kim', userRank: 'SSgt', unitName: 'B Btry 1/11', action: 'RECEIVED', description: 'Received CL IX parts shipment (14 line items)', createdAt: new Date(now - 360000).toISOString() },
    { id: 6, activityType: 'PERSONNEL', userName: 'Emily J. Foster', userRank: 'Capt', unitName: '1/11', action: 'UPDATED', description: 'Updated morning strength report — 847/892 (94.9%)', createdAt: new Date(now - 480000).toISOString() },
    { id: 7, activityType: 'REPORT', userName: 'Michelle L. Santos', userRank: 'Capt', unitName: '1/11', action: 'GENERATED', description: 'Generated daily LOGSTAT report for 1/11', createdAt: new Date(now - 600000).toISOString() },
    { id: 8, activityType: 'WORK_ORDER', userName: 'Patrick O\'Malley', userRank: 'GySgt', unitName: 'H&S Btry 1/11', action: 'COMPLETED', description: 'Closed WO-1187: Track pad replacement on M777 C-07', createdAt: new Date(now - 720000).toISOString() },
    { id: 9, activityType: 'CONVOY', userName: 'Michael Thompson', userRank: 'GySgt', unitName: 'H&S Btry 1/11', action: 'ARRIVED', description: 'Convoy BRAVO-1 arrived at Camp Wilson (on time)', createdAt: new Date(now - 900000).toISOString() },
    { id: 10, activityType: 'REQUISITION', userName: 'David Kim', userRank: 'SSgt', unitName: 'B Btry 1/11', action: 'APPROVED', description: 'REQ-2026-0341 approved: 200x MRE cases', createdAt: new Date(now - 1080000).toISOString() },
    { id: 11, activityType: 'ALERT', action: 'TRIGGERED', description: 'EQUIPMENT DEADLINED — LVSR L-03 NMC (engine)', createdAt: new Date(now - 1200000).toISOString() },
    { id: 12, activityType: 'SUPPLY', userName: 'Miguel Rodriguez', userRank: 'SSgt', unitName: 'A Btry 1/11', action: 'ISSUED', description: 'Issued 50x batteries BA-5590 to 2nd Plt', createdAt: new Date(now - 1500000).toISOString() },
    { id: 13, activityType: 'WORK_ORDER', userName: 'Patrick O\'Malley', userRank: 'GySgt', unitName: 'H&S Btry 1/11', action: 'UPDATED', description: 'WO-1185 status: awaiting CL IX parts (backordered)', createdAt: new Date(now - 1800000).toISOString() },
    { id: 14, activityType: 'PERSONNEL', userName: 'Carlos M. Rivera', userRank: 'SgtMaj', unitName: '1/11', action: 'REVIEWED', description: 'Reviewed duty status changes — 3 Marines TAD to Regt', createdAt: new Date(now - 2100000).toISOString() },
    { id: 15, activityType: 'REPORT', userName: 'Ryan K. O\'Brien', userRank: 'Maj', unitName: '1/11', action: 'SUBMITTED', description: 'Submitted SITREP to 11th Marines (1800 cycle)', createdAt: new Date(now - 2400000).toISOString() },
    { id: 16, activityType: 'CONVOY', userName: 'Luis Garcia', userRank: 'Sgt', unitName: 'H&S Btry 1/11', action: 'PLANNED', description: 'Planned Convoy CHARLIE-2: Mainside to ASP (tomorrow 0600)', createdAt: new Date(now - 2700000).toISOString() },
    { id: 17, activityType: 'REQUISITION', userName: 'Miguel Rodriguez', userRank: 'SSgt', unitName: 'A Btry 1/11', action: 'SUBMITTED', description: 'Submitted REQ-2026-0348 for 20x water cans (5-gallon)', createdAt: new Date(now - 3000000).toISOString() },
    { id: 18, activityType: 'ALERT', action: 'RESOLVED', description: 'PM OVERDUE resolved — M777 A-04 service completed', createdAt: new Date(now - 3300000).toISOString() },
  ];
  return events;
}

let cachedMockActivities: ActivityEvent[] | null = null;

function getMockActivities(): ActivityEvent[] {
  if (!cachedMockActivities) {
    cachedMockActivities = generateMockActivities();
  }
  return cachedMockActivities;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function getActivities(params?: {
  unitId?: number;
  type?: string;
  limit?: number;
}): Promise<ActivityEvent[]> {
  if (isDemoMode) {
    let events = getMockActivities();
    if (params?.type && params.type !== 'ALL') {
      events = events.filter((e) => e.activityType === params.type);
    }
    if (params?.limit) {
      events = events.slice(0, params.limit);
    }
    return events;
  }

  const response = await apiClient.get<ApiResponse<ActivityEvent[]>>('/activities', { params });
  return response.data.data;
}
