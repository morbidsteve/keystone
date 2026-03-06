import { create } from 'zustand';

interface HelpModeState {
  isHelpMode: boolean;
  toggleHelpMode: () => void;
  setHelpMode: (value: boolean) => void;
}

export const useHelpModeStore = create<HelpModeState>((set) => ({
  isHelpMode: false,
  toggleHelpMode: () => set((state) => ({ isHelpMode: !state.isHelpMode })),
  setHelpMode: (value: boolean) => set({ isHelpMode: value }),
}));

export const useHelpMode = () => useHelpModeStore();
