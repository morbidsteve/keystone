import { describe, it, expect, vi, beforeEach } from 'vitest';

// Ensure demo mode is off so real API calls are tested
vi.mock('../../src/api/mockClient', () => ({
  isDemoMode: false,
  mockApi: {},
  mockGetAlertSummary: vi.fn(),
  mockResolveAlert: vi.fn(),
  mockGetAlertRules: vi.fn(),
  mockCreateAlertRule: vi.fn(),
  mockUpdateAlertRule: vi.fn(),
}));

vi.mock('../../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('../../src/api/demoUsers', () => ({
  DEMO_USERS_LIST: [],
}));

vi.mock('../../src/api/mockData', () => ({
  DEMO_SUPPLY_RECORDS: [],
  DEMO_INDIVIDUAL_EQUIPMENT: [],
  DEMO_WORK_ORDERS: [],
  DEMO_UNITS: [],
  DEMO_ALERTS: [],
  DEMO_MOVEMENTS: [],
  DEMO_REPORTS: [],
  DEMO_PERSONNEL: [],
}));

import apiClient from '../../src/api/client';
import * as alertsApi from '../../src/api/alerts';
import * as notificationsApi from '../../src/api/notifications';
import * as equipmentApi from '../../src/api/equipment';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockDelete = vi.mocked(apiClient.delete);

describe('Alerts API endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAlerts calls GET /alerts with params', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } } as any);
    const params = { unitId: 'u1', severity: 'CRITICAL' };

    await alertsApi.getAlerts(params);

    expect(mockGet).toHaveBeenCalledWith('/alerts', { params });
  });

  it('getAlerts returns data from response.data.data', async () => {
    const alerts = [{ id: '1', title: 'Test' }];
    mockGet.mockResolvedValue({ data: { data: alerts } } as any);

    const result = await alertsApi.getAlerts();
    expect(result).toEqual(alerts);
  });

  it('acknowledgeAlert calls POST /alerts/:id/acknowledge', async () => {
    mockPost.mockResolvedValue({ data: { data: { id: '1', acknowledged: true } } } as any);

    await alertsApi.acknowledgeAlert('alert-123');

    expect(mockPost).toHaveBeenCalledWith('/alerts/alert-123/acknowledge');
  });

  it('getAlertCount calls GET /alerts/count', async () => {
    mockGet.mockResolvedValue({ data: { data: { count: 42 } } } as any);

    const result = await alertsApi.getAlertCount();

    expect(mockGet).toHaveBeenCalledWith('/alerts/count');
    expect(result).toBe(42);
  });

  it('resolveAlert calls PUT /alerts/:id/resolve', async () => {
    mockPut.mockResolvedValue({} as any);

    await alertsApi.resolveAlert('alert-5');

    expect(mockPut).toHaveBeenCalledWith('/alerts/alert-5/resolve');
  });

  it('escalateAlert calls PUT /alerts/:id/escalate with userId', async () => {
    mockPut.mockResolvedValue({} as any);

    await alertsApi.escalateAlert('alert-7', 42);

    expect(mockPut).toHaveBeenCalledWith('/alerts/alert-7/escalate', {
      escalate_to_user_id: 42,
    });
  });

  it('getAlertRules calls GET /alerts/rules', async () => {
    mockGet.mockResolvedValue({ data: [] } as any);

    await alertsApi.getAlertRules();

    expect(mockGet).toHaveBeenCalledWith('/alerts/rules');
  });

  it('createAlertRule calls POST /alerts/rules with data', async () => {
    const data = { name: 'Low Supply', severity: 'WARNING' };
    mockPost.mockResolvedValue({ data: { ...data, id: 1 } } as any);

    await alertsApi.createAlertRule(data);

    expect(mockPost).toHaveBeenCalledWith('/alerts/rules', data);
  });

  it('updateAlertRule calls PUT /alerts/rules/:id', async () => {
    const data = { name: 'Updated Rule' };
    mockPut.mockResolvedValue({ data: { id: 5, ...data } } as any);

    await alertsApi.updateAlertRule(5, data);

    expect(mockPut).toHaveBeenCalledWith('/alerts/rules/5', data);
  });

  it('deleteAlertRule calls DELETE /alerts/rules/:id', async () => {
    mockDelete.mockResolvedValue({} as any);

    await alertsApi.deleteAlertRule(3);

    expect(mockDelete).toHaveBeenCalledWith('/alerts/rules/3');
  });

  it('evaluateRule calls POST /alerts/rules/:id/evaluate', async () => {
    mockPost.mockResolvedValue({ data: { triggered: true, message: 'fired' } } as any);

    const result = await alertsApi.evaluateRule(10);

    expect(mockPost).toHaveBeenCalledWith('/alerts/rules/10/evaluate');
    expect(result).toEqual({ triggered: true, message: 'fired' });
  });
});

