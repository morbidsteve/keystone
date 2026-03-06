// =============================================================================
// KEYSTONE — Activity Feed API
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';
import type { ApiResponse } from '@/lib/types';

export interface ActivityEvent {
  id: number;
  activity_type: 'REQUISITION' | 'WORK_ORDER' | 'CONVOY' | 'SUPPLY' | 'ALERT' | 'PERSONNEL' | 'REPORT';
  user_name?: string;
  user_rank?: string;
  unit_name?: string;
  action: string;
  description: string;
  details?: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Mock activity events for demo mode
// ---------------------------------------------------------------------------

function generateMockActivities(): ActivityEvent[] {
  const now = Date.now();
  const events: ActivityEvent[] = [
    { id: 1, activity_type: 'REQUISITION', user_name: 'Miguel Rodriguez', user_rank: 'SSgt', unit_name: 'A Btry 1/11', action: 'SUBMITTED', description: 'Submitted REQ-2026-0347 for 500x 5.56mm Ball (ROUTINE)', created_at: new Date(now - 45000).toISOString() },
    { id: 2, activity_type: 'WORK_ORDER', user_name: 'Patrick O\'Malley', user_rank: 'GySgt', unit_name: 'H&S Btry 1/11', action: 'CREATED', description: 'Created WO-1192: Engine oil leak on HMMWV H-12', created_at: new Date(now - 120000).toISOString() },
    { id: 3, activity_type: 'CONVOY', user_name: 'Luis Garcia', user_rank: 'Sgt', unit_name: 'H&S Btry 1/11', action: 'DISPATCHED', description: 'Dispatched Convoy ALPHA-3: Camp Pendleton to 29 Palms', created_at: new Date(now - 180000).toISOString() },
    { id: 4, activity_type: 'ALERT', action: 'TRIGGERED', description: 'LOW SUPPLY — CL III fuel below 3 DOS for B Btry', created_at: new Date(now - 240000).toISOString() },
    { id: 5, activity_type: 'SUPPLY', user_name: 'David Kim', user_rank: 'SSgt', unit_name: 'B Btry 1/11', action: 'RECEIVED', description: 'Received CL IX parts shipment (14 line items)', created_at: new Date(now - 360000).toISOString() },
    { id: 6, activity_type: 'PERSONNEL', user_name: 'Emily J. Foster', user_rank: 'Capt', unit_name: '1/11', action: 'UPDATED', description: 'Updated morning strength report — 847/892 (94.9%)', created_at: new Date(now - 480000).toISOString() },
    { id: 7, activity_type: 'REPORT', user_name: 'Michelle L. Santos', user_rank: 'Capt', unit_name: '1/11', action: 'GENERATED', description: 'Generated daily LOGSTAT report for 1/11', created_at: new Date(now - 600000).toISOString() },
    { id: 8, activity_type: 'WORK_ORDER', user_name: 'Patrick O\'Malley', user_rank: 'GySgt', unit_name: 'H&S Btry 1/11', action: 'COMPLETED', description: 'Closed WO-1187: Track pad replacement on M777 C-07', created_at: new Date(now - 720000).toISOString() },
    { id: 9, activity_type: 'CONVOY', user_name: 'Michael Thompson', user_rank: 'GySgt', unit_name: 'H&S Btry 1/11', action: 'ARRIVED', description: 'Convoy BRAVO-1 arrived at Camp Wilson (on time)', created_at: new Date(now - 900000).toISOString() },
    { id: 10, activity_type: 'REQUISITION', user_name: 'David Kim', user_rank: 'SSgt', unit_name: 'B Btry 1/11', action: 'APPROVED', description: 'REQ-2026-0341 approved: 200x MRE cases', created_at: new Date(now - 1080000).toISOString() },
    { id: 11, activity_type: 'ALERT', action: 'TRIGGERED', description: 'EQUIPMENT DEADLINED — LVSR L-03 NMC (engine)', created_at: new Date(now - 1200000).toISOString() },
    { id: 12, activity_type: 'SUPPLY', user_name: 'Miguel Rodriguez', user_rank: 'SSgt', unit_name: 'A Btry 1/11', action: 'ISSUED', description: 'Issued 50x batteries BA-5590 to 2nd Plt', created_at: new Date(now - 1500000).toISOString() },
    { id: 13, activity_type: 'WORK_ORDER', user_name: 'Patrick O\'Malley', user_rank: 'GySgt', unit_name: 'H&S Btry 1/11', action: 'UPDATED', description: 'WO-1185 status: awaiting CL IX parts (backordered)', created_at: new Date(now - 1800000).toISOString() },
    { id: 14, activity_type: 'PERSONNEL', user_name: 'Carlos M. Rivera', user_rank: 'SgtMaj', unit_name: '1/11', action: 'REVIEWED', description: 'Reviewed duty status changes — 3 Marines TAD to Regt', created_at: new Date(now - 2100000).toISOString() },
    { id: 15, activity_type: 'REPORT', user_name: 'Ryan K. O\'Brien', user_rank: 'Maj', unit_name: '1/11', action: 'SUBMITTED', description: 'Submitted SITREP to 11th Marines (1800 cycle)', created_at: new Date(now - 2400000).toISOString() },
    { id: 16, activity_type: 'CONVOY', user_name: 'Luis Garcia', user_rank: 'Sgt', unit_name: 'H&S Btry 1/11', action: 'PLANNED', description: 'Planned Convoy CHARLIE-2: Mainside to ASP (tomorrow 0600)', created_at: new Date(now - 2700000).toISOString() },
    { id: 17, activity_type: 'REQUISITION', user_name: 'Miguel Rodriguez', user_rank: 'SSgt', unit_name: 'A Btry 1/11', action: 'SUBMITTED', description: 'Submitted REQ-2026-0348 for 20x water cans (5-gallon)', created_at: new Date(now - 3000000).toISOString() },
    { id: 18, activity_type: 'ALERT', action: 'RESOLVED', description: 'PM OVERDUE resolved — M777 A-04 service completed', created_at: new Date(now - 3300000).toISOString() },
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
  unit_id?: number;
  type?: string;
  limit?: number;
}): Promise<ActivityEvent[]> {
  if (isDemoMode) {
    let events = getMockActivities();
    if (params?.type && params.type !== 'ALL') {
      events = events.filter((e) => e.activity_type === params.type);
    }
    if (params?.limit) {
      events = events.slice(0, params.limit);
    }
    return events;
  }

  const response = await apiClient.get<ApiResponse<ActivityEvent[]>>('/activities', { params });
  return response.data.data;
}
