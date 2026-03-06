import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
vi.mock('../../src/api/alerts', () => ({
  getAlerts: vi.fn(),
  acknowledgeAlert: vi.fn(),
}));

vi.mock('../../src/stores/alertStore', () => {
  const setAlerts = vi.fn();
  const acknowledgeAlert = vi.fn();
  return {
    useAlertStore: vi.fn(() => ({
      alerts: [],
      unreadCount: 0,
      acknowledgeAlert,
      setAlerts,
    })),
    __mockSetAlerts: setAlerts,
    __mockAcknowledgeAlert: acknowledgeAlert,
  };
});

vi.mock('../../src/stores/dashboardStore', () => ({
  useDashboardStore: vi.fn(() => ({
    selectedUnitId: null,
  })),
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

import { useAlerts } from '../../src/hooks/useAlerts';
import * as alertsApi from '../../src/api/alerts';
import { useAlertStore } from '../../src/stores/alertStore';
import { useDashboardStore } from '../../src/stores/dashboardStore';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useAlerts hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns alerts from the store', () => {
    const mockAlerts = [
      { id: '1', title: 'Test Alert', severity: 'CRITICAL', acknowledged: false },
    ];
    vi.mocked(useAlertStore).mockReturnValue({
      alerts: mockAlerts as any,
      unreadCount: 1,
      acknowledgeAlert: vi.fn(),
      setAlerts: vi.fn(),
    });
    vi.mocked(alertsApi.getAlerts).mockResolvedValue(mockAlerts as any);

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.alerts).toEqual(mockAlerts);
    expect(result.current.unreadCount).toBe(1);
  });

  it('calls getAlerts with selectedUnitId', () => {
    vi.mocked(useDashboardStore).mockReturnValue({ selectedUnitId: 'unit-1' } as any);
    vi.mocked(alertsApi.getAlerts).mockResolvedValue([]);

    renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    expect(alertsApi.getAlerts).toHaveBeenCalledWith({ unitId: 'unit-1' });
  });

  it('calls getAlerts with undefined unitId when none selected', () => {
    vi.mocked(useDashboardStore).mockReturnValue({ selectedUnitId: null } as any);
    vi.mocked(alertsApi.getAlerts).mockResolvedValue([]);

    renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    expect(alertsApi.getAlerts).toHaveBeenCalledWith({ unitId: undefined });
  });

  it('provides acknowledgeAlert function', () => {
    const ackFn = vi.fn();
    vi.mocked(useAlertStore).mockReturnValue({
      alerts: [],
      unreadCount: 0,
      acknowledgeAlert: ackFn,
      setAlerts: vi.fn(),
    });
    vi.mocked(alertsApi.getAlerts).mockResolvedValue([]);

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.acknowledgeAlert).toBe(ackFn);
  });

  it('provides refetch function', () => {
    vi.mocked(alertsApi.getAlerts).mockResolvedValue([]);

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.refetch).toBe('function');
  });

  it('reports loading state', () => {
    // getAlerts never resolves so query stays loading
    vi.mocked(alertsApi.getAlerts).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('calls setAlerts when query data arrives', async () => {
    const mockAlerts = [
      { id: '1', title: 'Test', severity: 'INFO', acknowledged: false },
    ];
    const setAlertsFn = vi.fn();
    vi.mocked(useAlertStore).mockReturnValue({
      alerts: [],
      unreadCount: 0,
      acknowledgeAlert: vi.fn(),
      setAlerts: setAlertsFn,
    });
    vi.mocked(alertsApi.getAlerts).mockResolvedValue(mockAlerts as any);

    renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(setAlertsFn).toHaveBeenCalledWith(mockAlerts);
    });
  });
});
