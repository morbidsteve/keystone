import { create } from 'zustand';

type TimeFormat = 'relative' | 'absolute';

const STORAGE_KEY = 'keystone_time_format';

function getInitialTimeFormat(): TimeFormat {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'relative' || stored === 'absolute') return stored;
  } catch {
    // localStorage unavailable
  }
  return 'relative';
}

interface PreferencesState {
  timeFormat: TimeFormat;
  toggleTimeFormat: () => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  timeFormat: getInitialTimeFormat(),

  toggleTimeFormat: () =>
    set((state) => {
      const next: TimeFormat = state.timeFormat === 'relative' ? 'absolute' : 'relative';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return { timeFormat: next };
    }),
}));
