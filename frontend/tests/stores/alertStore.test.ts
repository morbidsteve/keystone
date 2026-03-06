import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock dependencies
vi.mock('../../src/api/alerts', () => ({
  getAlerts: vi.fn(),
  acknowledgeAlert: vi.fn(),
}));

vi.mock('../../src/api/mockClient', () => ({
  isDemoMode: false,
  mockApi: {},
}));

vi.mock('../../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
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

import { useAlertStore } from '../../src/stores/alertStore';
import * as alertsApi from '../../src/api/alerts';

describe('Alert Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useAlertStore.setState({
        alerts: [],
        unreadCount: 0,
        isLoading: false,
        error: null,
      });
    });
  });

  it('initial state is empty', () => {
    const state = useAlertStore.getState();
    expect(state.alerts).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchAlerts loads alerts and computes unreadCount', async () => {
    const mockAlerts = [
      { id: '1', title: 'Alert 1', acknowledged: false, severity: 'CRITICAL' },
      { id: '2', title: 'Alert 2', acknowledged: true, severity: 'WARNING' },
      { id: '3', title: 'Alert 3', acknowledged: false, severity: 'INFO' },
    ];
    vi.mocked(alertsApi.getAlerts).mockResolvedValue(mockAlerts as any);

    await act(async () => {
      await useAlertStore.getState().fetchAlerts();
    });

    const state = useAlertStore.getState();
    expect(state.alerts).toEqual(mockAlerts);
    expect(state.unreadCount).toBe(2); // two not acknowledged
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchAlerts passes unitId to API', async () => {
    vi.mocked(alertsApi.getAlerts).mockResolvedValue([]);

    await act(async () => {
      await useAlertStore.getState().fetchAlerts('unit-42');
    });

    expect(alertsApi.getAlerts).toHaveBeenCalledWith({
      unitId: 'unit-42',
      acknowledged: false,
    });
  });

  it('fetchAlerts sets error on failure', async () => {
    vi.mocked(alertsApi.getAlerts).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await useAlertStore.getState().fetchAlerts();
    });

    const state = useAlertStore.getState();
    expect(state.error).toBe('Failed to fetch alerts');
    expect(state.isLoading).toBe(false);
    expect(state.alerts).toEqual([]);
  });

  it('fetchAlerts sets isLoading during fetch', async () => {
    let resolvePromise: (value: any) => void;
    vi.mocked(alertsApi.getAlerts).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const fetchPromise = act(async () => {
      const p = useAlertStore.getState().fetchAlerts();
      // After starting, loading should be true
      expect(useAlertStore.getState().isLoading).toBe(true);
      resolvePromise!([]);
      await p;
    });

    await fetchPromise;
    expect(useAlertStore.getState().isLoading).toBe(false);
  });

  it('acknowledgeAlert marks alert as acknowledged and updates count', async () => {
    act(() => {
      useAlertStore.setState({
        alerts: [
          { id: '1', title: 'Alert 1', acknowledged: false } as any,
          { id: '2', title: 'Alert 2', acknowledged: false } as any,
        ],
        unreadCount: 2,
      });
    });

    vi.mocked(alertsApi.acknowledgeAlert).mockResolvedValue({} as any);

    await act(async () => {
      await useAlertStore.getState().acknowledgeAlert('1');
    });

    const state = useAlertStore.getState();
    expect(state.alerts[0].acknowledged).toBe(true);
    expect(state.alerts[1].acknowledged).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it('acknowledgeAlert calls API with correct id', async () => {
    act(() => {
      useAlertStore.setState({
        alerts: [{ id: 'alert-99', acknowledged: false } as any],
        unreadCount: 1,
      });
    });

    vi.mocked(alertsApi.acknowledgeAlert).mockResolvedValue({} as any);

    await act(async () => {
      await useAlertStore.getState().acknowledgeAlert('alert-99');
    });

    expect(alertsApi.acknowledgeAlert).toHaveBeenCalledWith('alert-99');
  });

  it('acknowledgeAlert sets error on failure', async () => {
    act(() => {
      useAlertStore.setState({
        alerts: [{ id: '1', acknowledged: false } as any],
        unreadCount: 1,
      });
    });

    vi.mocked(alertsApi.acknowledgeAlert).mockRejectedValue(new Error('fail'));

    await act(async () => {
      await useAlertStore.getState().acknowledgeAlert('1');
    });

    const state = useAlertStore.getState();
    expect(state.error).toBe('Failed to acknowledge alert');
    // Alert should remain unchanged on error
    expect(state.alerts[0].acknowledged).toBe(false);
  });

  it('setAlerts updates alerts and computes unreadCount', () => {
    const alerts = [
      { id: '1', acknowledged: false },
      { id: '2', acknowledged: true },
      { id: '3', acknowledged: false },
      { id: '4', acknowledged: true },
    ] as any[];

    act(() => {
      useAlertStore.getState().setAlerts(alerts);
    });

    const state = useAlertStore.getState();
    expect(state.alerts).toEqual(alerts);
    expect(state.unreadCount).toBe(2);
  });

  it('setAlerts with all acknowledged results in zero unreadCount', () => {
    const alerts = [
      { id: '1', acknowledged: true },
      { id: '2', acknowledged: true },
    ] as any[];

    act(() => {
      useAlertStore.getState().setAlerts(alerts);
    });

    expect(useAlertStore.getState().unreadCount).toBe(0);
  });

  it('setAlerts with empty array results in zero unreadCount', () => {
    act(() => {
      useAlertStore.getState().setAlerts([]);
    });

    expect(useAlertStore.getState().unreadCount).toBe(0);
    expect(useAlertStore.getState().alerts).toEqual([]);
  });
});
