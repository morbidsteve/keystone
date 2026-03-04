import { create } from 'zustand';
import type { Report } from '@/lib/types';

interface ReportState {
  selectedReport: Report | null;
  generatedReports: Report[];
  setSelectedReport: (report: Report | null) => void;
  addReport: (report: Report) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  setReports: (reports: Report[]) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  selectedReport: null,
  generatedReports: [],

  setSelectedReport: (report) => set({ selectedReport: report }),

  addReport: (report) =>
    set((state) => ({
      generatedReports: [report, ...state.generatedReports],
    })),

  updateReport: (id, updates) =>
    set((state) => ({
      generatedReports: state.generatedReports.map((r) =>
        r.id === id ? { ...r, ...updates } : r,
      ),
      selectedReport:
        state.selectedReport?.id === id
          ? { ...state.selectedReport, ...updates }
          : state.selectedReport,
    })),

  setReports: (reports) => set({ generatedReports: reports }),
}));
