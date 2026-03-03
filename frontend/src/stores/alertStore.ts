import { create } from 'zustand';
import type { Alert } from '@/lib/types';
import * as alertsApi from '@/api/alerts';

interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchAlerts: (unitId?: string) => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
  setAlerts: (alerts: Alert[]) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchAlerts: async (unitId?: string) => {
    set({ isLoading: true });
    try {
      const alerts = await alertsApi.getAlerts({ unitId, acknowledged: false });
      set({
        alerts,
        unreadCount: alerts.filter((a) => !a.acknowledged).length,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({ isLoading: false, error: 'Failed to fetch alerts' });
    }
  },

  acknowledgeAlert: async (id: string) => {
    try {
      await alertsApi.acknowledgeAlert(id);
      const alerts = get().alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a,
      );
      set({
        alerts,
        unreadCount: alerts.filter((a) => !a.acknowledged).length,
      });
    } catch (err) {
      set({ error: 'Failed to acknowledge alert' });
    }
  },

  setAlerts: (alerts) =>
    set({
      alerts,
      unreadCount: alerts.filter((a) => !a.acknowledged).length,
    }),
}));
