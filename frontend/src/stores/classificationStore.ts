import { create } from 'zustand';
import * as settingsApi from '@/api/settings';
import type { ClassificationSetting } from '@/api/settings';

interface ClassificationState {
  classification: ClassificationSetting;
  isLoading: boolean;
  fetchClassification: () => Promise<void>;
  updateClassification: (data: ClassificationSetting) => Promise<void>;
}

// Load persisted classification from localStorage for instant rendering
function getPersistedClassification(): ClassificationSetting {
  try {
    const stored = localStorage.getItem('keystone_classification');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // fall through
  }
  return { level: 'UNCLASSIFIED', banner_text: 'UNCLASSIFIED', color: 'green' };
}

export const useClassificationStore = create<ClassificationState>((set) => ({
  classification: getPersistedClassification(),
  isLoading: false,

  fetchClassification: async () => {
    set({ isLoading: true });
    try {
      const classification = await settingsApi.getClassification();
      localStorage.setItem('keystone_classification', JSON.stringify(classification));
      set({ classification, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updateClassification: async (data: ClassificationSetting) => {
    set({ isLoading: true });
    try {
      const classification = await settingsApi.updateClassification(data);
      localStorage.setItem('keystone_classification', JSON.stringify(classification));
      set({ classification, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Failed to update classification');
    }
  },
}));