describe('Notifications API endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getNotifications calls GET /notifications', async () => {
    mockGet.mockResolvedValue({ data: [] } as any);

    await notificationsApi.getNotifications();

    expect(mockGet).toHaveBeenCalledWith('/notifications');
  });

  it('getNotifications with unreadOnly appends query param', async () => {
    mockGet.mockResolvedValue({ data: [] } as any);

    await notificationsApi.getNotifications(true);

    expect(mockGet).toHaveBeenCalledWith('/notifications?unread_only=true');
  });

  it('getUnreadCount calls GET /notifications/unread-count', async () => {
    mockGet.mockResolvedValue({ data: { count: 7 } } as any);

    const result = await notificationsApi.getUnreadCount();

    expect(mockGet).toHaveBeenCalledWith('/notifications/unread-count');
    expect(result).toBe(7);
  });

  it('markNotificationRead calls PUT /notifications/:id/read', async () => {
    mockPut.mockResolvedValue({} as any);

    await notificationsApi.markNotificationRead(42);

    expect(mockPut).toHaveBeenCalledWith('/notifications/42/read');
  });

  it('markAllNotificationsRead calls PUT /notifications/read-all', async () => {
    mockPut.mockResolvedValue({} as any);

    await notificationsApi.markAllNotificationsRead();

    expect(mockPut).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('getNotificationPreferences calls GET /notifications/preferences', async () => {
    mockGet.mockResolvedValue({ data: [] } as any);

    await notificationsApi.getNotificationPreferences();

    expect(mockGet).toHaveBeenCalledWith('/notifications/preferences');
  });

  it('updateNotificationPreference calls PUT with correct params', async () => {
    const data = { channel: 'BOTH', min_severity: 'WARNING' };
    mockPut.mockResolvedValue({ data: { id: 1, alert_type: 'LOW_DOS', ...data } } as any);

    await notificationsApi.updateNotificationPreference('LOW_DOS', data);

    expect(mockPut).toHaveBeenCalledWith('/notifications/preferences/LOW_DOS', data);
  });
});

describe('Equipment API endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getEquipmentRecords calls GET /equipment with filters', async () => {
    mockGet.mockResolvedValue({ data: { items: [], total: 0 } } as any);
    const filters = { unitId: 'u1', status: 'FMC' };

    await equipmentApi.getEquipmentRecords(filters as any);

    expect(mockGet).toHaveBeenCalledWith('/equipment', { params: filters });
  });

  it('getEquipmentById calls GET /equipment/:id', async () => {
    mockGet.mockResolvedValue({ data: { data: { id: 'eq-1', name: 'HMMWV' } } } as any);

    const result = await equipmentApi.getEquipmentById('eq-1');

    expect(mockGet).toHaveBeenCalledWith('/equipment/eq-1');
    expect(result).toEqual({ id: 'eq-1', name: 'HMMWV' });
  });

  it('createEquipment calls POST /equipment', async () => {
    const data = { name: 'MTVR' };
    mockPost.mockResolvedValue({ data: { data: { id: 'new', ...data } } } as any);

    await equipmentApi.createEquipment(data as any);

    expect(mockPost).toHaveBeenCalledWith('/equipment', data);
  });

  it('updateEquipment calls PUT /equipment/:id', async () => {
    const data = { status: 'NMC' };
    mockPut.mockResolvedValue({ data: { data: { id: 'eq-1', ...data } } } as any);

    await equipmentApi.updateEquipment('eq-1', data as any);

    expect(mockPut).toHaveBeenCalledWith('/equipment/eq-1', data);
  });

  it('getIndividualEquipment calls GET /equipment/individual', async () => {
    mockGet.mockResolvedValue({ data: { items: [], total: 0 } } as any);

    await equipmentApi.getIndividualEquipment();

    expect(mockGet).toHaveBeenCalledWith('/equipment/individual', { params: undefined });
  });

  it('reportFault calls POST /equipment/individual/:id/faults', async () => {
    const faultData = { description: 'Engine overheating' };
    mockPost.mockResolvedValue({ data: { data: { id: 'f1', ...faultData } } } as any);

    await equipmentApi.reportFault('eq-1', faultData as any);

    expect(mockPost).toHaveBeenCalledWith('/equipment/individual/eq-1/faults', faultData);
  });

  it('assignDriver calls POST /equipment/individual/:id/drivers', async () => {
    const driverData = { personnelId: 'p-1' };
    mockPost.mockResolvedValue({ data: { data: { id: 'd1' } } } as any);

    await equipmentApi.assignDriver('eq-1', driverData as any);

    expect(mockPost).toHaveBeenCalledWith('/equipment/individual/eq-1/drivers', driverData);
  });

  it('getEquipmentHistory calls GET /equipment/individual/:id/history', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } } as any);

    await equipmentApi.getEquipmentHistory('eq-1');

    expect(mockGet).toHaveBeenCalledWith('/equipment/individual/eq-1/history');
  });
});
