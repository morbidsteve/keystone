import { create } from 'zustand';

interface DashboardState {
  selectedUnitId: string | null;
  selectedEchelon: string | null;
  timeRange: string;
  activeView: 'commander' | 's4' | 's3';
  setSelectedUnitId: (unitId: string | null) => void;
  setSelectedEchelon: (echelon: string | null) => void;
  setTimeRange: (range: string) => void;
  setActiveView: (view: 'commander' | 's4' | 's3') => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedUnitId: null,
  selectedEchelon: null,
  timeRange: '24h',
  activeView: 'commander',

  setSelectedUnitId: (unitId) => set({ selectedUnitId: unitId }),
  setSelectedEchelon: (echelon) => set({ selectedEchelon: echelon }),
  setTimeRange: (range) => set({ timeRange: range }),
  setActiveView: (view) => set({ activeView: view }),
}));
